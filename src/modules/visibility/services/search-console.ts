import { accessToken, SEARCH_CONSOLE_SCOPE } from '@/lib/google-jwt';
import { parseServiceAccount, type ServiceAccountKey } from '@/lib/service-account';

/**
 * Google Search Console through a service account (ADR-049): the account is a user of the
 * property, the token comes from the JWT flow, the property is the domain one
 * (`sc-domain:b7r.sa`) or the URL prefix. A 28-day window ending three days back, since the
 * API's data lags. Pure parsers over the API's shapes, so the tests feed recorded bodies.
 */
const API = 'https://www.googleapis.com/webmasters/v3';
export const SEARCH_CONSOLE_LAG_DAYS = 3;
export const SEARCH_CONSOLE_WINDOW_DAYS = 28;
export const TOP_ROWS = 25;

export interface SearchConsoleRow {
  key: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SearchConsoleSnapshot {
  property: string;
  from: string;
  to: string;
  totals: { clicks: number; impressions: number; ctr: number; position: number };
  queries: SearchConsoleRow[];
  pages: SearchConsoleRow[];
  countries: SearchConsoleRow[];
}

/** The property for a site URL: the domain property, which covers every host and scheme. */
export function propertyFor(siteUrl: string): string {
  return `sc-domain:${new URL(siteUrl).hostname.replace(/^www\./, '')}`;
}

/** The window `[from, to]` as `YYYY-MM-DD`, ending `lag` days before `now`. */
export function windowEnding(
  now: Date,
  lag = SEARCH_CONSOLE_LAG_DAYS,
  days = SEARCH_CONSOLE_WINDOW_DAYS,
): { from: string; to: string } {
  const to = new Date(now.getTime() - lag * 86_400_000);
  const from = new Date(to.getTime() - (days - 1) * 86_400_000);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

/** The rows of a `searchAnalytics.query` answer, one key each. */
export function parseRows(body: unknown): SearchConsoleRow[] {
  const rows = (body as { rows?: unknown[] } | null)?.rows;
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((r) => {
    const row = r as {
      keys?: unknown[];
      clicks?: number;
      impressions?: number;
      ctr?: number;
      position?: number;
    };
    const key = row.keys?.[0];
    if (typeof key !== 'string') return [];
    return [
      {
        key,
        clicks: Number(row.clicks ?? 0),
        impressions: Number(row.impressions ?? 0),
        ctr: Number(row.ctr ?? 0),
        position: Number(row.position ?? 0),
      },
    ];
  });
}

/** The sites the account may read, from `sites.list`. */
export function parseSites(body: unknown): Array<{ siteUrl: string; permissionLevel: string }> {
  const entries = (body as { siteEntry?: unknown[] } | null)?.siteEntry;
  if (!Array.isArray(entries)) return [];
  return entries.flatMap((e) => {
    const entry = e as { siteUrl?: unknown; permissionLevel?: unknown };
    return typeof entry.siteUrl === 'string'
      ? [{ siteUrl: entry.siteUrl, permissionLevel: String(entry.permissionLevel ?? '') }]
      : [];
  });
}

export interface SearchConsoleClient {
  /** The account may read the property: the Test. */
  sites(): Promise<Array<{ siteUrl: string; permissionLevel: string }>>;
  /** The window's totals and top rows: the nightly pull. */
  pull(now: Date): Promise<SearchConsoleSnapshot>;
}

export function searchConsoleClient(
  secret: string,
  siteUrl: string,
  fetcher: typeof fetch = fetch,
): SearchConsoleClient {
  const parsed = parseServiceAccount(secret);
  if (typeof parsed === 'string') throw new Error(`Search Console: ${parsed}`);
  const key: ServiceAccountKey = parsed;
  const property = propertyFor(siteUrl);
  const call = async (path: string, init: RequestInit = {}) => {
    const token = await accessToken(key, SEARCH_CONSOLE_SCOPE, fetcher);
    const res = await fetcher(`${API}${path}`, {
      ...init,
      headers: {
        ...init.headers,
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) throw new Error(`Search Console answered ${res.status}`);
    return res.json() as Promise<unknown>;
  };
  const query = async (from: string, to: string, dimension?: string) =>
    parseRows(
      await call(`/sites/${encodeURIComponent(property)}/searchAnalytics/query`, {
        method: 'POST',
        body: JSON.stringify({
          startDate: from,
          endDate: to,
          ...(dimension ? { dimensions: [dimension], rowLimit: TOP_ROWS } : { rowLimit: 1 }),
        }),
      }),
    );
  return {
    sites: async () => parseSites(await call('/sites')),
    async pull(now) {
      const { from, to } = windowEnding(now);
      const [totals, queries, pages, countries] = await Promise.all([
        query(from, to),
        query(from, to, 'query'),
        query(from, to, 'page'),
        query(from, to, 'country'),
      ]);
      const total = totals[0] ?? { key: '', clicks: 0, impressions: 0, ctr: 0, position: 0 };
      return {
        property,
        from,
        to,
        totals: {
          clicks: total.clicks,
          impressions: total.impressions,
          ctr: total.ctr,
          position: total.position,
        },
        queries,
        pages,
        countries,
      };
    },
  };
}
