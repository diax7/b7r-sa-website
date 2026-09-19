import { riyadh } from '@/lib/riyadh';
import { DIGEST_CRON, FRESHNESS_CRON } from '@/modules/ai-content/schedule';
import { SWEEP_CRON } from '@/modules/bookings/schedule';
import { duePrompts, type LedgerPrompt } from '@/modules/visibility/ledger/run';
import { LEDGER_CRON } from '@/modules/visibility/ledger/schedule';
import { PULL_CRON } from '@/modules/visibility/schedule';

export type ScheduleKey = 'pull' | 'ledger' | 'freshness' | 'digest' | 'bookings';

/**
 * The scheduled jobs the server section lists, each with the cron its task declares (the
 * same constant, so the two cannot drift), on the UTC clock the runtime keeps (Riyadh is
 * UTC+3 with no daylight saving): the nightly pull, the citation ledger, the weekly freshness
 * and digest, the bookings sweep every quarter hour. The engine's hourly tick is not a slot:
 * its next run is the engine card's, judged by the caps.
 */
export const SCHEDULES: ReadonlyArray<{ key: ScheduleKey; cron: string }> = [
  { key: 'pull', cron: PULL_CRON },
  { key: 'ledger', cron: LEDGER_CRON },
  { key: 'freshness', cron: FRESHNESS_CRON },
  { key: 'digest', cron: DIGEST_CRON },
  { key: 'bookings', cron: SWEEP_CRON },
];

const RIYADH_OFFSET_HOURS = 3;
const DAY_MS = 86_400_000;

export interface RiyadhSlot {
  hour: number;
  /** 0 is Sunday; null every day. */
  weekday: number | null;
}

/** Every N minutes of every hour (the bookings sweep). */
export interface IntervalSlot {
  everyMinutes: number;
}

export type Slot = RiyadhSlot | IntervalSlot;

export const isInterval = (slot: Slot): slot is IntervalSlot => 'everyMinutes' in slot;

/**
 * A task's cron as the dashboard reads it: `0 H * * D` as a Riyadh hour and an optional
 * weekday, or an every-N-minutes step; the two shapes the tasks use.
 */
export function riyadhSlot(cron: string): Slot {
  const every = /^\*\/(\d{1,2}) \* \* \* \*$/.exec(cron);
  if (every) return { everyMinutes: Number(every[1]) };
  const m = /^0 (\d{1,2}) \* \* (\*|[0-6])$/.exec(cron);
  if (!m) {
    throw new Error(
      `schedule: cannot read the cron "${cron}"; expected "0 H * * D" or an every-N-minutes step`,
    );
  }
  const utcHour = Number(m[1]);
  const hour = (utcHour + RIYADH_OFFSET_HOURS) % 24;
  const crossesMidnight = utcHour + RIYADH_OFFSET_HOURS >= 24;
  const weekday = m[2] === '*' ? null : (Number(m[2]) + (crossesMidnight ? 1 : 0)) % 7;
  return { hour, weekday };
}

/** The UTC instant a Riyadh day reads `hour:00`. */
function riyadhAt(dayKey: string, hour: number): Date {
  return new Date(`${dayKey}T${String(hour).padStart(2, '0')}:00:00+03:00`);
}

/** A Riyadh day key moved by whole days. */
export function addDays(dayKey: string, n: number): string {
  return riyadh(new Date(riyadhAt(dayKey, 12).getTime() + n * DAY_MS)).dateKey;
}

function weekdayOf(dayKey: string): number {
  return riyadhAt(dayKey, 12).getUTCDay();
}

/** The next time the slot comes round after `now`, on the Riyadh clock. */
export function nextOccurrence(slot: Slot, now: Date): Date {
  if (isInterval(slot)) {
    const step = slot.everyMinutes * 60_000;
    return new Date(Math.floor(now.getTime() / step) * step + step);
  }
  let day = riyadh(now).dateKey;
  if (riyadhAt(day, slot.hour).getTime() <= now.getTime()) day = addDays(day, 1);
  if (slot.weekday !== null) {
    while (weekdayOf(day) !== slot.weekday) day = addDays(day, 1);
  }
  return riyadhAt(day, slot.hour);
}

export const LEDGER_SLOT = riyadhSlot(LEDGER_CRON) as RiyadhSlot;

/** A prompt as the ledger page reads it: its period and the latest citation per connection. */
export type PromptWithLatest = LedgerPrompt & { latest: Record<number, { date: string }> };

/**
 * The next morning the ledger asks something (ADR-059, the CTO's edit): the first 07:00 Riyadh
 * ahead on which a prompt is due on an enabled connection, by the same `duePrompts` the run
 * uses against the last citation day of each prompt on each connection. A connection with no
 * row in the window is due at the next morning. Null when there is no prompt or no
 * connection: then the card says the plain sentence.
 */
export function nextLedgerMorning(args: {
  prompts: PromptWithLatest[];
  connections: number[];
  now: Date;
}): Date | null {
  const { prompts, connections, now } = args;
  if (prompts.length === 0 || connections.length === 0) return null;
  const first = riyadh(nextOccurrence(LEDGER_SLOT, now)).dateKey;
  const horizon = Math.max(...prompts.map((p) => p.everyDays));
  const plain: LedgerPrompt[] = prompts.map(({ latest: _latest, ...p }) => p);
  for (let i = 0; i <= horizon; i++) {
    const day = addDays(first, i);
    for (const connection of connections) {
      const lastAsked = new Map<number, string>();
      for (const p of prompts) {
        const row = p.latest[connection];
        if (row) lastAsked.set(p.id, row.date);
      }
      if (duePrompts(plain, lastAsked, day).length > 0) return riyadhAt(day, LEDGER_SLOT.hour);
    }
  }
  return null;
}
