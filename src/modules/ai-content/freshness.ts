import type { Payload, TaskConfig } from 'payload';
import { plainText } from '@/lib/lexical';
import { PUBLISHED } from '@/lib/cms/read';
import { envAllows } from '@/modules/ai-content/caps';
import { statedNumbers } from '@/modules/ai-content/checks';
import type { FactNumber } from '@/modules/ai-content/facts';
import { payloadStore } from '@/modules/ai-content/store/payload-store';
import { AI_QUEUE, queueGeneratePost } from '@/modules/ai-content/workflow';
import type { Post } from '@/payload-types';

/**
 * The weekly freshness job (BRD 10.2.4 amendment, ADR-042): the oldest published engine
 * posts are read against the facts sheet; a post whose numbers were on the sheet when it
 * was written and are not any more is regenerated from its stored outline with the current
 * facts, under the same slug and cover. `ai-edited` posts are never touched (human prose),
 * nor is a post without a run to compare against (the migrated three until regenerated).
 */
export const FRESHNESS_TASK = 'content-freshness' as const;
export const FRESHNESS_BATCH = 10;

export interface FreshnessCandidate {
  id: number;
  text: string;
  /** The facts sheet's numbers when the post was written (the run row keeps them). */
  baseline: FactNumber[];
}

export interface FreshnessResult {
  checked: number;
  /** Posts queued for regeneration, with what drifted. */
  queued: Array<{ id: number; drift: string[] }>;
  reason: string | null;
}

function key(n: { unit: string; value: number }): string {
  return `${n.unit}:${n.value}`;
}

/**
 * Pure: the numbers a post states that the sheet carried when it was written and does not
 * now. An illustrative figure that was never on the sheet is not drift (the review already
 * charged for it); a changed delivery promise or price is.
 */
export function driftedNumbers(text: string, baseline: FactNumber[], current: FactNumber[]) {
  const was = new Set(baseline.map(key));
  const is = new Set(current.map(key));
  return statedNumbers(text)
    .filter((n) => was.has(key(n)) && !is.has(key(n)))
    .map((n) => n.raw);
}

export function driftedPosts(
  candidates: FreshnessCandidate[],
  current: FactNumber[],
): Array<{ id: number; drift: string[] }> {
  return candidates
    .map((c) => ({ id: c.id, drift: [...new Set(driftedNumbers(c.text, c.baseline, current))] }))
    .filter((c) => c.drift.length > 0);
}

/** The oldest published `ai` posts that have a run with a facts baseline. */
async function freshnessCandidates(payload: Payload): Promise<FreshnessCandidate[]> {
  const runs = await payload.find({
    collection: 'ai-runs',
    where: { and: [{ status: { equals: 'done' } }, { post: { exists: true } }] },
    depth: 0,
    limit: 1000,
    pagination: false,
    sort: '-startedAt',
    overrideAccess: true,
  });
  const baselineByPost = new Map<number, FactNumber[]>();
  for (const run of runs.docs) {
    const id = typeof run.post === 'object' && run.post ? run.post.id : run.post;
    if (typeof id !== 'number' || baselineByPost.has(id) || !Array.isArray(run.facts)) continue;
    baselineByPost.set(id, run.facts as FactNumber[]);
  }
  if (baselineByPost.size === 0) return [];
  const posts = await payload.find({
    collection: 'posts',
    where: {
      and: [PUBLISHED, { origin: { equals: 'ai' } }, { id: { in: [...baselineByPost.keys()] } }],
    },
    depth: 0,
    limit: FRESHNESS_BATCH,
    sort: 'publishedAt',
    locale: 'ar',
    overrideAccess: true,
  });
  return posts.docs.map((post: Post) => ({
    id: post.id,
    text: plainText(post.body as never),
    baseline: baselineByPost.get(post.id) ?? [],
  }));
}

export async function freshness(payload: Payload): Promise<FreshnessResult> {
  const store = payloadStore(payload);
  const settings = await store.settings();
  if (!settings.enabled || !envAllows()) {
    return { checked: 0, queued: [], reason: 'the engine is switched off' };
  }
  const [facts, posts] = await Promise.all([store.facts(), freshnessCandidates(payload)]);
  const drifted = driftedPosts(posts, facts.numbers);
  for (const { id } of drifted) {
    // One job per post, queued in order; the `ai` queue serves them one at a time.
    // oxlint-disable-next-line no-await-in-loop
    await queueGeneratePost(payload, { replacePostId: id, kind: 'freshness' });
  }
  return { checked: posts.length, queued: drifted, reason: null };
}

export const freshnessTask: TaskConfig<{
  input: object;
  output: { checked: number; queued: number; reason: string | null };
}> = {
  slug: FRESHNESS_TASK,
  label: 'Content engine: weekly freshness',
  // Monday 06:00 Riyadh on a UTC clock (the production runtime; Riyadh has no DST).
  schedule: [{ cron: '0 3 * * 1', queue: AI_QUEUE }],
  inputSchema: [],
  outputSchema: [
    { name: 'checked', type: 'number' },
    { name: 'queued', type: 'number' },
    { name: 'reason', type: 'text' },
  ],
  handler: async ({ req }) => {
    const result = await freshness(req.payload);
    req.payload.logger.info({
      msg: `content engine freshness: ${result.checked} checked, ${result.queued.length} queued${result.reason ? ` (${result.reason})` : ''}`,
      posts: result.queued,
    });
    return {
      output: { checked: result.checked, queued: result.queued.length, reason: result.reason },
    };
  },
};
