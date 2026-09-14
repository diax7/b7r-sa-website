import type { Payload, TaskConfig } from 'payload';
import { enabledLocales } from '@/lib/cms/locale-enabled';
import { inLocale, PUBLISHED, publicRead } from '@/lib/cms/read';
import type { Locale } from '@/lib/i18n';
import { plainText } from '@/lib/lexical';
import { envAllows } from '@/modules/ai-content/caps';
import { statedNumbers } from '@/modules/ai-content/checks';
import type { FactNumber } from '@/modules/ai-content/facts';
import { payloadStore } from '@/modules/ai-content/store/payload-store';
import { AI_QUEUE, queueGeneratePost } from '@/modules/ai-content/workflow';
import type { Post } from '@/payload-types';

/**
 * The weekly freshness job (BRD 10.2.4 amendment, ADR-042): the oldest published engine
 * posts are read against the facts sheet; a post whose numbers were on the sheet when it
 * was written (`factsBaseline`, set by the engine or the seed) and are not any more is
 * regenerated from its stored outline with the current facts, under the same slug and
 * cover. `ai-edited` posts are never touched (human prose). Each language the site is in
 * is read on its own (ADR-043): the post's text in that language against that language's
 * unit words; the numbers are the same catalogue either way, and the regeneration runs in
 * the post's topic language.
 */
export const FRESHNESS_TASK = 'content-freshness' as const;
export const FRESHNESS_BATCH = 10;

export interface FreshnessCandidate {
  id: number;
  /** The language the text was read in; the unit words follow it. */
  locale: Locale;
  text: string;
  /** The facts sheet's numbers when the post was written (`posts.factsBaseline`). */
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
export function driftedNumbers(
  text: string,
  baseline: FactNumber[],
  current: FactNumber[],
  locale: Locale = 'ar',
) {
  const was = new Set(baseline.map(key));
  const is = new Set(current.map(key));
  return statedNumbers(text, locale)
    .filter((n) => was.has(key(n)) && !is.has(key(n)))
    .map((n) => n.raw);
}

export function driftedPosts(
  candidates: FreshnessCandidate[],
  current: FactNumber[],
): Array<{ id: number; drift: string[] }> {
  const seen = new Set<number>();
  return (
    candidates
      .map((c) => ({
        id: c.id,
        drift: [...new Set(driftedNumbers(c.text, c.baseline, current, c.locale))],
      }))
      .filter((c) => c.drift.length > 0)
      // A bilingual post drifted in both languages is one regeneration.
      .filter((c) => !seen.has(c.id) && seen.add(c.id))
  );
}

/** The oldest published `ai` posts of one language that carry a facts baseline. */
async function freshnessCandidates(
  payload: Payload,
  locale: Locale,
): Promise<FreshnessCandidate[]> {
  const posts = await payload.find({
    collection: 'posts',
    ...publicRead(locale),
    where: {
      and: [
        PUBLISHED,
        inLocale('title'),
        { origin: { equals: 'ai' } },
        { factsBaseline: { exists: true } },
      ],
    },
    depth: 0,
    limit: FRESHNESS_BATCH,
    sort: 'publishedAt',
  });
  return posts.docs
    .filter((post: Post) => Array.isArray(post.factsBaseline))
    .map((post: Post) => ({
      id: post.id,
      locale,
      text: plainText(post.body as never),
      baseline: post.factsBaseline as FactNumber[],
    }));
}

export async function freshness(payload: Payload): Promise<FreshnessResult> {
  const store = payloadStore(payload);
  const settings = await store.settings();
  if (!settings.enabled || !envAllows()) {
    return { checked: 0, queued: [], reason: 'the engine is switched off' };
  }
  // One catalogue, so one set of numbers (the Arabic sheet); the texts are read per language.
  const locales = await enabledLocales(payload);
  const [facts, ...perLocale] = await Promise.all([
    store.facts('ar'),
    ...locales.map((locale) => freshnessCandidates(payload, locale)),
  ]);
  const posts = perLocale.flat();
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
