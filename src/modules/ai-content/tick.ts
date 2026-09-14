import type { Payload, TaskConfig } from 'payload';
import { type CapCounts, capDecision, type CapSettings } from '@/modules/ai-content/caps';
import { payloadStore } from '@/modules/ai-content/store/payload-store';
import { AI_QUEUE, queueGeneratePost } from '@/modules/ai-content/workflow';

/**
 * The hourly tick (BRD 10.2.4 scheduling, ADR-042): a Payload schedule on the `ai` queue
 * that queues one `generatePost` when every guard passes and the Riyadh hour has reached
 * the publish hour with no post started today. The default `beforeSchedule` keeps one tick
 * queued at a time; the pipeline checks the same guards again when the job runs.
 */
export const CONTENT_TICK = 'content-tick' as const;

export interface TickDecision {
  queue: boolean;
  reason: string | null;
}

/** Pure: the tick's answer at `now`; a run counts from the moment it starts. */
export function tickDecision(args: {
  settings: CapSettings;
  counts: CapCounts;
  now: Date;
  env?: Record<string, string | undefined>;
}): TickDecision {
  const decision = capDecision({ ...args, manual: false, kind: 'generate' });
  return { queue: decision.allowed, reason: decision.reason };
}

export async function tick(payload: Payload, now = new Date()): Promise<TickDecision> {
  const store = payloadStore(payload);
  const [settings, counts] = await Promise.all([store.settings(), store.counts(now)]);
  const decision = tickDecision({ settings, counts, now });
  if (decision.queue) await queueGeneratePost(payload, {});
  return decision;
}

export const contentTickTask: TaskConfig<{
  input: object;
  output: { queued: boolean; reason: string | null };
}> = {
  slug: CONTENT_TICK,
  label: 'Content engine: hourly tick',
  // Every hour on the hour; the hour itself is judged in Riyadh time by the guards.
  schedule: [{ cron: '0 * * * *', queue: AI_QUEUE }],
  inputSchema: [],
  outputSchema: [
    { name: 'queued', type: 'checkbox' },
    { name: 'reason', type: 'text' },
  ],
  handler: async ({ req }) => {
    const decision = await tick(req.payload);
    req.payload.logger.info({
      msg: `content engine tick: ${decision.queue ? 'queued a run' : `quiet (${decision.reason})`}`,
    });
    return { output: { queued: decision.queue, reason: decision.reason } };
  },
};
