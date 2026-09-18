import { riyadh } from '@/lib/riyadh';
import { duePrompts, type LedgerPrompt } from '@/modules/visibility/ledger/run';

export type ScheduleKey = 'pull' | 'ledger' | 'freshness' | 'digest';

/**
 * The crons the scheduled tasks declare, on the UTC clock the runtime keeps (Riyadh is UTC+3
 * with no daylight saving): the nightly pull (`visibility/pull.ts`), the citation ledger
 * (`visibility/ledger/run.ts`), the weekly freshness and digest (`ai-content/freshness.ts`,
 * `digest.ts`). Copied here so the dashboard stays light (the tasks import the AI SDKs);
 * `tests/dashboard.test.ts` holds each equal to its task's. The engine's hourly tick is not a
 * slot: its next run is the engine card's, judged by the caps.
 */
export const SCHEDULES: ReadonlyArray<{ key: ScheduleKey; cron: string }> = [
  { key: 'pull', cron: '0 1 * * *' },
  { key: 'ledger', cron: '0 4 * * *' },
  { key: 'freshness', cron: '0 3 * * 1' },
  { key: 'digest', cron: '0 5 * * 0' },
];

const RIYADH_OFFSET_HOURS = 3;
const DAY_MS = 86_400_000;

export interface RiyadhSlot {
  hour: number;
  /** 0 is Sunday; null every day. */
  weekday: number | null;
}

/** `0 H * * D` (the only shape the tasks use) as a Riyadh hour and an optional weekday. */
export function riyadhSlot(cron: string): RiyadhSlot {
  const m = /^0 (\d{1,2}) \* \* (\*|[0-6])$/.exec(cron);
  if (!m) throw new Error(`schedule: cannot read the cron "${cron}"; expected "0 H * * D"`);
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
export function nextOccurrence(slot: RiyadhSlot, now: Date): Date {
  let day = riyadh(now).dateKey;
  if (riyadhAt(day, slot.hour).getTime() <= now.getTime()) day = addDays(day, 1);
  if (slot.weekday !== null) {
    while (weekdayOf(day) !== slot.weekday) day = addDays(day, 1);
  }
  return riyadhAt(day, slot.hour);
}

export const LEDGER_SLOT: RiyadhSlot = riyadhSlot(SCHEDULES.find((s) => s.key === 'ledger')!.cron);

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
