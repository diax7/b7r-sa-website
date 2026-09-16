import type { Payload, TaskConfig } from 'payload';
import { env } from '@/lib/env';
import { fold } from '@/lib/arabic-fold';
import { PUBLISHED } from '@/lib/cms/read';
import { riyadh } from '@/lib/riyadh';
import { AI_QUEUE } from '@/modules/ai-content/workflow';
import { readConnection } from '@/modules/connections/read';
import { safeMessage } from '@/modules/connections/safe-message';
import { type MetricSource, upsertMetric } from '@/modules/visibility/metrics';
import { isBrandQuery } from '@/modules/visibility/rules/rest';
import { scoreOf } from '@/modules/visibility/score';
import { bingClient, type BingSnapshot } from '@/modules/visibility/services/bing';
import { pagespeedClient, type PageSpeedSnapshot } from '@/modules/visibility/services/pagespeed';
import {
  searchConsoleClient,
  type SearchConsoleSnapshot,
} from '@/modules/visibility/services/search-console';
import { buildSnapshot } from '@/modules/visibility/snapshot';

export const VISIBILITY_PULL = 'visibility-pull' as const;

export interface PullResult {
  date: string;
  pulled: MetricSource[];
  failed: Array<{ source: MetricSource; error: string }>;
  topicsAdded: number;
  score: number | null;
}

/** The one enabled connection of a service kind, with its secret revealed, or null. */
async function serviceConnection(payload: Payload, kind: string) {
  const found = await payload.find({
    collection: 'connections',
    where: { and: [{ kind: { equals: kind } }, { enabled: { equals: true } }] },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  });
  const id = found.docs[0]?.id;
  return id === undefined ? null : readConnection(payload, id);
}

/** The five pages PageSpeed audits (ADR-049 D4). */
export async function auditUrls(payload: Payload, base: string): Promise<string[]> {
  const [product, post] = await Promise.all([
    payload.find({
      collection: 'products',
      where: PUBLISHED,
      sort: 'sortOrder',
      limit: 1,
      depth: 0,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'posts',
      where: PUBLISHED,
      sort: '-publishedAt',
      limit: 1,
      depth: 0,
      overrideAccess: true,
    }),
  ]);
  const urls = ['/', '/products'];
  if (product.docs[0]) urls.push(`/products/${product.docs[0].slug}`);
  urls.push('/blog');
  if (post.docs[0]) urls.push(`/blog/${post.docs[0].slug}`);
  return urls.map((path) => new URL(path, base).toString());
}

export const TOPIC_MIN_IMPRESSIONS = 50;
export const TOPIC_QUERY_MAX = 100;

/** The topic's priority, 1 to 5 (the field's range): 50 impressions read 2, 1,000 read 4, 10,000 read 5. */
export function topicPriority(impressions: number): number {
  return Math.min(5, Math.max(1, Math.round(Math.log10(Math.max(impressions, 1) + 1) * 1.3)));
}

/**
 * The top Search Console queries as topics for the engine's backlog (BRD 11.4): non-brand,
 * bounded, in Arabic or Latin script, not already a topic; the hub with the most keyword
 * overlap (else the first), the priority by impressions.
 */
export async function suggestTopics(
  payload: Payload,
  snapshot: SearchConsoleSnapshot,
): Promise<number> {
  const [hubs, existing] = await Promise.all([
    payload.find({ collection: 'categories', depth: 0, pagination: false, overrideAccess: true }),
    payload.find({
      collection: 'ai-topics',
      depth: 0,
      pagination: false,
      overrideAccess: true,
      select: { primaryKeyword: true, title: true },
    }),
  ]);
  if (hubs.docs.length === 0) return 0;
  const known = new Set(
    existing.docs.flatMap((t) => [fold(t.primaryKeyword ?? ''), fold(t.title ?? '')]),
  );
  const script = /^[؀-ۿ\s\d]+$|^[A-Za-z\s\d'-]+$/;
  const candidates = snapshot.queries
    .filter((q) => q.impressions >= TOPIC_MIN_IMPRESSIONS && q.key.length <= TOPIC_QUERY_MAX)
    .filter((q) => script.test(q.key) && !isBrandQuery(q.key) && !known.has(fold(q.key)))
    .toSorted((a, b) => b.impressions - a.impressions);
  let added = 0;
  for (const q of candidates) {
    const words = new Set(fold(q.key).split(' '));
    const hub = hubs.docs
      .map((h) => ({
        h,
        overlap: [...words].filter((w) => fold(`${h.name} ${h.description ?? ''}`).includes(w))
          .length,
      }))
      .toSorted((a, b) => b.overlap - a.overlap)[0]!.h;
    const language = /[؀-ۿ]/.test(q.key) ? 'ar' : 'en';
    // One row per query, in order: the backlog is small and the API serial.
    // oxlint-disable-next-line no-await-in-loop
    await payload.create({
      collection: 'ai-topics',
      data: {
        title: q.key,
        language,
        hub: hub.id,
        primaryKeyword: q.key,
        intent: 'informational',
        priority: topicPriority(q.impressions),
        status: 'backlog',
        source: 'searchConsole',
      },
      depth: 0,
      overrideAccess: true,
    });
    added += 1;
  }
  return added;
}

/**
 * The nightly pull (ADR-049 D4): every connected service, one row per source for the day,
 * then the day's score row. A service whose pull fails writes no row and is named once; the
 * others go on. Runs on the `ai` queue, serial by ADR-033, so it never overlaps itself.
 */
export async function pull(payload: Payload, now = new Date()): Promise<PullResult> {
  const date = riyadh(now).dateKey;
  const base = env.siteUrl ?? 'https://b7r.sa';
  const result: PullResult = { date, pulled: [], failed: [], topicsAdded: 0, score: null };
  const attempt = async (
    source: MetricSource,
    secret: string | null,
    run: () => Promise<unknown>,
  ): Promise<unknown> => {
    try {
      const data = await run();
      await upsertMetric(payload, { date, source, data });
      result.pulled.push(source);
      return data;
    } catch (error) {
      result.failed.push({ source, error: safeMessage(error, secret) });
      payload.logger.warn({
        msg: `visibility pull: ${source} failed: ${safeMessage(error, secret)}`,
      });
      return null;
    }
  };
  const google = await serviceConnection(payload, 'google-search-console');
  if (google?.apiKey) {
    const snapshot = (await attempt('search-console', google.apiKey, () =>
      searchConsoleClient(google.apiKey!, base).pull(now),
    )) as SearchConsoleSnapshot | null;
    // The row is written; the topics are a courtesy on top and never cost it.
    if (snapshot) {
      try {
        result.topicsAdded = await suggestTopics(payload, snapshot);
      } catch (error) {
        payload.logger.warn({
          msg: `visibility pull: the topic suggestions failed: ${safeMessage(error, google.apiKey)}`,
        });
      }
    }
  }
  const bing = await serviceConnection(payload, 'bing-webmaster');
  if (bing?.apiKey) {
    await attempt('bing', bing.apiKey, () => bingClient(bing.apiKey!, base).pull());
  }
  const pagespeed = await serviceConnection(payload, 'pagespeed');
  if (pagespeed) {
    await attempt('pagespeed', pagespeed.apiKey, async () => {
      const snapshot: PageSpeedSnapshot = await pagespeedClient(pagespeed.apiKey).pull(
        await auditUrls(payload, base),
      );
      if (snapshot.audits.length === 0)
        throw new Error(snapshot.errors[0]?.error ?? 'no audit came back');
      return snapshot;
    });
  }
  await attempt('score', null, async () => {
    const score = scoreOf(await buildSnapshot(payload, { now }));
    result.score = score.overall;
    return {
      overall: score.overall,
      siteOnly: score.siteOnly,
      sections: Object.fromEntries(score.sections.map((s) => [s.key, s.percent])),
    };
  });
  return result;
}

export const visibilityPullTask: TaskConfig<{
  input: object;
  output: { pulled: string; failed: string; topicsAdded: number; score: number };
}> = {
  slug: VISIBILITY_PULL,
  label: 'Visibility: nightly pull',
  // 04:00 Riyadh on a UTC clock (the production runtime; Riyadh has no DST).
  schedule: [{ cron: '0 1 * * *', queue: AI_QUEUE }],
  inputSchema: [],
  outputSchema: [
    { name: 'pulled', type: 'text' },
    { name: 'failed', type: 'text' },
    { name: 'topicsAdded', type: 'number' },
    { name: 'score', type: 'number' },
  ],
  handler: async ({ req }) => {
    const result = await pull(req.payload);
    req.payload.logger.info({
      msg: `visibility pull: ${result.pulled.join(', ') || 'nothing pulled'}${result.failed.length ? `; failed: ${result.failed.map((f) => f.source).join(', ')}` : ''}; score ${result.score ?? '?'}`,
    });
    return {
      output: {
        pulled: result.pulled.join(','),
        failed: result.failed.map((f) => `${f.source}: ${f.error}`).join('; '),
        topicsAdded: result.topicsAdded,
        score: result.score ?? 0,
      },
    };
  },
};

/** "Pull now" on the page: one job, served by the `ai` queue within the minute. */
export function queuePull(payload: Payload) {
  return payload.jobs.queue({ task: VISIBILITY_PULL, queue: AI_QUEUE, input: {} });
}

export type { BingSnapshot, PageSpeedSnapshot, SearchConsoleSnapshot };
