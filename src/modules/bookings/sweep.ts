import type { Payload, TaskConfig, Where } from 'payload';
import { CALENDAR_RETRIES, UPCOMING_STATUSES } from '@/modules/bookings/status';
import { SWEEP_CRON } from '@/modules/bookings/schedule';
import { type BookingPorts, sendPair, syncCalendar } from '@/modules/bookings/service';
import type { BookingRow } from '@/modules/bookings/store';

/**
 * The sweep (ADR-062): every fifteen minutes, idempotent by the flags, with open-ended
 * windows so a late runner sends late rather than never. The 24-hour reminder, the 1-hour
 * reminder, the `completed` transition once the end has passed, and the calendar retry for
 * a failed event (three tries an hour apart, then it stays failed). The predicates are
 * pure and tested; the `where` clauses are the same windows for the database's pre-filter.
 *
 * The ports (the mailer, the calendar) are loaded when the task runs, never at import: this
 * file is in the Payload config's graph, which the CLI (`migrate`, `generate:types`) loads
 * under plain Node, where `server-only` throws.
 */
export const BOOKINGS_SWEEP = 'bookings-sweep' as const;
/** The sweep's own queue, one job at a time, so two runs never overlap and send twice. */
export const BOOKINGS_QUEUE = 'bookings' as const;

const HOUR_MS = 3_600_000;
export const DAY_REMINDER_MS = 24 * HOUR_MS;
export const HOUR_REMINDER_MS = HOUR_MS;
/** The gap between two calendar retries. */
export const RETRY_GAP_MS = HOUR_MS;

const active = (row: Pick<BookingRow, 'status'>) => UPCOMING_STATUSES.includes(row.status);

/** `start <= now + 24 h AND start > now + 1 h AND NOT reminded24h`, on an active booking. */
export function due24h(row: BookingRow, now: Date): boolean {
  const start = row.start.getTime();
  return (
    active(row) &&
    !row.reminded24h &&
    start <= now.getTime() + DAY_REMINDER_MS &&
    start > now.getTime() + HOUR_REMINDER_MS
  );
}

/** `start <= now + 1 h AND start > now AND NOT reminded1h`, on an active booking. */
export function due1h(row: BookingRow, now: Date): boolean {
  const start = row.start.getTime();
  return (
    active(row) &&
    !row.reminded1h &&
    start <= now.getTime() + HOUR_REMINDER_MS &&
    start > now.getTime()
  );
}

/** `end < now` on an active booking: it completed on its own. */
export function dueCompletion(row: BookingRow, now: Date): boolean {
  return active(row) && row.end.getTime() < now.getTime();
}

/** A failed event on a future active booking, under the retry cap, an hour past the last try. */
export function dueRetry(row: BookingRow, now: Date): boolean {
  return (
    active(row) &&
    row.calendar === 'failed' &&
    row.calendarAttempts < CALENDAR_RETRIES &&
    row.start.getTime() > now.getTime() &&
    (row.calendarAttemptAt === null ||
      row.calendarAttemptAt.getTime() <= now.getTime() - RETRY_GAP_MS)
  );
}

const ACTIVE: Where = { status: { in: [...UPCOMING_STATUSES] } };

/** The same windows as the predicates, for the database. */
export function sweepWindows(
  now: Date,
): Record<'reminder24h' | 'reminder1h' | 'complete' | 'retry', Where> {
  const iso = (ms: number) => new Date(now.getTime() + ms).toISOString();
  return {
    reminder24h: {
      and: [
        ACTIVE,
        { reminded24h: { not_equals: true } },
        { start: { less_than_equal: iso(DAY_REMINDER_MS) } },
        { start: { greater_than: iso(HOUR_REMINDER_MS) } },
      ],
    },
    reminder1h: {
      and: [
        ACTIVE,
        { reminded1h: { not_equals: true } },
        { start: { less_than_equal: iso(HOUR_REMINDER_MS) } },
        { start: { greater_than: iso(0) } },
      ],
    },
    complete: { and: [ACTIVE, { end: { less_than: iso(0) } }] },
    retry: {
      and: [
        ACTIVE,
        { calendar: { equals: 'failed' } },
        { calendarAttempts: { less_than: CALENDAR_RETRIES } },
        { start: { greater_than: iso(0) } },
      ],
    },
  };
}

export interface SweepResult {
  reminded24h: number[];
  reminded1h: number[];
  completed: number[];
  /** The rows whose event now exists: the link mail went out. */
  recovered: number[];
  /** The rows retried and refused again. */
  retried: number[];
}

/** One pass, in the order the windows are listed; a row's failure is a log line, the pass goes on. */
export async function sweep(ports: BookingPorts): Promise<SweepResult> {
  const now = ports.now();
  const windows = sweepWindows(now);
  const result: SweepResult = {
    reminded24h: [],
    reminded1h: [],
    completed: [],
    recovered: [],
    retried: [],
  };
  const guard = async (row: BookingRow, what: string, work: () => Promise<void>) => {
    try {
      await work();
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      ports.logger.warn(`booking ${row.id}: the sweep's ${what} failed: ${reason}`);
    }
  };

  const day = (await ports.store.find(windows.reminder24h)).filter((r) => due24h(r, now));
  for (const row of day) {
    // Sent, then flagged: a crash between the two sends twice, a crash before never sends.
    // oxlint-disable-next-line no-await-in-loop
    await guard(row, '24-hour reminder', async () => {
      await sendPair(ports, 'reminder24h', row, await ports.store.settings(row.locale), row.notes);
      await ports.store.update(row.id, { reminded24h: true });
      result.reminded24h.push(row.id);
    });
  }

  const hour = (await ports.store.find(windows.reminder1h)).filter((r) => due1h(r, now));
  for (const row of hour) {
    // oxlint-disable-next-line no-await-in-loop
    await guard(row, '1-hour reminder', async () => {
      await sendPair(ports, 'reminder1h', row, await ports.store.settings(row.locale), row.notes);
      // A runner so late the day window passed too: the day flag closes with it.
      await ports.store.update(row.id, { reminded1h: true, reminded24h: true });
      result.reminded1h.push(row.id);
    });
  }

  const ended = (await ports.store.find(windows.complete)).filter((r) => dueCompletion(r, now));
  for (const row of ended) {
    // oxlint-disable-next-line no-await-in-loop
    await guard(row, 'completion', async () => {
      await ports.store.update(row.id, { status: 'completed' });
      result.completed.push(row.id);
    });
  }

  const failed = (await ports.store.find(windows.retry)).filter((r) => dueRetry(r, now));
  for (const row of failed) {
    // oxlint-disable-next-line no-await-in-loop
    await guard(row, 'calendar retry', async () => {
      const settings = await ports.store.settings(row.locale);
      const synced = await syncCalendar(ports, row, settings, row.notes, row.calendarAttempts + 1);
      if (synced.calendar === 'synced') {
        await sendPair(ports, 'link', synced, settings, row.notes);
        result.recovered.push(row.id);
      } else {
        result.retried.push(row.id);
      }
    });
  }
  return result;
}

const summary = (result: SweepResult) =>
  `bookings sweep: ${result.reminded24h.length} day reminders, ${result.reminded1h.length} hour reminders, ${result.completed.length} completed, ${result.recovered.length} events recovered, ${result.retried.length} still failed`;

export const bookingsSweepTask: TaskConfig<{
  input: object;
  output: { reminded: number; completed: number; recovered: number; retried: number };
}> = {
  slug: BOOKINGS_SWEEP,
  label: 'Bookings: reminders and calendar retries',
  schedule: [{ cron: SWEEP_CRON, queue: BOOKINGS_QUEUE }],
  inputSchema: [],
  outputSchema: [
    { name: 'reminded', type: 'number' },
    { name: 'completed', type: 'number' },
    { name: 'recovered', type: 'number' },
    { name: 'retried', type: 'number' },
  ],
  handler: async ({ req }) => {
    const result = await runSweep(req.payload);
    req.payload.logger.info({ msg: summary(result) });
    return {
      output: {
        reminded: result.reminded24h.length + result.reminded1h.length,
        completed: result.completed.length,
        recovered: result.recovered.length,
        retried: result.retried.length,
      },
    };
  },
};

/** One pass over the live ports, for the task and for a script on a live database. */
export async function runSweep(payload: Payload): Promise<SweepResult> {
  const { bookingPorts } = await import('@/modules/bookings/ports');
  return sweep(await bookingPorts(payload));
}
