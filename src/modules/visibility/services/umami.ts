/**
 * Umami by API key (ADR-048 amended, Level 4 PR 4c): the people numbers of the site, which
 * Umami counts for every visitor (it loads without consent; GA4 only after it). Umami Cloud
 * answers at `https://api.umami.is/v1` with the key as a Bearer token; a self-hosted Umami
 * (`umami.b7r.app`) answers the same shape under `<address>/api` with its login token. One
 * `stats` call per day on Riyadh day boundaries, the boundary every other `metrics` source
 * keeps, so the dashboard never sums two different days. Pure parsers over the API's shape.
 */
import type { Payload } from 'payload';
import { riyadh } from '@/lib/riyadh';

export const UMAMI_CLOUD_API = 'https://api.umami.is/v1';
/** Umami Cloud allows 50 calls every 15 seconds; this spacing stays under 40. */
export const UMAMI_CALL_GAP_MS = 400;
const DAY_MS = 86_400_000;

/** One day's numbers as `stats` answers them and as the `metrics` row keeps them. */
export interface UmamiDay {
  visitors: number;
  pageviews: number;
  visits: number;
  bounces: number;
  /** Seconds on the site, summed over the visits. */
  totaltime: number;
}

/** The API's address for a row: the Cloud when the row names none, else the row's under `/api`. */
export function umamiApi(baseUrl: string | null | undefined): string {
  const root = (baseUrl ?? '').trim().replace(/\/+$/, '');
  if (!root) return UMAMI_CLOUD_API;
  return root.endsWith('/api') ? root : `${root}/api`;
}

/**
 * The `startAt` and `endAt` of a Riyadh day in milliseconds: its midnight (UTC+3, no daylight
 * saving) to the last millisecond before the next. A day that spans two UTC days is still one
 * window.
 */
export function dayWindow(dayRiyadh: string): { startAt: number; endAt: number } {
  const startAt = Date.parse(`${dayRiyadh}T00:00:00+03:00`);
  if (Number.isNaN(startAt)) throw new Error(`Umami: not a day: ${dayRiyadh}`);
  return { startAt, endAt: startAt + DAY_MS - 1 };
}

/** The Riyadh day `n` days before `now` (`1` is yesterday). */
export function riyadhDayBefore(now: Date, n: number): string {
  return riyadh(new Date(now.getTime() - n * DAY_MS)).dateKey;
}

/** A number as the API writes it: bare, or `{ value }` on an older self-hosted release. */
function figure(value: unknown): number {
  const raw =
    typeof value === 'object' && value !== null ? (value as { value?: unknown }).value : value;
  const n = Number(raw ?? 0);
  return Number.isFinite(n) ? n : 0;
}

/** The five numbers of a `stats` answer; `comparison` is ignored (our rows compare themselves). */
export function parseStats(body: unknown): UmamiDay {
  const b = (body ?? {}) as Record<string, unknown>;
  return {
    visitors: figure(b['visitors']),
    pageviews: figure(b['pageviews']),
    visits: figure(b['visits']),
    bounces: figure(b['bounces']),
    totaltime: figure(b['totaltime']),
  };
}

export interface UmamiClient {
  /** One day's numbers: the Test (yesterday) and the pull (each missing day). */
  day(dayRiyadh: string): Promise<UmamiDay>;
}

export function umamiClient(
  apiKey: string,
  websiteId: string,
  options: { baseUrl?: string | null; fetcher?: typeof fetch } = {},
): UmamiClient {
  const fetcher = options.fetcher ?? fetch;
  const api = umamiApi(options.baseUrl);
  return {
    async day(dayRiyadh) {
      const { startAt, endAt } = dayWindow(dayRiyadh);
      const url = new URL(`${api}/websites/${encodeURIComponent(websiteId)}/stats`);
      url.searchParams.set('startAt', String(startAt));
      url.searchParams.set('endAt', String(endAt));
      const res = await fetcher(url, {
        headers: { accept: 'application/json', authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(20_000),
      });
      if (!res.ok) throw new Error(`Umami answered ${res.status}`);
      return parseStats(await res.json());
    },
  };
}

/** The Umami website id from Site settings, Analytics (ADR-052), or null while it is empty. */
export async function umamiWebsiteId(payload: Payload): Promise<string | null> {
  const settings = await payload.findGlobal({
    slug: 'site-settings',
    depth: 0,
    overrideAccess: true,
    select: { analytics: true },
  });
  const id = settings.analytics?.umamiId?.trim();
  return id ? id : null;
}
