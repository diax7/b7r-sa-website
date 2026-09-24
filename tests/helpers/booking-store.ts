import type { Where } from 'payload';
import { TEST_PALETTE } from './mail-palette';
import type { BookingSettings } from '@/content/schema';
import { booking as seed } from '@/content/seed/booking';
import type { BookingMailer, OutgoingMail } from '@/lib/booking-mail';
import type { CalendarClient, EventInput } from '@/modules/bookings/google';
import type { BookingLogger, BookingPorts } from '@/modules/bookings/service';
import {
  type BookingPatch,
  type BookingRow,
  type BookingStore,
  type NewBooking,
  SlotTaken,
} from '@/modules/bookings/store';

/**
 * The booking flows' ports in memory (ADR-062): a store that keeps the partial unique
 * index's promise (one active row per start), a calendar that records its calls and fails
 * on demand, a mailer that keeps its outbox, a clock the test sets. What the routes' tests
 * and the sweep's tests run against.
 */
export const SECRET = 'a-test-secret-that-is-long-enough-to-sign-with';

export function memoryStore(settings: Partial<BookingSettings> = {}) {
  const rows = new Map<number, BookingRow>();
  let nextId = 1;
  const current: BookingSettings = { ...seed, enabled: true, ...settings };
  const activeAt = (start: Date, except?: number) =>
    [...rows.values()].some(
      (r) => r.id !== except && r.status !== 'cancelled' && r.start.getTime() === start.getTime(),
    );
  const store: BookingStore & { rows: Map<number, BookingRow>; settingsRef: BookingSettings } = {
    rows,
    settingsRef: current,
    async settings() {
      return current;
    },
    async activeBetween(from, to) {
      return [...rows.values()]
        .filter((r) => r.status !== 'cancelled' && r.start >= from && r.start < to)
        .toSorted((a, b) => a.start.getTime() - b.start.getTime());
    },
    async byId(id) {
      return rows.get(id) ?? null;
    },
    async create(data: NewBooking) {
      if (activeAt(data.start)) throw new SlotTaken('the slot is taken');
      const row: BookingRow = {
        id: nextId++,
        name: data.name,
        email: data.email,
        phone: data.phone,
        locale: data.locale,
        start: data.start,
        end: data.end,
        status: 'booked',
        meetLink: null,
        googleEventId: null,
        meetRequestId: data.meetRequestId,
        calendar: data.calendar,
        calendarAttempts: 0,
        calendarAttemptAt: null,
        reminded24h: false,
        reminded1h: false,
        page: data.page,
        notes: data.notes,
        createdAt: new Date(),
      };
      rows.set(row.id, row);
      return row;
    },
    async update(id, patch: BookingPatch) {
      const row = rows.get(id);
      if (!row) throw new Error(`no row ${id}`);
      if (patch.start && activeAt(patch.start, id)) throw new SlotTaken('the slot is taken');
      const next = { ...row, ...patch } as BookingRow;
      rows.set(id, next);
      return next;
    },
    async find(where: Where) {
      // The sweep's tests hand in the rows they mean through `rows`; the windows are tested
      // on the pure helpers, so a where clause is answered with every row in start order.
      void where;
      return [...rows.values()].toSorted((a, b) => a.start.getTime() - b.start.getTime());
    },
  };
  return store;
}

export interface RecordedCalendar extends CalendarClient {
  calls: Array<{ method: string; args: unknown[] }>;
  events: Map<string, EventInput & { meetLink: string | null }>;
  fail: boolean;
  /** The next created event answers without a Meet link. */
  pendingMeet: boolean;
}

export function recordedCalendar(
  options: { fail?: boolean; busy?: Array<{ start: Date; end: Date }> } = {},
): RecordedCalendar {
  let counter = 0;
  const calendar: RecordedCalendar = {
    calls: [],
    events: new Map(),
    fail: options.fail ?? false,
    pendingMeet: false,
    async freeBusy(from, to) {
      calendar.calls.push({ method: 'freeBusy', args: [from, to] });
      if (calendar.fail) throw new Error('calendar down');
      return options.busy ?? [];
    },
    async createEvent(input) {
      calendar.calls.push({ method: 'createEvent', args: [input] });
      if (calendar.fail) throw new Error('calendar down');
      counter += 1;
      const eventId = `evt-${counter}`;
      const meetLink = calendar.pendingMeet ? null : `https://meet.google.com/test-${counter}`;
      calendar.events.set(eventId, { ...input, meetLink });
      return { eventId, meetLink };
    },
    async moveEvent(eventId, start, end) {
      calendar.calls.push({ method: 'moveEvent', args: [eventId, start, end] });
      if (calendar.fail) throw new Error('calendar down');
      const event = calendar.events.get(eventId);
      if (event) calendar.events.set(eventId, { ...event, start, end });
    },
    async deleteEvent(eventId) {
      calendar.calls.push({ method: 'deleteEvent', args: [eventId] });
      if (calendar.fail) throw new Error('calendar down');
      calendar.events.delete(eventId);
    },
    async meetLinkOf(eventId) {
      calendar.calls.push({ method: 'meetLinkOf', args: [eventId] });
      if (calendar.fail) throw new Error('calendar down');
      const event = calendar.events.get(eventId);
      if (!event) return null;
      if (!event.meetLink) {
        event.meetLink = `https://meet.google.com/late-${eventId}`;
      }
      return event.meetLink;
    },
  };
  return calendar;
}

export function recordedMailer(): BookingMailer & { outbox: OutgoingMail[]; fail: boolean } {
  const mailer = {
    kind: 'mock' as const,
    outbox: [] as OutgoingMail[],
    fail: false,
    async send(mail: OutgoingMail) {
      if (mailer.fail) return { ok: false as const, status: 500 as const };
      mailer.outbox.push(mail);
      return { ok: true as const };
    },
  };
  return mailer;
}

export function recordedLogger(): BookingLogger & { lines: string[] } {
  const lines: string[] = [];
  return {
    lines,
    info: (msg) => lines.push(`info: ${msg}`),
    warn: (msg) => lines.push(`warn: ${msg}`),
  };
}

/** The recorded calendar unless a test hands in another client (the mock, a wrapper) or none. */
export interface TestPorts<
  C extends CalendarClient | null = RecordedCalendar,
> extends BookingPorts {
  store: ReturnType<typeof memoryStore>;
  calendar: C;
  mailer: ReturnType<typeof recordedMailer>;
  logger: ReturnType<typeof recordedLogger>;
  clock: { now: Date };
}

/** Ports over the memory pieces; `now` is Sunday 2026-09-20 09:00 Riyadh unless set. */
export function testPorts<C extends CalendarClient | null = RecordedCalendar>(
  options: {
    settings?: Partial<BookingSettings>;
    calendar?: C;
    now?: Date;
  } = {},
): TestPorts<C> {
  const clock = { now: options.now ?? new Date('2026-09-20T06:00:00Z') };
  return {
    store: memoryStore(options.settings),
    calendar: (options.calendar === undefined ? recordedCalendar() : options.calendar) as C,
    mailer: recordedMailer(),
    now: () => clock.now,
    siteUrl: 'https://b7r.sa',
    adminUrl: 'https://b7r.sa/admin',
    ownerEmail: 'contact@b7r.sa',
    palette: TEST_PALETTE,
    logger: recordedLogger(),
    secret: SECRET,
    clock,
  };
}
