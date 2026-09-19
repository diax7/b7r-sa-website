import type { Payload } from 'payload';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatMinutesSeconds } from '@/modules/cms/admin/format';
import { peopleSummary, type PeopleSummary } from '@/modules/cms/admin/dashboard/readers';
import { dashboardTiles, type TileInputs } from '@/modules/cms/admin/dashboard/tile-data';
import { Connections } from '@/modules/connections/collection';
import { testConnection } from '@/modules/connections/test';
import { METRIC_SOURCES, Metrics } from '@/modules/visibility/metrics';
import {
  pull,
  UMAMI_FIRST_RUN_DAYS,
  UMAMI_NIGHTLY_DAYS,
  umamiDaysToPull,
} from '@/modules/visibility/pull';
import { SERVICE_TESTS } from '@/modules/visibility/services/tests';
import { DASHBOARD_RANGES } from '@/modules/cms/admin/dashboard/rules';
import {
  dayWindow,
  parseRange,
  parseStats,
  rangeWindow,
  riyadhDayBefore,
  UMAMI_CLOUD_API,
  UMAMI_RANGES,
  type UmamiRow,
  umamiApi,
  umamiClient,
  umamiWebsiteId,
} from '@/modules/visibility/services/umami';
import type { TrafficSummary } from '@/modules/traffic/summary';

/** A `stats` answer as Umami Cloud writes it (its docs, 2026-09-19), the comparison included. */
const RECORDED_STATS = {
  pageviews: 15171,
  visitors: 4415,
  visits: 5680,
  bounces: 3567,
  totaltime: 809968,
  comparison: {
    pageviews: 38675,
    visitors: 10568,
    visits: 14595,
    bounces: 9364,
    totaltime: 2182387,
  },
};

/** A fetch that answers every `stats` call with a body and a status, recording the calls. */
function fakeFetch(body: unknown = RECORDED_STATS, status = 200) {
  const calls: Array<{ url: string; headers: Record<string, string> }> = [];
  const fetcher = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(input), headers: (init?.headers ?? {}) as Record<string, string> });
    return Response.json(body, { status });
  }) as typeof fetch;
  return { fetcher, calls };
}

const WEBSITE = '3b2b1c1a-0000-4000-8000-000000000001';

/**
 * A Payload holding one Umami connection, the site's website id, the latest `umami` rows
 * given, and a drizzle handle that records every metrics upsert as `date:source`.
 */
function umamiPayload(options: {
  apiKey?: string | null;
  baseUrl?: string | null;
  websiteId?: string | null;
  latest?: string[];
  connected?: boolean;
}) {
  const written: string[] = [];
  const rows: Record<string, UmamiRow> = {};
  const updated: Array<Record<string, unknown>> = [];
  const payload = {
    find: async ({ collection, where }: { collection: string; where: unknown }) => {
      if (collection === 'connections') {
        const asked = JSON.stringify(where).includes('umami');
        const docs =
          asked && options.connected !== false ? [{ id: 9, kind: 'umami', enabled: true }] : [];
        return { docs, totalDocs: docs.length };
      }
      if (collection === 'metrics') {
        const docs = (options.latest ?? []).map((date) => ({ date, source: 'umami', data: {} }));
        return { docs, totalDocs: docs.length };
      }
      return { docs: [], totalDocs: 0 };
    },
    findByID: async () => ({
      id: 9,
      kind: 'umami',
      apiKey: options.apiKey === undefined ? 'um_key_1234567890' : options.apiKey,
      baseUrl: options.baseUrl ?? null,
      model: '',
      enabled: true,
    }),
    findGlobal: async ({ slug }: { slug: string }) => {
      if (slug === 'site-settings') {
        return {
          analytics: { umamiId: options.websiteId === undefined ? WEBSITE : options.websiteId },
        };
      }
      throw new Error(`no global ${slug} in this test`);
    },
    update: async ({ data }: { data: Record<string, unknown> }) => {
      updated.push(data);
      return data;
    },
    db: {
      drizzle: {
        // `upsertMetric`'s statement carries the date, the source and the JSON as parameters.
        execute: async (q: { queryChunks?: unknown[] }) => {
          const params = (q.queryChunks ?? []).filter((c) => typeof c === 'string');
          written.push(`${params[0]}:${params[1]}`);
          rows[String(params[0])] = JSON.parse(String(params[2])) as UmamiRow;
        },
      },
    },
    logger: { warn: () => {}, info: () => {}, error: () => {} },
  } as unknown as Payload;
  return { payload, written, rows, updated };
}

describe('the Umami service (ADR-048 amended, Level 4 PR 4c)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('parses the recorded stats body into the five numbers and ignores the comparison', () => {
    expect(parseStats(RECORDED_STATS)).toEqual({
      visitors: 4415,
      pageviews: 15171,
      visits: 5680,
      bounces: 3567,
      totaltime: 809968,
    });
    // An older self-hosted release wraps each number as `{ value, prev }`; a hole reads 0.
    expect(parseStats({ visitors: { value: 7, prev: 3 }, pageviews: null })).toMatchObject({
      visitors: 7,
      pageviews: 0,
      visits: 0,
    });
    expect(parseStats(undefined)).toEqual({
      visitors: 0,
      pageviews: 0,
      visits: 0,
      bounces: 0,
      totaltime: 0,
    });
    // A range keeps its comparison as the previous range; a body without one reads zeros.
    expect(parseRange(RECORDED_STATS)).toEqual({
      ...parseStats(RECORDED_STATS),
      previous: {
        visitors: 10568,
        pageviews: 38675,
        visits: 14595,
        bounces: 9364,
        totaltime: 2182387,
      },
    });
    expect(parseRange({ visitors: 3 }).previous).toEqual(parseStats(undefined));
  });

  it('opens a Riyadh day at its UTC+3 midnight: one window even when the day is two UTC days', () => {
    // 2026-09-18 Riyadh runs from 2026-09-17T21:00Z to 2026-09-18T20:59:59.999Z.
    const { startAt, endAt } = dayWindow('2026-09-18');
    expect(new Date(startAt).toISOString()).toBe('2026-09-17T21:00:00.000Z');
    expect(new Date(endAt).toISOString()).toBe('2026-09-18T20:59:59.999Z');
    expect(endAt - startAt).toBe(86_400_000 - 1);
    // The next day's window starts one millisecond later: no overlap, no gap.
    expect(dayWindow('2026-09-19').startAt).toBe(endAt + 1);
    expect(() => dayWindow('yesterday')).toThrow(/not a day/);
    // A range of N days ending on a day: from the first day's midnight to that day's last ms.
    expect(rangeWindow('2026-09-18', 7)).toEqual({
      startAt: dayWindow('2026-09-12').startAt,
      endAt: dayWindow('2026-09-18').endAt,
    });
    expect(rangeWindow('2026-09-18', 1)).toEqual(dayWindow('2026-09-18'));
    expect(UMAMI_RANGES).toEqual([...DASHBOARD_RANGES]);
    // "Yesterday" at 01:00 UTC (04:00 Riyadh) is the Riyadh day before, whatever UTC says.
    expect(riyadhDayBefore(new Date('2026-09-19T01:00:00Z'), 1)).toBe('2026-09-18');
    expect(riyadhDayBefore(new Date('2026-09-18T22:00:00Z'), 1)).toBe('2026-09-18');
  });

  it('calls the Cloud by default with the Bearer key, or a self-hosted address under /api', async () => {
    expect(umamiApi(null)).toBe(UMAMI_CLOUD_API);
    expect(umamiApi('')).toBe(UMAMI_CLOUD_API);
    expect(umamiApi('https://umami.b7r.app/')).toBe('https://umami.b7r.app/api');
    expect(umamiApi('https://umami.b7r.app/api')).toBe('https://umami.b7r.app/api');
    const { fetcher, calls } = fakeFetch();
    const day = await umamiClient('um_key', WEBSITE, { fetcher }).day('2026-09-18');
    expect(day.visitors).toBe(4415);
    expect(calls).toHaveLength(1);
    const url = new URL(calls[0]!.url);
    expect(url.origin + url.pathname).toBe(`${UMAMI_CLOUD_API}/websites/${WEBSITE}/stats`);
    expect(url.searchParams.get('startAt')).toBe(String(dayWindow('2026-09-18').startAt));
    expect(url.searchParams.get('endAt')).toBe(String(dayWindow('2026-09-18').endAt));
    expect(calls[0]!.headers['authorization']).toBe('Bearer um_key');
    expect(url.searchParams.has('compare')).toBe(false);
    const range = await umamiClient('um_key', WEBSITE, { fetcher }).range('2026-09-18', 30);
    expect(range.previous.visitors).toBe(10568);
    const rangeUrl = new URL(calls[1]!.url);
    expect(rangeUrl.searchParams.get('compare')).toBe('prev');
    expect(rangeUrl.searchParams.get('startAt')).toBe(
      String(rangeWindow('2026-09-18', 30).startAt),
    );
    expect(rangeUrl.searchParams.get('endAt')).toBe(String(dayWindow('2026-09-18').endAt));
    const own = fakeFetch();
    await umamiClient('t', WEBSITE, { baseUrl: 'https://umami.b7r.app', fetcher: own.fetcher }).day(
      '2026-09-18',
    );
    expect(own.calls[0]!.url).toMatch(/^https:\/\/umami\.b7r\.app\/api\/websites\//);
    // A refusal is the status, never the key (the URL carries none).
    const refused = fakeFetch({ error: 'unauthorized' }, 401);
    await expect(
      umamiClient('um_key', WEBSITE, { fetcher: refused.fetcher }).day('2026-09-18'),
    ).rejects.toThrow(/Umami answered 401/);
  });
});

describe("the pull's Umami days (ADR-048 amended)", () => {
  const now = new Date('2026-09-19T01:00:00Z'); // 04:00 Riyadh, 2026-09-19

  it('reads 90 days through yesterday on the first run, then the last two complete days', () => {
    const first = umamiDaysToPull(null, now);
    expect(first).toHaveLength(UMAMI_FIRST_RUN_DAYS);
    expect(first[0]).toBe('2026-06-21');
    expect(first[first.length - 1]).toBe('2026-09-18');
    expect(umamiDaysToPull('2026-09-18', now)).toEqual(['2026-09-17', '2026-09-18']);
    expect(umamiDaysToPull('2026-09-18', now)).toHaveLength(UMAMI_NIGHTLY_DAYS);
    // A newest row of today (a pull that ran twice) still re-reads the two days.
    expect(umamiDaysToPull('2026-09-19', now)).toEqual(['2026-09-17', '2026-09-18']);
  });

  it('fills a gap from the day after the newest row, never more than 90 days', () => {
    expect(umamiDaysToPull('2026-09-10', now)).toEqual([
      '2026-09-11',
      '2026-09-12',
      '2026-09-13',
      '2026-09-14',
      '2026-09-15',
      '2026-09-16',
      '2026-09-17',
      '2026-09-18',
    ]);
    expect(umamiDaysToPull('2026-01-01', now)).toHaveLength(UMAMI_FIRST_RUN_DAYS);
  });

  it('writes one metrics row per day read, names a failure, and skips without the connection', async () => {
    const { fetcher, calls } = fakeFetch();
    vi.stubGlobal('fetch', fetcher);
    try {
      const nightly = umamiPayload({ latest: ['2026-09-18'] });
      const result = await pull(nightly.payload, now, { umamiGapMs: 0 });
      expect(result.pulled).toContain('umami');
      expect(result.umamiDays).toEqual(['2026-09-17', '2026-09-18']);
      expect(nightly.written).toEqual(['2026-09-17:umami', '2026-09-18:umami']);
      // Two days, plus the three ranges ending yesterday (7, 30, 90 with `compare=prev`),
      // written into yesterday's row; the day before carries none.
      expect(calls).toHaveLength(5);
      const rangeCalls = calls.slice(2).map((c) => new URL(c.url));
      expect(rangeCalls.map((u) => u.searchParams.get('compare'))).toEqual([
        'prev',
        'prev',
        'prev',
      ]);
      expect(rangeCalls.map((u) => Number(u.searchParams.get('startAt')))).toEqual(
        [7, 30, 90].map((n) => rangeWindow('2026-09-18', n).startAt),
      );
      expect(
        rangeCalls.every(
          (u) => u.searchParams.get('endAt') === String(dayWindow('2026-09-18').endAt),
        ),
      ).toBe(true);
      expect(nightly.rows['2026-09-17']!.ranges).toBeUndefined();
      const ranges = nightly.rows['2026-09-18']!.ranges!;
      expect(
        Object.keys(ranges)
          .map(Number)
          .toSorted((a, b) => a - b),
      ).toEqual([7, 30, 90]);
      for (const n of UMAMI_RANGES) {
        expect(ranges[n]).toEqual(parseRange(RECORDED_STATS));
      }
      expect(nightly.rows['2026-09-18']).toMatchObject(parseStats(RECORDED_STATS));
      // The first run: 90 days and the three ranges, 93 calls, 90 rows.
      const first = umamiPayload({ latest: [] });
      const firstResult = await pull(first.payload, now, { umamiGapMs: 0 });
      expect(firstResult.umamiDays).toHaveLength(90);
      expect(first.written.filter((w) => w.endsWith(':umami'))).toHaveLength(90);
      expect(calls).toHaveLength(5 + 93);
      expect(first.rows['2026-09-18']!.ranges![30]!.previous).toEqual(
        parseStats(RECORDED_STATS.comparison),
      );
      // No website id: named, nothing written, the pull goes on to the score.
      const noId = umamiPayload({ websiteId: '' });
      const refused = await pull(noId.payload, now, { umamiGapMs: 0 });
      expect(refused.failed.map((f) => f.source)).toContain('umami');
      expect(refused.failed.find((f) => f.source === 'umami')?.error).toMatch(/website id/);
      expect(noId.written.filter((w) => w.endsWith(':umami'))).toEqual([]);
      // No connection: not pulled, not failed.
      const off = umamiPayload({ connected: false });
      const skipped = await pull(off.payload, now, { umamiGapMs: 0 });
      expect(skipped.pulled).not.toContain('umami');
      expect(skipped.failed.map((f) => f.source)).not.toContain('umami');
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('stops at the call that fails and keeps the rows before it', async () => {
    const failingAt = (k: number) => {
      let n = 0;
      return (async () =>
        ++n === k
          ? Response.json({}, { status: 500 })
          : Response.json(RECORDED_STATS)) as typeof fetch;
    };
    // The second day's call fails: one row stands, no ranges.
    vi.stubGlobal('fetch', failingAt(2));
    try {
      const { payload, written } = umamiPayload({ latest: ['2026-09-18'] });
      const result = await pull(payload, now, { umamiGapMs: 0 });
      expect(written.filter((w) => w.endsWith(':umami'))).toEqual(['2026-09-17:umami']);
      expect(result.failed.find((f) => f.source === 'umami')?.error).toMatch(/answered 500/);
    } finally {
      vi.unstubAllGlobals();
    }
    // A range call fails: yesterday's row is not written at all, so it never lacks its ranges.
    vi.stubGlobal('fetch', failingAt(4));
    try {
      const { payload, written } = umamiPayload({ latest: ['2026-09-18'] });
      const result = await pull(payload, now, { umamiGapMs: 0 });
      expect(written.filter((w) => w.endsWith(':umami'))).toEqual(['2026-09-17:umami']);
      expect(result.failed.map((f) => f.source)).toContain('umami');
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe('the Umami connection Test', () => {
  afterEach(() => vi.unstubAllGlobals());
  // One Test per connection per ten seconds: each call below tests a different row.
  let id = 100;
  const next = () => ++id;

  it("reads yesterday's numbers for the site's website id and records them", async () => {
    vi.stubGlobal('fetch', fakeFetch().fetcher);
    const { payload, updated } = umamiPayload({});
    const result = await testConnection(payload, next(), SERVICE_TESTS, 'en');
    const yesterday = riyadhDayBefore(new Date(), 1);
    expect(result).toEqual({ ok: true, message: `${yesterday}: 4415 visitors, 15171 page views` });
    expect(updated[0]).toMatchObject({ lastTestOk: true, lastTestMessage: result.message });
    const arabic = await testConnection(umamiPayload({}).payload, next(), SERVICE_TESTS, 'ar');
    expect(arabic.ok).toBe(true);
    expect(arabic.message).toMatch(/زائراً/);
    expect(arabic.message).toMatch(/مشاهدة صفحة/);
  });

  it('answers a 401 as the service said it, without the key', async () => {
    vi.stubGlobal('fetch', fakeFetch({ error: 'nope' }, 401).fetcher);
    const { payload, updated } = umamiPayload({ apiKey: 'um_key_1234567890' });
    const result = await testConnection(payload, next(), SERVICE_TESTS, 'en');
    expect(result).toMatchObject({ ok: false, status: 502, message: 'Umami answered 401' });
    expect(updated[0]).toMatchObject({ lastTestOk: false });
    expect(JSON.stringify(updated)).not.toContain('um_key_1234567890');
  });

  it('refuses a missing website id in the tester’s language, before any call', async () => {
    const { fetcher, calls } = fakeFetch();
    vi.stubGlobal('fetch', fetcher);
    const en = await testConnection(
      umamiPayload({ websiteId: '  ' }).payload,
      next(),
      SERVICE_TESTS,
      'en',
    );
    expect(en).toMatchObject({
      ok: false,
      message: 'No Umami website id in Site settings, Analytics: fill it first, then test.',
    });
    const ar = await testConnection(
      umamiPayload({ websiteId: null }).payload,
      next(),
      SERVICE_TESTS,
      'ar',
    );
    expect(ar.ok).toBe(false);
    expect(ar.message).toMatch(/^لا معرّف موقع في Umami/);
    expect(calls).toEqual([]);
    expect(await umamiWebsiteId(umamiPayload({}).payload)).toBe(WEBSITE);
    // No key saved: the shared refusal, before the id is looked at.
    const noKey = await testConnection(
      umamiPayload({ apiKey: null }).payload,
      next(),
      SERVICE_TESTS,
    );
    expect(noKey).toMatchObject({ ok: false, message: expect.stringMatching(/no key saved/) });
  });
});

describe('the Umami kind in the config (rules 4 and 13)', () => {
  it('lists umami among the connection kinds and the metric sources, with the address optional', () => {
    const row = Connections.fields.find((f) => f.type === 'row') as {
      fields: Array<Record<string, unknown>>;
    };
    const kind = row.fields.find((f) => f['name'] === 'kind') as {
      options: Array<{ value: string }>;
    };
    expect(kind.options.map((o) => o.value)).toContain('umami');
    expect(METRIC_SOURCES).toContain('umami');
    const source = (
      (
        Metrics.fields.find((f) => f.type === 'row') as { fields: Array<Record<string, unknown>> }
      ).fields.find((f) => f['name'] === 'source') as { options: Array<{ value: string }> }
    ).options.map((o) => o.value);
    expect(source).toEqual([...METRIC_SOURCES]);
    const baseUrl = Connections.fields.find((f) => 'name' in f && f.name === 'baseUrl') as {
      admin: { condition: (data: Record<string, unknown>) => boolean };
      validate: (
        value: unknown,
        args: { req: unknown; siblingData: Record<string, unknown> },
      ) => true | string;
    };
    expect(baseUrl.admin.condition({ kind: 'umami' })).toBe(true);
    expect(baseUrl.admin.condition({ kind: 'openai-compatible' })).toBe(true);
    expect(baseUrl.admin.condition({ kind: 'pagespeed' })).toBe(false);
    const req = { i18n: { language: 'en' } };
    expect(baseUrl.validate('', { req, siblingData: { kind: 'umami' } })).toBe(true);
    expect(baseUrl.validate(undefined, { req, siblingData: { kind: 'umami' } })).toBe(true);
    expect(baseUrl.validate('https://umami.b7r.app', { req, siblingData: { kind: 'umami' } })).toBe(
      true,
    );
    expect(baseUrl.validate('http://umami.b7r.app', { req, siblingData: { kind: 'umami' } })).toBe(
      'An https:// address',
    );
    expect(baseUrl.validate('', { req, siblingData: { kind: 'openai-compatible' } })).toBe(
      'An https:// address',
    );
    expect(baseUrl.validate('', { req, siblingData: { kind: 'openai' } })).toBe(true);
  });
});

const NOW = new Date('2026-09-18T07:00:00Z'); // 10:00 Riyadh

/** A Payload whose `metrics` rows are the given `umami` days, newest first as the reader asks, recording the query. */
function metricsPayload(rows: Array<{ date: string; data: Partial<UmamiRow> }>) {
  const asked: unknown[] = [];
  const payload = {
    find: async ({ where, sort }: { where: unknown; sort?: string }) => {
      asked.push(where);
      expect(sort).toBe('-date');
      const since = /"greater_than_equal":"([^"]+)"/.exec(JSON.stringify(where))?.[1] ?? '';
      return {
        docs: rows.filter((r) => r.date >= since).toSorted((a, b) => b.date.localeCompare(a.date)),
      };
    },
  } as unknown as Payload;
  return { payload, asked };
}

/** A window's numbers that follow its visitors. */
const numbers = (visitors: number) => ({
  visitors,
  pageviews: visitors * 3,
  visits: visitors + 1,
  bounces: 1,
  totaltime: 600,
});

/** A pulled day; with `ranges`, yesterday's row carrying the three ranges ending on it. */
const day = (date: string, visitors: number, ranges?: Record<number, number>) => ({
  date,
  data: {
    ...numbers(visitors),
    ...(ranges
      ? {
          ranges: Object.fromEntries(
            Object.entries(ranges).map(([n, v]) => [
              n,
              { ...numbers(v), previous: numbers(v / 2) },
            ]),
          ),
        }
      : {}),
  },
});

describe("the dashboard's people reader (ADR-048 amended)", () => {
  it("reads each range's uniques and its previous range from the newest row that carries them", async () => {
    const { payload, asked } = metricsPayload([
      day('2026-09-17', 100, { 7: 700, 30: 3000, 90: 9000 }),
      day('2026-09-16', 80, { 7: 650, 30: 2900, 90: 8800 }),
      day('2026-09-12', 50),
      day('2026-09-11', 999), // outside a week that starts on the 12th
    ]);
    for (const n of [7, 30, 90] as const) {
      expect(await peopleSummary(payload, { days: n, now: NOW })).toEqual({
        ...numbers(n * 100),
        previous: numbers(n * 50),
        summed: false,
      });
    }
    expect(JSON.stringify(asked[0])).toContain('"equals":"umami"');
    expect(JSON.stringify(asked[0])).toContain('"greater_than_equal":"2026-09-12"');
    // The newest row without the range object is skipped for an older one that has it.
    const stale = metricsPayload([
      day('2026-09-17', 100),
      day('2026-09-16', 80, { 7: 650, 30: 2900, 90: 8800 }),
    ]);
    expect(await peopleSummary(stale.payload, { days: 7, now: NOW })).toMatchObject({
      visitors: 650,
      previous: numbers(325),
      summed: false,
    });
  });

  it('falls back to the days summed, said as such, while no row of the range carries the ranges', async () => {
    const { payload } = metricsPayload([
      day('2026-09-17', 100),
      day('2026-09-12', 50),
      day('2026-09-11', 999),
    ]);
    expect(await peopleSummary(payload, { days: 7, now: NOW })).toEqual({
      visitors: 150,
      pageviews: 450,
      visits: 152,
      bounces: 2,
      totaltime: 1200,
      previous: null,
      summed: true,
    });
    expect(await peopleSummary(payload, { days: 30, now: NOW })).toMatchObject({
      visitors: 1149,
      summed: true,
    });
  });

  it('reads no row as null, so the tile and the card stay as they are without Umami', async () => {
    expect(await peopleSummary(metricsPayload([]).payload, { days: 7, now: NOW })).toBeNull();
    expect(
      await peopleSummary(metricsPayload([day('2026-09-01', 5)]).payload, { days: 7, now: NOW }),
    ).toBeNull();
  });
});

const summary = (landings: number): TrafficSummary =>
  ({
    landings,
    crawls: 0,
    byGroup: {},
    byChannel: [],
    bySource: [],
    byPath: [],
    byBot: [],
    days: 7,
    since: '',
  }) as unknown as TrafficSummary;

/** A range's people; `previous` null with `summed` is the fallback. */
const people = (
  visitors: number,
  previous: number | null,
  summed = previous === null,
): PeopleSummary => ({
  ...numbers(visitors),
  previous: previous === null ? null : numbers(previous),
  summed,
});

describe('the visits tile with Umami (ADR-048 amended)', () => {
  const base: TileInputs = {
    days: 7,
    adminRoute: '/admin',
    language: 'en',
    traffic: { current: summary(4881), double: summary(8881) },
    ledger: undefined,
    score: undefined,
    published: undefined,
    drafts: undefined,
  };

  it('reads as before without a row: the landings and their change', () => {
    for (const input of [base, { ...base, people: undefined }, { ...base, people: null }]) {
      expect(dashboardTiles(input)[0]).toMatchObject({
        label: 'Visits',
        value: '4,881',
        detail: '22% more than the previous 7 days',
      });
      expect(dashboardTiles(input)[0]!.data).toBeUndefined();
    }
  });

  it("shows Umami's visitors as the number, the landings under, and the change against Umami's previous range", () => {
    const tile = dashboardTiles({ ...base, people: people(3900, 3000) })[0]!;
    expect(tile).toMatchObject({
      label: 'Visitors',
      value: '3,900',
      detail: '4,881 landings · 30% more than the previous 7 days',
      href: '/admin/traffic?days=7',
      data: { 'data-admin-tile-visitors': 3900 },
    });
    expect(dashboardTiles({ ...base, people: people(80, 100) })[0]).toMatchObject({
      detail: '4,881 landings · 20% fewer than the previous 7 days',
    });
    // The previous range had nobody: the "none before" line, as the landings say.
    expect(dashboardTiles({ ...base, people: people(12, 0) })[0]).toMatchObject({
      detail: '4,881 landings · none in the previous 7 days',
    });
    // The summed fallback says so in place of a change.
    expect(dashboardTiles({ ...base, people: people(3900, null) })[0]).toMatchObject({
      value: '3,900',
      detail: '4,881 landings · daily visitors, summed',
    });
    // One landing is singular; a failed traffic reader leaves the landings out.
    expect(
      dashboardTiles({
        ...base,
        traffic: { current: summary(1), double: summary(1) },
        people: people(2, 2),
      })[0],
    ).toMatchObject({ detail: '1 landing · the same as the previous 7 days' });
    expect(dashboardTiles({ ...base, traffic: null, people: people(2, null) })[0]).toMatchObject({
      label: 'Visitors',
      value: '2',
      detail: 'daily visitors, summed',
    });
  });

  it('reads in Arabic with the landings as a label and its value', () => {
    const tile = dashboardTiles({ ...base, language: 'ar', people: people(3900, 3000) })[0]!;
    expect(tile.label).toBe('الزوّار');
    expect(tile.value).toBe('3,900');
    expect(tile.detail).toBe('الزيارات: 4,881 · أكثر بنسبة 30% من المدة السابقة (7 أيام)');
    expect(dashboardTiles({ ...base, language: 'ar', people: people(3900, null) })[0]!.detail).toBe(
      'الزيارات: 4,881 · زوّار الأيام، مجموعةً',
    );
  });

  it('writes the average visit as minutes and seconds', () => {
    expect(formatMinutesSeconds(0)).toBe('0:00');
    expect(formatMinutesSeconds(142.6)).toBe('2:23');
    expect(formatMinutesSeconds(809968 / 5680)).toBe('2:23');
    expect(formatMinutesSeconds(3661)).toBe('61:01');
    expect(formatMinutesSeconds(-5)).toBe('0:00');
  });
});
