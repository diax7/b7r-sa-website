/**
 * Umami by API key (ADR-048 amended, Level 4 PR 4c): the people numbers of the site, which
 * Umami counts for every visitor (it loads without consent; GA4 only after it). Umami Cloud
 * answers at `https://api.umami.is/v1` with the key as a Bearer token; a self-hosted Umami
 * (`umami.b7r.app`) answers the same shape under `<address>/api` with its login token. One
 * `stats` call per day on Riyadh day boundaries, the boundary every other `metrics` source
 * keeps, so the dashboard never sums two different days; and one per dashboard range ending
 * yesterday, since a range's visitors are its unique people, not its days' uniques added up
 * (a merchant who came on three days is one visitor, as Umami's own dashboard counts). Pure
 * parsers over the API's shape.
 */
import type { Payload } from 'payload';
import { riyadh } from '@/lib/riyadh';

export const UMAMI_CLOUD_API = 'https://api.umami.is/v1';
/** Umami Cloud allows 50 calls every 15 seconds; this spacing stays under 40. */
export const UMAMI_CALL_GAP_MS = 400;
const DAY_MS = 86_400_000;

/** One window's numbers as `stats` answers them and as the `metrics` row keeps them. */
export interface UmamiDay {
  visitors: number;
  pageviews: number;
  visits: number;
  bounces: number;
  /** Seconds on the site, summed over the visits. */
  totaltime: number;
}

/** The dashboard's ranges (`DASHBOARD_RANGES`, kept equal by a test): the pull reads each ending yesterday. */
export const UMAMI_RANGES = [7, 30, 90] as const;
export type UmamiRangeDays = (typeof UMAMI_RANGES)[number];

/** A range's numbers with the previous range's, from `stats` with `compare=prev`. */
export interface UmamiRange extends UmamiDay {
  previous: UmamiDay;
}

/** A `metrics` row of the source: the day's numbers, and on yesterday's row the ranges ending that day. */
export interface UmamiRow extends UmamiDay {
  ranges?: Partial<Record<UmamiRangeDays, UmamiRange>>;
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

/** The window of `days` Riyadh days ending on `endDayRiyadh`, inclusive, in milliseconds. */
export function rangeWindow(
  endDayRiyadh: string,
  days: number,
): { startAt: number; endAt: number } {
  const end = dayWindow(endDayRiyadh);
  return { startAt: end.startAt - (days - 1) * DAY_MS, endAt: end.endAt };
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

/** The five numbers of a `stats` answer; the `comparison` is read by `parseRange`. */
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

/** A range's `stats` answer with its `comparison`: the previous range of the same length. */
export function parseRange(body: unknown): UmamiRange {
  const b = (body ?? {}) as Record<string, unknown>;
  return { ...parseStats(b), previous: parseStats(b['comparison']) };
}

export interface UmamiClient {
  /** One day's numbers: the Test (yesterday) and the pull (each missing day). */
  day(dayRiyadh: string): Promise<UmamiDay>;
  /** A range's numbers ending on a day, with the previous range's: the pull, on yesterday. */
  range(endDayRiyadh: string, days: number): Promise<UmamiRange>;
}

export function umamiClient(
  apiKey: string,
  websiteId: string,
  options: { baseUrl?: string | null; fetcher?: typeof fetch } = {},
): UmamiClient {
  const fetcher = options.fetcher ?? fetch;
  const api = umamiApi(options.baseUrl);
  const stats = async (window: { startAt: number; endAt: number }, compare?: 'prev') => {
    const url = new URL(`${api}/websites/${encodeURIComponent(websiteId)}/stats`);
    url.searchParams.set('startAt', String(window.startAt));
    url.searchParams.set('endAt', String(window.endAt));
    if (compare) url.searchParams.set('compare', compare);
    const res = await fetcher(url, {
      headers: { accept: 'application/json', authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) throw new Error(`Umami answered ${res.status}`);
    return res.json() as Promise<unknown>;
  };
  return {
    day: async (dayRiyadh) => parseStats(await stats(dayWindow(dayRiyadh))),
    range: async (endDayRiyadh, days) =>
      parseRange(await stats(rangeWindow(endDayRiyadh, days), 'prev')),
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
