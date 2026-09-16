/**
 * Bing Webmaster Tools by API key (ADR-049): the JSON service at `ssl.bing.com`. The key
 * travels in the query string, so no request URL is ever logged (`safeMessage` strips URLs
 * from the errors that reach a row). Pure parsers over the API's `{ d: [...] }` shape.
 */
const API = 'https://ssl.bing.com/webmaster/api.svc/json';
export const BING_TOP_ROWS = 25;

export interface BingDay {
  date: string;
  clicks: number;
  impressions: number;
}

export interface BingQuery {
  query: string;
  clicks: number;
  impressions: number;
  position: number;
}

export interface BingSnapshot {
  siteUrl: string;
  days: BingDay[];
  totals: { clicks: number; impressions: number };
  queries: BingQuery[];
}

/**
 * `/Date(1700000000000)/` or an ISO string, as `YYYY-MM-DD`. An ISO string keeps its own
 * date: parsing one without a zone would read it in the server's zone and shift the day.
 */
export function bingDate(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const iso = /^(\d{4}-\d{2}-\d{2})/.exec(value);
  if (iso) return iso[1]!;
  const ms = /\/Date\((\d+)\)\//.exec(value);
  const date = ms ? new Date(Number(ms[1])) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function rows(body: unknown): Array<Record<string, unknown>> {
  const d = (body as { d?: unknown } | null)?.d;
  return Array.isArray(d) ? (d as Array<Record<string, unknown>>) : [];
}

export function parseUserSites(body: unknown): string[] {
  return rows(body).flatMap((r) => (typeof r['Url'] === 'string' ? [r['Url']] : []));
}

export function parseTrafficStats(body: unknown): BingDay[] {
  return rows(body).flatMap((r) => {
    const date = bingDate(r['Date']);
    return date
      ? [{ date, clicks: Number(r['Clicks'] ?? 0), impressions: Number(r['Impressions'] ?? 0) }]
      : [];
  });
}

export function parseQueryStats(body: unknown): BingQuery[] {
  const byQuery = new Map<string, BingQuery>();
  for (const r of rows(body)) {
    const query = r['Query'];
    if (typeof query !== 'string') continue;
    const row = byQuery.get(query) ?? { query, clicks: 0, impressions: 0, position: 0 };
    row.clicks += Number(r['Clicks'] ?? 0);
    row.impressions += Number(r['Impressions'] ?? 0);
    row.position = Number(r['AvgImpressionPosition'] ?? r['AvgClickPosition'] ?? row.position);
    byQuery.set(query, row);
  }
  return [...byQuery.values()]
    .toSorted((a, b) => b.impressions - a.impressions)
    .slice(0, BING_TOP_ROWS);
}

export interface BingClient {
  sites(): Promise<string[]>;
  pull(): Promise<BingSnapshot>;
}

export function bingClient(
  apiKey: string,
  siteUrl: string,
  fetcher: typeof fetch = fetch,
): BingClient {
  const call = async (method: string, params: Record<string, string> = {}) => {
    const url = new URL(`${API}/${method}`);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    url.searchParams.set('apikey', apiKey);
    const res = await fetcher(url, { signal: AbortSignal.timeout(20_000) });
    if (!res.ok) throw new Error(`Bing Webmaster answered ${res.status}`);
    return res.json() as Promise<unknown>;
  };
  return {
    sites: async () => parseUserSites(await call('GetUserSites')),
    async pull() {
      const [traffic, queries] = await Promise.all([
        call('GetRankAndTrafficStats', { siteUrl }),
        call('GetQueryStats', { siteUrl }),
      ]);
      const days = parseTrafficStats(traffic).slice(-28);
      return {
        siteUrl,
        days,
        totals: {
          clicks: days.reduce((n, d) => n + d.clicks, 0),
          impressions: days.reduce((n, d) => n + d.impressions, 0),
        },
        queries: parseQueryStats(queries),
      };
    },
  };
}
