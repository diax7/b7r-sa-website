import type { Payload, PayloadRequest } from 'payload';
import { describe, expect, it } from 'vitest';
import { can, contentActions, isMachineRow } from '@/modules/cms/admin/dashboard/data';
import {
  connectionRows,
  draftsWaiting,
  failedRuns,
  missingEnglish,
  publishedInRange,
  rangeStart,
} from '@/modules/cms/admin/dashboard/readers';
import {
  daypartOf,
  needsAHand,
  percentChange,
  rangeOf,
  statusListHref,
} from '@/modules/cms/admin/dashboard/rules';
import {
  addDays,
  nextLedgerMorning,
  nextOccurrence,
  type PromptWithLatest,
  riyadhSlot,
  SCHEDULES,
} from '@/modules/cms/admin/dashboard/schedule';
import { dashboardTiles, type TileInputs } from '@/modules/cms/admin/dashboard/tile-data';
import { adminStrings, adminStringsAr } from '@/modules/cms/admin/strings';
import type { TrafficSummary } from '@/modules/traffic/summary';
import type { LedgerReading } from '@/modules/visibility/ledger/reading';
import type { Score } from '@/modules/visibility/score';

/** Riyadh is UTC+3: 2026-09-18 10:00 Riyadh is 07:00 UTC. */
const riyadhAt = (day: string, hour: number) =>
  new Date(`${day}T${String(hour).padStart(2, '0')}:00:00+03:00`);
const NOW = riyadhAt('2026-09-18', 10);

describe('the range control (ADR-059)', () => {
  it('reads 7, 30 or 90 from the search param and falls back to the week', () => {
    expect(rangeOf('30')).toBe(30);
    expect(rangeOf('90')).toBe(90);
    expect(rangeOf(['7', '30'])).toBe(7);
    expect(rangeOf(undefined)).toBe(7);
    expect(rangeOf('12')).toBe(7);
    expect(rangeOf('-30')).toBe(7);
    expect(rangeOf('abc')).toBe(7);
  });

  it('opens the range at the Riyadh midnight of the first day: 7 days is today and six before', () => {
    expect(rangeStart(7, NOW).toISOString()).toBe(riyadhAt('2026-09-12', 0).toISOString());
    expect(rangeStart(30, NOW).toISOString()).toBe(riyadhAt('2026-08-20', 0).toISOString());
  });

  it('greets by the Riyadh hour', () => {
    expect(daypartOf(5)).toBe('morning');
    expect(daypartOf(11)).toBe('morning');
    expect(daypartOf(12)).toBe('afternoon');
    expect(daypartOf(16)).toBe('afternoon');
    expect(daypartOf(17)).toBe('evening');
    expect(daypartOf(23)).toBe('evening');
    expect(daypartOf(0)).toBe('evening');
    expect(daypartOf(4)).toBe('evening');
  });

  it('gives the change against the previous range as a whole percentage, none from zero', () => {
    expect(percentChange(120, 100)).toBe(20);
    expect(percentChange(80, 100)).toBe(-20);
    expect(percentChange(100, 100)).toBe(0);
    expect(percentChange(5, 0)).toBeNull();
    expect(percentChange(1, 3)).toBe(-67);
  });

  it('links a count to the list filtered on its status', () => {
    expect(statusListHref('/admin', 'posts', 'draft')).toBe(
      '/admin/collections/posts?where[_status][equals]=draft',
    );
  });
});

/** A connection row as the hand line reads it: on or off, its last test passed, failed or never run. */
const connection = (id: number, enabled: boolean, lastTestOk: boolean | null) => ({
  id,
  label: `Key ${id}`,
  enabled,
  spentUsd: 0,
  limitUsd: 5,
  lastTestOk,
});

describe('the "needs a hand" line (ADR-059)', () => {
  const s = adminStrings.dashboard.hand;
  const nothing = { failedRuns: 0, connections: [], missingEnglish: [], drafts: [] };

  it('says nothing when nothing needs a person, and when every reader was skipped', () => {
    expect(needsAHand(nothing, s, '/admin')).toEqual([]);
    expect(
      needsAHand(
        { failedRuns: null, connections: null, missingEnglish: null, drafts: null },
        s,
        '/admin',
      ),
    ).toEqual([]);
  });

  it('lists failed runs, a connection at its limit, missing English and stale drafts, each a link', () => {
    const items = needsAHand(
      {
        failedRuns: 2,
        connections: [
          { id: 3, label: 'OpenAI', enabled: true, spentUsd: 5, limitUsd: 5, lastTestOk: true },
          { id: 4, label: 'Claude', enabled: true, spentUsd: 1, limitUsd: 5, lastTestOk: null },
          { id: 5, label: 'Gemini', enabled: true, spentUsd: 9, limitUsd: null, lastTestOk: true },
          { id: 6, label: 'Old key', enabled: false, spentUsd: 0, limitUsd: 5, lastTestOk: false },
        ],
        missingEnglish: [
          { collection: 'posts', count: 0, href: null },
          { collection: 'pages', count: 3, href: '/admin/collections/pages/8?locale=en' },
        ],
        drafts: [
          { collection: 'posts', label: 'Posts', stale: 1 },
          { collection: 'pages', label: 'Pages', stale: 0 },
        ],
      },
      s,
      '/admin',
    );
    expect(items.map((i) => i.key)).toEqual([
      'failed-runs',
      'over-limit-3',
      'missing-english',
      'stale-drafts-posts',
    ]);
    expect(items[0]).toMatchObject({
      href: '/admin/collections/ai-runs?where[status][equals]=failed',
      text: '2 failed runs this week',
    });
    expect(items[1]).toMatchObject({
      href: '/admin/collections/connections/3',
      text: 'OpenAI is over its monthly limit',
    });
    expect(items[2]).toMatchObject({
      href: '/admin/collections/pages/8?locale=en',
      text: '3 documents without English',
    });
    expect(items[3]).toMatchObject({
      href: '/admin/collections/posts?where[_status][equals]=draft',
      text: '1 draft in Posts older than a week',
    });
  });

  it('names an enabled connection whose last test failed, never one that is off or untested', () => {
    const items = needsAHand(
      {
        ...nothing,
        connections: [
          connection(1, true, false),
          connection(2, false, false),
          connection(3, true, null),
          connection(4, true, true),
        ],
      },
      s,
      '/admin',
    );
    expect(items).toEqual([
      {
        key: 'failed-test-1',
        href: '/admin/collections/connections/1',
        text: 'The Key 1 connection failed its last test',
      },
    ]);
    expect(adminStringsAr.dashboard.hand.failedTest.replace('{label}', 'OpenAI')).toBe(
      'فشل اتصال OpenAI في آخر اختبار',
    );
  });

  it('counts in Arabic with the four plurals and Western digits', () => {
    const ar = adminStringsAr.dashboard.hand;
    expect(ar.failedRuns(1)).toBe('جولة فاشلة واحدة هذا الأسبوع');
    expect(ar.failedRuns(2)).toBe('جولتان فاشلتان هذا الأسبوع');
    expect(ar.failedRuns(3)).toBe('3 جولات فاشلة هذا الأسبوع');
    expect(ar.failedRuns(11)).toBe('11 جولة فاشلة هذا الأسبوع');
    expect(ar.missingEnglish(2)).toBe('مستندان بلا نسخة إنجليزية');
    expect(ar.staleDrafts(4, 'المقالات')).toBe('4 مسودات في المقالات أقدم من أسبوع');
    expect(adminStringsAr.dashboard.tiles.drafts(0)).toBe('لا مسودات بانتظارك');
    expect(adminStringsAr.dashboard.tiles.citedDetail(3)).toContain('3 محرّكات');
  });
});

describe('the scheduled jobs on the Riyadh clock (ADR-059)', () => {
  it("reads every job's cron as a Riyadh hour and weekday, and refuses any other shape", () => {
    expect(SCHEDULES.map((s) => [s.key, riyadhSlot(s.cron)])).toEqual([
      ['pull', { hour: 4, weekday: null }],
      ['ledger', { hour: 7, weekday: null }],
      ['freshness', { hour: 6, weekday: 1 }],
      ['digest', { hour: 8, weekday: 0 }],
    ]);
    expect(riyadhSlot('0 22 * * 0')).toEqual({ hour: 1, weekday: 1 });
    expect(() => riyadhSlot('*/5 * * * *')).toThrow(/cannot read the cron/);
  });

  it('finds the next daily slot: later today, else tomorrow', () => {
    expect(nextOccurrence({ hour: 12, weekday: null }, NOW).toISOString()).toBe(
      riyadhAt('2026-09-18', 12).toISOString(),
    );
    expect(nextOccurrence({ hour: 7, weekday: null }, NOW).toISOString()).toBe(
      riyadhAt('2026-09-19', 7).toISOString(),
    );
    expect(nextOccurrence({ hour: 10, weekday: null }, NOW).toISOString()).toBe(
      riyadhAt('2026-09-19', 10).toISOString(),
    );
  });

  it('finds the next weekly slot on its weekday: Friday the 18th reaches Monday the 21st', () => {
    expect(nextOccurrence({ hour: 6, weekday: 1 }, NOW).toISOString()).toBe(
      riyadhAt('2026-09-21', 6).toISOString(),
    );
    expect(nextOccurrence({ hour: 8, weekday: 0 }, NOW).toISOString()).toBe(
      riyadhAt('2026-09-20', 8).toISOString(),
    );
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01');
  });
});

const prompt = (
  id: number,
  everyDays: number,
  latest: Record<number, { date: string }> = {},
): PromptWithLatest => ({
  id,
  text: `prompt ${id}`,
  language: 'ar',
  namesBrand: false,
  everyDays,
  latest,
});

describe("the ledger's next morning from the prompts' periods (the CTO's edit)", () => {
  it('is the next 07:00 when a prompt was never asked on an enabled connection', () => {
    const next = nextLedgerMorning({ prompts: [prompt(1, 7)], connections: [3], now: NOW });
    expect(next?.toISOString()).toBe(riyadhAt('2026-09-19', 7).toISOString());
  });

  it('is today at 07:00 before the hour, tomorrow after it', () => {
    const early = riyadhAt('2026-09-18', 6);
    expect(
      nextLedgerMorning({ prompts: [prompt(1, 1)], connections: [3], now: early })?.toISOString(),
    ).toBe(riyadhAt('2026-09-18', 7).toISOString());
  });

  it('waits for the period when every prompt was asked today: weekly means next Friday', () => {
    const prompts = [
      prompt(1, 7, { 3: { date: '2026-09-18' } }),
      prompt(2, 7, { 3: { date: '2026-09-18' } }),
    ];
    expect(nextLedgerMorning({ prompts, connections: [3], now: NOW })?.toISOString()).toBe(
      riyadhAt('2026-09-25', 7).toISOString(),
    );
  });

  it('takes the earliest prompt across connections: a second connection never asked is due tomorrow', () => {
    const prompts = [prompt(1, 7, { 3: { date: '2026-09-18' } })];
    expect(nextLedgerMorning({ prompts, connections: [3, 4], now: NOW })?.toISOString()).toBe(
      riyadhAt('2026-09-19', 7).toISOString(),
    );
    const mixed = [
      prompt(1, 7, { 3: { date: '2026-09-18' } }),
      prompt(2, 3, { 3: { date: '2026-09-17' } }),
    ];
    expect(nextLedgerMorning({ prompts: mixed, connections: [3], now: NOW })?.toISOString()).toBe(
      riyadhAt('2026-09-20', 7).toISOString(),
    );
  });

  it('answers null with no prompt or no connection: the card says the plain sentence', () => {
    expect(nextLedgerMorning({ prompts: [], connections: [3], now: NOW })).toBeNull();
    expect(nextLedgerMorning({ prompts: [prompt(1, 1)], connections: [], now: NOW })).toBeNull();
  });
});

/** A Payload whose reads are recorded and answered per collection. */
function fakePayload(answers: {
  count?: (args: Record<string, unknown>) => number;
  countVersions?: (args: Record<string, unknown>) => number;
  find?: (args: Record<string, unknown>) => unknown[];
  findGlobal?: (args: Record<string, unknown>) => Record<string, unknown>;
}) {
  const calls: Array<{ op: string; args: Record<string, unknown> }> = [];
  const payload = {
    config: { routes: { admin: '/admin' } },
    count: async (args: Record<string, unknown>) => {
      calls.push({ op: 'count', args });
      return { totalDocs: answers.count?.(args) ?? 0 };
    },
    countVersions: async (args: Record<string, unknown>) => {
      calls.push({ op: 'countVersions', args });
      return { totalDocs: answers.countVersions?.(args) ?? 0 };
    },
    find: async (args: Record<string, unknown>) => {
      calls.push({ op: 'find', args });
      const docs = answers.find?.(args) ?? [];
      return { docs, totalDocs: docs.length };
    },
    findGlobal: async (args: Record<string, unknown>) => {
      calls.push({ op: 'findGlobal', args });
      return answers.findGlobal?.(args) ?? {};
    },
  } as unknown as Payload;
  return { payload, calls };
}

const user = { id: 1, collection: 'users' } as unknown as PayloadRequest['user'];

describe('the content readers (ADR-059)', () => {
  it('counts what went live in the range: posts by publishedAt, pages and products by their last published save', async () => {
    const { payload, calls } = fakePayload({
      count: (args) => ({ posts: 3, pages: 1, products: 0 })[args['collection'] as string] ?? 0,
    });
    const counts = await publishedInRange(payload, {
      collections: ['posts', 'pages', 'products'],
      days: 7,
      now: NOW,
      user,
    });
    expect(counts).toEqual([
      { collection: 'posts', count: 3 },
      { collection: 'pages', count: 1 },
      { collection: 'products', count: 0 },
    ]);
    const since = riyadhAt('2026-09-12', 0).toISOString();
    expect(calls.map((c) => c.args['where'])).toEqual([
      {
        and: [{ _status: { equals: 'published' } }, { publishedAt: { greater_than_equal: since } }],
      },
      { and: [{ _status: { equals: 'published' } }, { updatedAt: { greater_than_equal: since } }] },
      { and: [{ _status: { equals: 'published' } }, { updatedAt: { greater_than_equal: since } }] },
    ]);
    // With the user's own access, never overridden.
    for (const c of calls) expect(c.args).toMatchObject({ user, overrideAccess: false });
  });

  it('counts drafts waiting through the versions table: the latest version a draft, and the stale ones', async () => {
    const { payload, calls } = fakePayload({
      countVersions: (args) => {
        const where = args['where'] as { and: unknown[] };
        return where.and.length === 3 ? 1 : 4;
      },
    });
    const drafts = await draftsWaiting(payload, { collections: ['posts'], now: NOW, user });
    expect(drafts).toEqual([{ collection: 'posts', waiting: 4, stale: 1 }]);
    expect(calls).toHaveLength(2);
    expect(calls[0]!.args['where']).toEqual({
      and: [{ latest: { equals: true } }, { 'version._status': { equals: 'draft' } }],
    });
    expect(calls[1]!.args['where']).toEqual({
      and: [
        { latest: { equals: true } },
        { 'version._status': { equals: 'draft' } },
        { updatedAt: { less_than: new Date(NOW.getTime() - 7 * 86_400_000).toISOString() } },
      ],
    });
  });

  it('counts published documents without an English title, reading every locale with no fallback', async () => {
    const { payload, calls } = fakePayload({
      findGlobal: () => ({ brandName: 'B7R', menu: { ctaLabel: 'Start' } }),
      find: (args) =>
        args['collection'] === 'products'
          ? [
              { id: 1, name: { ar: 'تيشيرت', en: 'T-shirt' } },
              { id: 2, name: { ar: 'هودي', en: '' } },
              { id: 3, name: { ar: 'كاب' } },
            ]
          : [{ id: 9, title: { ar: 'من نحن', en: 'About' } }],
    });
    const missing = await missingEnglish(payload, { collections: ['pages', 'products'], user });
    expect(missing).toEqual([
      { collection: 'pages', count: 0, href: null },
      { collection: 'products', count: 2, href: '/admin/collections/products/2?locale=en' },
    ]);
    const finds = calls.filter((c) => c.op === 'find');
    expect(finds).toHaveLength(2);
    expect(finds[1]!.args).toMatchObject({
      collection: 'products',
      locale: 'all',
      fallbackLocale: false,
      select: { name: true },
      where: { _status: { equals: 'published' } },
    });
  });

  it('counts nothing while the site is Arabic only', async () => {
    const { payload, calls } = fakePayload({ findGlobal: () => ({ brandName: '' }) });
    expect(await missingEnglish(payload, { collections: ['posts'], user })).toEqual([
      { collection: 'posts', count: 0, href: null },
    ]);
    expect(calls.filter((c) => c.op === 'find')).toHaveLength(0);
  });

  it('counts the runs that failed in the window', async () => {
    const { payload, calls } = fakePayload({ count: () => 2 });
    expect(await failedRuns(payload, { days: 7, now: NOW, user })).toBe(2);
    expect(calls[0]!.args).toMatchObject({
      collection: 'ai-runs',
      where: {
        and: [
          { status: { equals: 'failed' } },
          {
            startedAt: {
              greater_than_equal: new Date(NOW.getTime() - 7 * 86_400_000).toISOString(),
            },
          },
        ],
      },
    });
  });

  it("reads one row per AI connection with the month's spend and runs, the service kinds left out", async () => {
    const { payload, calls } = fakePayload({
      find: (args) => {
        if (args['collection'] === 'connections') {
          return [
            {
              id: 3,
              label: 'OpenAI',
              enabled: true,
              monthlyLimitUsd: 5,
              lastTestAt: '2026-09-17T08:00:00.000Z',
              lastTestOk: true,
            },
            { id: 4, label: 'Mock', enabled: false, monthlyLimitUsd: null },
          ];
        }
        const where = JSON.stringify(args['where']);
        return where.includes('"equals":3') ? [{ costUsd: 1.5 }, { costUsd: 0.25 }] : [];
      },
    });
    const req = { user, context: {} } as unknown as PayloadRequest;
    const rows = await connectionRows(payload, req, NOW);
    expect(rows).toEqual([
      {
        id: 3,
        label: 'OpenAI',
        enabled: true,
        limitUsd: 5,
        spentUsd: 1.75,
        runs: 2,
        lastTestAt: '2026-09-17T08:00:00.000Z',
        lastTestOk: true,
      },
      {
        id: 4,
        label: 'Mock',
        enabled: false,
        limitUsd: null,
        spentUsd: 0,
        runs: 0,
        lastTestAt: null,
        lastTestOk: null,
      },
    ]);
    const connections = calls.find((c) => c.args['collection'] === 'connections')!;
    expect(connections.args['where']).toEqual({
      kind: { in: ['openai', 'anthropic', 'google', 'deepseek', 'openai-compatible', 'mock'] },
    });
    // The plain fields only: the virtual spend fields would each cost a query per row.
    expect(Object.keys(connections.args['select'] as object)).not.toContain('spentThisMonthUsd');
    expect(connections.args).toMatchObject({ user, overrideAccess: false });
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

const ledger = (cited: number, runs: number, engines: number): LedgerReading =>
  ({
    engines: Array.from({ length: engines }, (_, i) => ({ connection: i })),
    prompts: [],
    competitors: [],
    lastRunAt: null,
    citedRate: runs ? { runs, cited } : null,
  }) as unknown as LedgerReading;

const scoreOf = (overall: number, siteOnly: number): Score =>
  ({ overall, siteOnly, findings: [] }) as unknown as Score;

/** Sanitized permissions as Payload hands them: `true`, or `{ permission }` before sanitising. */
const permissionsOf = (allowed: Record<string, boolean>) =>
  ({
    collections: {
      posts: { create: allowed['posts'] ?? false, read: true },
      products: { create: { permission: allowed['products'] ?? false }, read: true },
    },
    globals: { home: { update: allowed['home'] ?? false, read: true } },
  }) as never;

describe('the tiles (ADR-059)', () => {
  const base: TileInputs = {
    days: 7,
    adminRoute: '/admin',
    language: 'en',
    traffic: undefined,
    ledger: undefined,
    score: undefined,
    published: undefined,
    drafts: undefined,
  };

  it("renders a tile only for what the user may see, in the audit's order", () => {
    expect(dashboardTiles(base)).toEqual([]);
    const all = dashboardTiles({
      ...base,
      traffic: { current: summary(120), double: summary(220) },
      ledger: ledger(5, 13, 2),
      score: {
        score: scoreOf(61, 72),
        trend: { since: { date: '2026-09-11', overall: 58 }, delta: 3 },
      },
      published: [
        { collection: 'posts', count: 4 },
        { collection: 'pages', count: 1 },
      ],
      drafts: [{ collection: 'posts', waiting: 2, stale: 0 }],
    });
    expect(all.map((t) => t.key)).toEqual(['visits', 'cited', 'score', 'published']);
    expect(all[0]).toMatchObject({
      value: '120',
      detail: '20% more than the previous 7 days',
      href: '/admin/traffic?days=7',
    });
    expect(all[1]).toMatchObject({
      value: '38%',
      detail: 'on the category prompts, 28 days, 2 engines',
      href: '/admin/visibility',
    });
    expect(all[2]).toMatchObject({
      value: '61%',
      detail: 'up 3 points since 11/09/2026',
      data: { 'data-admin-visibility': '', 'data-admin-visibility-overall': 61 },
    });
    expect(all[3]).toMatchObject({
      value: '5',
      detail: 'posts, pages and products in 7 days; 2 drafts waiting',
    });
  });

  it('says how the visits moved: fewer, the same, or none to compare with', () => {
    const detail = (current: number, double: number) =>
      dashboardTiles({
        ...base,
        traffic: { current: summary(current), double: summary(double) },
      })[0]!.detail;
    expect(detail(80, 180)).toBe('20% fewer than the previous 7 days');
    expect(detail(100, 200)).toBe('the same as the previous 7 days');
    expect(detail(5, 5)).toBe('none in the previous 7 days');
  });

  it('keeps a tile whose reader failed, with the "not available" word and no numbers', () => {
    const tiles = dashboardTiles({
      ...base,
      traffic: null,
      ledger: null,
      score: null,
      published: null,
    });
    expect(tiles.map((t) => t.value)).toEqual(Array(4).fill('Not available'));
    expect(tiles.map((t) => t.detail)).toEqual(['', '', '', 'posts, pages and products in 7 days']);
    expect(tiles[2]!.data).toEqual({});
  });

  it('reads the score without a trend as the site-only line, and no ledger run as 0%', () => {
    const tiles = dashboardTiles({
      ...base,
      ledger: ledger(0, 0, 0),
      score: { score: scoreOf(61, 72), trend: null },
    });
    expect(tiles[0]).toMatchObject({ value: '0%', detail: 'No ledger run in the last 28 days' });
    expect(tiles[1]).toMatchObject({ value: '61%', detail: 'What you control: 72%' });
  });
});

describe("the content section's actions and saves (ADR-059)", () => {
  it('gives an admin the home tile and both buttons, an editor what they may create', () => {
    const admin = contentActions({
      permissions: permissionsOf({ posts: true, products: true, home: true }),
      adminRoute: '/admin',
      language: 'en',
    });
    expect(admin.home?.href).toBe('/admin/globals/home');
    expect(admin.buttons.map((b) => b.key)).toEqual(['add-post', 'add-product']);
    const editor = contentActions({
      permissions: permissionsOf({ posts: true }),
      adminRoute: '/admin',
      language: 'ar',
    });
    expect(editor.home).toBeNull();
    expect(editor.buttons.map((b) => b.title)).toEqual(['اكتب مقالاً']);
    expect(can(permissionsOf({ products: true }), 'collections', 'products', 'create')).toBe(true);
    expect(can(undefined, 'collections', 'products', 'create')).toBe(false);
  });

  it("leaves the engine's untouched posts out of the saves by people", () => {
    expect(isMachineRow({ origin: 'ai' })).toBe(true);
    expect(isMachineRow({ origin: 'ai', lastSavedBy: { name: 'Dhia' } })).toBe(false);
    expect(isMachineRow({ origin: 'ai-edited' })).toBe(false);
    expect(isMachineRow({ origin: 'manual' })).toBe(false);
  });
});
