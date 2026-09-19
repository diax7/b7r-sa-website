import type { Config } from 'payload';
import { digestTask } from '@/modules/ai-content/digest';
import { freshnessTask } from '@/modules/ai-content/freshness';
import { contentTickTask } from '@/modules/ai-content/tick';
import { AI_QUEUE } from '@/modules/ai-content/workflow';
import { BOOKINGS_QUEUE, bookingsSweepTask } from '@/modules/bookings/sweep';
import { indexNowTask } from '@/modules/cms/jobs/indexnow';
import { citationLedgerTask } from '@/modules/visibility/ledger/run';
import { visibilityPullTask } from '@/modules/visibility/pull';

type Tasks = NonNullable<NonNullable<Config['jobs']>['tasks']>;

/** Every task the in-process runner knows (ADR-033); the config lists them as they are. */
export const TASKS: Tasks = [
  indexNowTask,
  contentTickTask,
  freshnessTask,
  digestTask,
  visibilityPullTask,
  citationLedgerTask,
  bookingsSweepTask,
];

export interface RunnerTick {
  /** Croner syntax; six fields name the second, five fields tick at second 0. */
  cron: string;
  /** The queue the tick runs; none is the default queue. */
  queue?: string;
  limit: number;
}

/**
 * The runner's ticks, one per queue (ADR-033, ADR-042, ADR-062): the default queue serves
 * IndexNow and scheduled publishes; the `ai` queue runs one content-engine job at a time
 * and carries the engine's schedules (the hourly tick, the weekly freshness pass and
 * digest, the nightly pull, the ledger); the `bookings` queue runs the sweep alone, one at
 * a time, so two passes never send a reminder twice.
 *
 * Two queues with scheduled tasks never tick in the same second: Payload's scheduler reads
 * the `payload-jobs-stats` global once per tick and writes it back whole
 * (`queues/operations/handleSchedules/defaultAfterSchedule.js`), so two ticks in the same
 * second overwrite each other's `lastScheduledRun`, and the loser's schedule fires on every
 * tick (the sweep ran every minute, 2026-09-19). The bookings tick sits at second 30; a
 * third queue with a schedule takes a second of its own (`tests/jobs-runner.test.ts`).
 */
export const AUTO_RUN: readonly RunnerTick[] = [
  { cron: '* * * * *', limit: 10 },
  { cron: '* * * * *', queue: AI_QUEUE, limit: 1 },
  { cron: '30 * * * * *', queue: BOOKINGS_QUEUE, limit: 1 },
];

/** The second of the minute a runner tick fires at: a six-field cron's first field, else 0. */
export function tickSecond(cron: string): number {
  const fields = cron.trim().split(/\s+/);
  if (fields.length < 6) return 0;
  const second = Number(fields[0]);
  if (!Number.isInteger(second) || second < 0 || second > 59) {
    throw new Error(`runner tick: the seconds field must be one number, got "${fields[0]}"`);
  }
  return second;
}

/** The queues whose tasks carry a schedule: the ticks that do the scheduler's bookkeeping. */
export function scheduledQueues(tasks: Tasks = TASKS): string[] {
  const queues = new Set<string>();
  for (const task of tasks) {
    for (const schedule of task.schedule ?? []) queues.add(schedule.queue);
  }
  return [...queues].toSorted();
}
