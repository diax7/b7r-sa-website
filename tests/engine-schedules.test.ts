import { describe, expect, it } from 'vitest';
import { nextWindow } from '@/content/seed/topics';
import { plainText } from '@/lib/lexical';
import { riyadh } from '@/lib/riyadh';
import type { CapCounts } from '@/modules/ai-content/caps';
import { type DigestRun, digestText } from '@/modules/ai-content/digest';
import { factsSheet } from '@/modules/ai-content/facts';
import { driftedNumbers, driftedPosts } from '@/modules/ai-content/freshness';
import type { PipelineContext } from '@/modules/ai-content/pipeline/types';
import { runPipeline } from '@/modules/ai-content/pipeline/run';
import { mockProvider } from '@/modules/ai-content/provider/mock';
import { tickDecision } from '@/modules/ai-content/tick';
import { FACTS, INTEGRATIONS, memoryStore, PRODUCTS, settings, SITE } from './helpers/engine-store';

/** Riyadh is UTC+3: the Riyadh day of 15 September starts at 21:00 UTC on the 14th. */
const RIYADH_MIDNIGHT = Date.parse('2026-09-14T21:00:00Z');
const hourOfDay = (h: number) => new Date(RIYADH_MIDNIGHT + h * 3_600_000);

/** A day of hourly ticks: every hour asks, a run that starts counts from then on. */
function dayOfTicks(args: {
  settings?: Parameters<typeof settings>[0];
  counts?: Partial<CapCounts>;
  env?: Record<string, string | undefined>;
}): number[] {
  const s = settings({ enabled: true, ...args.settings });
  const counts: CapCounts = {
    runsToday: 0,
    runsThisMonth: 0,
    costTodayUsd: 0,
    connectionSpentMonthUsd: 0,
    ...args.counts,
  };
  const queuedAt: number[] = [];
  for (let h = 0; h < 24; h++) {
    const now = hourOfDay(h);
    expect(riyadh(now).hour).toBe(h);
    const decision = tickDecision({ settings: s, counts, now, env: args.env ?? {} });
    if (decision.queue) {
      queuedAt.push(h);
      counts.runsToday += 1;
      counts.runsThisMonth += 1;
    }
  }
  return queuedAt;
}

describe('the hourly tick (BRD 10.2.4 scheduling, ADR-042)', () => {
  it('queues exactly one run a day, at the publish hour', () => {
    expect(dayOfTicks({ settings: { publishHourRiyadh: 9, postsPerDay: 1 } })).toEqual([9]);
  });

  it('two posts a day: the hour after the first, never a third', () => {
    expect(dayOfTicks({ settings: { publishHourRiyadh: 9, postsPerDay: 2 } })).toEqual([9, 10]);
  });

  it('stays quiet when a run already started today, the month is full or the cost cap is hit', () => {
    expect(dayOfTicks({ counts: { runsToday: 1 } })).toEqual([]);
    expect(dayOfTicks({ settings: { maxPostsPerMonth: 3 }, counts: { runsThisMonth: 3 } })).toEqual(
      [],
    );
    expect(dayOfTicks({ settings: { dailyCostCapUsd: 2 }, counts: { costTodayUsd: 2 } })).toEqual(
      [],
    );
  });

  it('stays quiet with the switch off or AI_CONTENT_ENABLED=false, whatever the hour', () => {
    expect(dayOfTicks({ settings: { enabled: false } })).toEqual([]);
    expect(dayOfTicks({ env: { AI_CONTENT_ENABLED: 'false' } })).toEqual([]);
    const reason = tickDecision({
      settings: settings({ enabled: true }),
      counts: { runsToday: 0, runsThisMonth: 0, costTodayUsd: 0, connectionSpentMonthUsd: 0 },
      now: hourOfDay(12),
      env: { AI_CONTENT_ENABLED: '0' },
    }).reason;
    expect(reason).toMatch(/AI_CONTENT_ENABLED/);
  });
});

describe('the weekly freshness pass (BRD 10.2.4 amendment, ADR-042)', () => {
  const baseline = FACTS.numbers;
  const sevenDays = factsSheet({
    site: { ...SITE, delivery: { ...SITE.delivery, maxDays: 7 } },
    products: PRODUCTS,
    integrations: INTEGRATIONS,
  }).numbers;

  it('drift is a number that was on the sheet and is not any more; not an illustrative one', () => {
    const text = 'يصل الطلب خلال 5 أيام كحد أقصى، والرصيد الترحيبي 30 ريالاً، ومثال سعر 99 ريالاً.';
    expect(driftedNumbers(text, baseline, sevenDays)).toEqual(['5 أيام']);
    expect(driftedNumbers(text, baseline, baseline)).toEqual([]);
    expect(driftedPosts([{ id: 1, locale: 'ar', text, baseline }], sevenDays)).toEqual([
      { id: 1, drift: ['5 أيام'] },
    ]);
    expect(driftedPosts([{ id: 1, locale: 'ar', text, baseline }], baseline)).toEqual([]);
    // An English post states its promise in English units (ADR-043): read with them, it
    // drifts the same way; a bilingual post drifted in both languages is one regeneration.
    const english = 'We ship within 5 days at most, and the essential T-shirt costs SAR 45.';
    expect(driftedNumbers(english, baseline, sevenDays, 'en')).toEqual(['5 days']);
    expect(driftedNumbers(english, baseline, sevenDays, 'ar')).toEqual([]);
    expect(
      driftedPosts(
        [
          { id: 1, locale: 'ar', text, baseline },
          { id: 1, locale: 'en', text: english, baseline },
          { id: 2, locale: 'en', text: english, baseline },
        ],
        sevenDays,
      ),
    ).toEqual([
      { id: 1, drift: ['5 أيام'] },
      { id: 2, drift: ['5 days'] },
    ]);
  });

  it('a changed maxDays regenerates the post under its slug from the stored outline, past the daily cap', async () => {
    const { store, state } = memoryStore({ settings: settings({ enabled: true, postsPerDay: 1 }) });
    const first = mockProvider({ facts: FACTS });
    const ctx: PipelineContext = {
      store,
      provider: first,
      now: () => hourOfDay(10),
      run: async (_name, fn) => fn(),
      env: { AI_CONTENT_MOCK: '1' },
    };
    const written = await runPipeline(ctx, { manual: true });
    expect(written.status).toBe('done');
    const post = state.posts[0]!;
    expect(plainText(post.body)).toContain('5 أيام');
    expect(post.factsBaseline).toEqual(FACTS.numbers);
    const run = state.runs.get(written.runId!)!;
    expect(state.topicStatus.get(state.topics[0]!.id)).toBe('published');

    // The delivery promise changes; a day with its run already started.
    state.facts = { ...FACTS, numbers: sevenDays };
    state.counts = { runsToday: 1, runsThisMonth: 1, costTodayUsd: 0, connectionSpentMonthUsd: 0 };
    const second = mockProvider({ facts: state.facts });
    const refreshed = await runPipeline(
      { ...ctx, provider: second },
      { replacePostId: post.id, kind: 'freshness' },
    );
    expect(refreshed.status, refreshed.reason ?? '').toBe('done');
    expect(state.posts).toHaveLength(1);
    expect(state.posts[0]!.slug).toBe(post.slug);
    expect(state.posts[0]!.cover).toBe(post.cover);
    expect(plainText(state.posts[0]!.body)).toContain('7 أيام');
    // The rewritten post carries today's sheet as its new baseline.
    expect(state.posts[0]!.factsBaseline).toEqual(sevenDays);
    // The outline came from the first run: the second provider never drew one.
    expect(second.calls.filter((c) => c.step === 'outline')).toHaveLength(0);
    const again = state.runs.get(refreshed.runId!)!;
    expect(again['kind']).toBe('freshness');
    expect(again['outline']).toEqual(run['outline']);
    expect(state.topicStatus.get(state.topics[0]!.id)).toBe('published');
  });

  it('a migrated post carries the seed-time baseline, so a later change to the sheet is drift', () => {
    // The seed writes the facts as it knows them; the site later promises 7 days.
    const migrated = {
      id: 1,
      locale: 'ar' as const,
      text: 'يصل الطلب خلال 5 أيام كحد أقصى، والرصيد الترحيبي 30 ريالاً.',
      baseline: factsSheet({ site: SITE, products: PRODUCTS, integrations: INTEGRATIONS }).numbers,
    };
    expect(driftedPosts([migrated], sevenDays)).toEqual([{ id: 1, drift: ['5 أيام'] }]);
    // A post without a baseline (an editor's own) is never a candidate: the query asks for one.
    expect(driftedPosts([{ ...migrated, baseline: [] }], sevenDays)).toEqual([]);
  });

  it('a manual run on a published topic writes nothing; a regeneration may pick it', async () => {
    const { store, state } = memoryStore({ settings: settings({ enabled: true }) });
    const provider = mockProvider({ facts: FACTS });
    const ctx: PipelineContext = {
      store,
      provider,
      now: () => hourOfDay(10),
      run: async (_name, fn) => fn(),
      env: { AI_CONTENT_MOCK: '1' },
    };
    const first = await runPipeline(ctx, { manual: true, topicId: state.topics[0]!.id });
    expect(first.status).toBe('done');
    const again = await runPipeline(ctx, { manual: true, topicId: state.topics[0]!.id });
    expect(again.status).toBe('skipped');
    expect(again.reason).toMatch(/cannot be picked/);
    expect(state.posts).toHaveLength(1);
  });
});

describe('the weekly digest (BRD 10.2.4 step 9)', () => {
  const runs: DigestRun[] = [
    {
      id: 1,
      label: 'generate: كيف تسعّر',
      kind: 'generate',
      status: 'done',
      score: 88,
      costUsd: 0.12,
      error: null,
      post: { title: 'كيف تسعّر تيشيرتاً', slug: 'how-to-price' },
      startedAt: '2026-09-08T06:00:00.000Z',
    },
    {
      id: 2,
      label: 'freshness: ما هي الطباعة',
      kind: 'freshness',
      status: 'done',
      score: 91,
      costUsd: 0.1,
      error: null,
      post: { title: 'ما هي الطباعة عند الطلب', slug: 'what-is-pod' },
      startedAt: '2026-09-09T03:00:00.000Z',
    },
    {
      id: 3,
      label: 'generate: ربط متجر زد',
      kind: 'generate',
      status: 'failed',
      score: null,
      costUsd: 0.05,
      error: 'refused: An em dash in the text',
      post: null,
      startedAt: '2026-09-10T06:00:00.000Z',
    },
  ];

  it('lists the posts with score and cost, the failures with their reason, and the next slot', () => {
    const text = digestText({
      runs,
      settings: { enabled: true, publishHourRiyadh: 9, postsPerDay: 1 },
      now: new Date('2026-09-13T05:00:00Z'),
      base: 'https://b7r.sa',
      envOn: true,
    });
    expect(text).toContain('2 post(s) written, 1 failure(s), 0.27 USD spent.');
    expect(text).toContain(
      'كيف تسعّر تيشيرتاً (generate, score 88, 0.12 USD): https://b7r.sa/blog/how-to-price',
    );
    expect(text).toContain('(freshness, score 91');
    expect(text).toContain('- generate: ربط متجر زد: refused: An em dash in the text');
    expect(text).toContain('Next slot: 9:00 Riyadh, 1 post(s) a day');
    expect(text).toContain('https://b7r.sa/admin/collections/ai-runs');
    expect(text).not.toContain(String.fromCharCode(0x2014));
  });

  it('says the engine is off when the switch or the env stops it', () => {
    const off = digestText({
      runs: [],
      settings: { enabled: false, publishHourRiyadh: 9, postsPerDay: 1 },
      now: new Date('2026-09-13T05:00:00Z'),
      base: 'https://b7r.sa',
      envOn: true,
    });
    expect(off).toContain('0 post(s) written, 0 failure(s), 0.00 USD spent.');
    expect(off).toContain('Next slot: the engine is switched off');
    expect(off).not.toContain('Posts:');
  });
});

describe('the seeded backlog windows (BRD Appendix E)', () => {
  const now = new Date('2026-09-14T09:00:00Z');

  it('a window whose end has passed moves to next year', () => {
    expect(nextWindow(now, { start: '06-15', end: '08-10' })).toEqual({
      start: '2027-06-15',
      end: '2027-08-10',
    });
  });

  it('a window still ahead stays this year, one crossing New Year starts this year', () => {
    expect(nextWindow(now, { start: '09-15', end: '11-01' })).toEqual({
      start: '2026-09-15',
      end: '2026-11-01',
    });
    expect(nextWindow(now, { start: '11-15', end: '01-05' })).toEqual({
      start: '2026-11-15',
      end: '2027-01-05',
    });
  });

  it('fixed dates pass through', () => {
    expect(nextWindow(now, { start: '2026-12-01', end: '2027-01-09' })).toEqual({
      start: '2026-12-01',
      end: '2027-01-09',
    });
  });
});
