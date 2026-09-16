/**
 * PageSpeed Insights by API key (ADR-049): one Lighthouse run per URL and strategy, 90 s each
 * (a mobile audit takes 15 to 40 s), one URL at a time so a failure loses that URL only. The
 * scores are Lighthouse's 0 to 1, stored as 0 to 100; LCP and CLS from the lab run, INP from
 * the field data when Chrome has enough of it.
 */
const API = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
export const PAGESPEED_TIMEOUT_MS = 90_000;
export const PAGESPEED_CATEGORIES = [
  'performance',
  'accessibility',
  'best-practices',
  'seo',
] as const;

export interface PageSpeedAudit {
  url: string;
  strategy: 'mobile' | 'desktop';
  /** Lighthouse's 0 to 1 as 0 to 100; null when the answer lacks the category. */
  scores: {
    performance: number | null;
    accessibility: number | null;
    bestPractices: number | null;
    seo: number | null;
  };
  lcpMs: number | null;
  cls: number | null;
  inpMs: number | null;
}

export interface PageSpeedSnapshot {
  audits: PageSpeedAudit[];
  /** URLs whose run failed, with the reason (never the key: the URL is stripped). */
  errors: Array<{ url: string; strategy: 'mobile' | 'desktop'; error: string }>;
}

function score(body: Record<string, unknown>, category: string): number | null {
  const categories = (
    body['lighthouseResult'] as { categories?: Record<string, { score?: number }> } | undefined
  )?.categories;
  const raw = categories?.[category]?.score;
  return typeof raw === 'number' ? Math.round(raw * 100) : null;
}

function labValue(body: Record<string, unknown>, id: string): number | null {
  const audits = (
    body['lighthouseResult'] as { audits?: Record<string, { numericValue?: number }> } | undefined
  )?.audits;
  const value = audits?.[id]?.numericValue;
  return typeof value === 'number' ? value : null;
}

function field(body: Record<string, unknown>, metric: string): number | null {
  const metrics = (
    body['loadingExperience'] as { metrics?: Record<string, { percentile?: number }> } | undefined
  )?.metrics;
  const value = metrics?.[metric]?.percentile;
  return typeof value === 'number' ? value : null;
}

/** One run's answer as the snapshot stores it. */
export function parseAudit(
  url: string,
  strategy: 'mobile' | 'desktop',
  body: unknown,
): PageSpeedAudit {
  const b = (body ?? {}) as Record<string, unknown>;
  return {
    url,
    strategy,
    scores: {
      performance: score(b, 'performance'),
      accessibility: score(b, 'accessibility'),
      bestPractices: score(b, 'best-practices'),
      seo: score(b, 'seo'),
    },
    lcpMs: labValue(b, 'largest-contentful-paint'),
    cls: labValue(b, 'cumulative-layout-shift'),
    inpMs: field(b, 'INTERACTION_TO_NEXT_PAINT'),
  };
}

export interface PageSpeedClient {
  audit(url: string, strategy: 'mobile' | 'desktop'): Promise<PageSpeedAudit>;
  /** Every URL on both strategies, one at a time, a failure recorded rather than thrown. */
  pull(urls: string[]): Promise<PageSpeedSnapshot>;
}

export function pagespeedClient(
  apiKey: string | null,
  fetcher: typeof fetch = fetch,
): PageSpeedClient {
  const audit = async (url: string, strategy: 'mobile' | 'desktop') => {
    const target = new URL(API);
    target.searchParams.set('url', url);
    target.searchParams.set('strategy', strategy);
    for (const c of PAGESPEED_CATEGORIES) target.searchParams.append('category', c);
    if (apiKey) target.searchParams.set('key', apiKey);
    const res = await fetcher(target, { signal: AbortSignal.timeout(PAGESPEED_TIMEOUT_MS) });
    if (!res.ok) throw new Error(`PageSpeed answered ${res.status}`);
    return parseAudit(url, strategy, await res.json());
  };
  return {
    audit,
    async pull(urls) {
      const out: PageSpeedSnapshot = { audits: [], errors: [] };
      for (const url of urls) {
        for (const strategy of ['mobile', 'desktop'] as const) {
          try {
            // One at a time: the API rate-limits and a failure must cost one URL, not the pull.
            // oxlint-disable-next-line no-await-in-loop
            out.audits.push(await audit(url, strategy));
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            out.errors.push({
              url,
              strategy,
              error: message.replace(/https?:\/\/\S+/g, '[url]').slice(0, 200),
            });
          }
        }
      }
      return out;
    },
  };
}
