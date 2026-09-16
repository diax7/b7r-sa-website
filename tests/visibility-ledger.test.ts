import type { Payload } from 'payload';
import { describe, expect, it } from 'vitest';
import { costTodayOf } from '@/modules/ai-content/caps';
import { KINDS } from '@/modules/connections/kinds';
import { searchTool } from '@/modules/connections/model';
import { mockAsker } from '@/modules/visibility/ledger/ask';
import { citedUrls, mentionsBrand, readAnswer } from '@/modules/visibility/ledger/read-answer';
import { bestMatch, citedRateOf, type CitationRow } from '@/modules/visibility/ledger/reading';
import {
  batchCostUsd,
  batchLabel,
  LEDGER_BUDGET_MS,
  runLedger,
} from '@/modules/visibility/ledger/run';
import { SEED_PROMPTS } from '@/modules/visibility/ledger/seed';

const spec = (over: Record<string, unknown> = {}) => ({
  id: 1,
  label: 'OpenAI, prod',
  kind: 'openai' as const,
  model: 'gpt-4.1',
  apiKey: 'sk-live',
  baseUrl: null,
  rates: { inputPerMillionUsd: 2, outputPerMillionUsd: 8 },
  monthlyLimitUsd: null,
  enabled: true,
  ...over,
});

const citation = (over: Partial<CitationRow>): CitationRow => ({
  id: 1,
  date: '2026-09-14',
  connection: 1,
  provider: 'openai',
  model: 'gpt-4.1',
  prompt: 1,
  mode: 'search',
  mentioned: false,
  linked: false,
  namesBrand: false,
  urls: [],
  competitors: [],
  excerpt: '',
  createdAt: '2026-09-14T04:00:00.000Z',
  ...over,
});

/** A Payload with prompts, connections and the rows the run writes, recorded. */
function fakeLedgerPayload(args: {
  connections: Array<Record<string, unknown>>;
  prompts?: Array<Record<string, unknown>>;
  runsWithinHour?: number;
  spentUsd?: number;
}) {
  const created: Array<{ collection: string; data: Record<string, unknown> }> = [];
  const updated: Array<{ id: number; data: Record<string, unknown> }> = [];
  const prompts =
    args.prompts ??
    SEED_PROMPTS.map((p, i) => ({ id: i + 1, ...p, enabled: true, order: (i + 1) * 10 }));
  const payload = {
    find: async ({ collection }: { collection: string }) => {
      if (collection === 'prompts') return { docs: prompts, totalDocs: prompts.length };
      if (collection === 'connections')
        return { docs: args.connections, totalDocs: args.connections.length };
      if (collection === 'ai-runs') {
        const docs = [{ costUsd: args.spentUsd ?? 0 }];
        return { docs, totalDocs: docs.length };
      }
      return { docs: [], totalDocs: 0 };
    },
    findByID: async ({ id }: { id: number }) => args.connections.find((c) => c['id'] === id),
    count: async () => ({ totalDocs: args.runsWithinHour ?? 0 }),
    create: async ({ collection, data }: { collection: string; data: Record<string, unknown> }) => {
      created.push({ collection, data });
      return { id: created.length, ...data };
    },
    update: async ({ id, data }: { id: number; data: Record<string, unknown> }) => {
      updated.push({ id, data });
      return { id, ...data };
    },
    logger: { info: () => {}, warn: () => {} },
  } as unknown as Payload;
  return { payload, created, updated };
}

describe('the brand matcher and the reader (ADR-049 D5)', () => {
  it('names B7R with an attached prefix, as b7r, as a host; never the sea', () => {
    const named = [
      'أنصحك بـبحر برنت',
      'وبحر برنت خيار ممتاز',
      'جرّب لبحر برنت ميزة الشحن',
      'بحر  برينت يطبع بالقطعة',
      'B7R Print ships within days',
      'see b7r.sa for prices',
      'https://b7r.app/dashboard',
    ];
    for (const text of named) expect(mentionsBrand(text), text).toBe(true);
    const notNamed = [
      'أمامك بحر من الخيارات',
      'شركة بحر للشحن',
      'Printful and Printify',
      'the b7rx service',
      'برنت شوب',
    ];
    for (const text of notNamed) expect(mentionsBrand(text), text).toBe(false);
  });

  it('reads the URLs per engine: OpenAI and Anthropic sources, Google hosts, Perplexity raw, plain text', () => {
    expect(
      citedUrls({
        kind: 'openai',
        text: 'x',
        sources: [{ url: 'https://b7r.sa/products' }, { url: 'https://www.printful.com/' }],
        raw: null,
      }),
    ).toEqual(['https://b7r.sa/products', 'https://www.printful.com/']);
    // Google's URLs are grounding redirects; the title carries the host.
    expect(
      citedUrls({
        kind: 'google',
        text: 'x',
        sources: [
          {
            url: 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/AbC',
            title: 'b7r.sa',
          },
          {
            url: 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/DeF',
            title: 'www.printify.com',
          },
          { url: 'https://example.com/real', title: 'not a host' },
        ],
        raw: null,
      }),
    ).toEqual(['https://b7r.sa/', 'https://printify.com/', 'https://example.com/real']);
    // Perplexity through a compatible endpoint keeps them in the raw body.
    expect(
      citedUrls({
        kind: 'openai-compatible',
        text: 'x',
        sources: [],
        raw: {
          citations: ['https://b7r.sa/blog/a'],
          search_results: [{ url: 'https://gelato.com/sa' }, { title: 'no url' }],
        },
      }),
    ).toEqual(['https://b7r.sa/blog/a', 'https://gelato.com/sa']);
    // The plain mode has only the text; trailing punctuation is stripped, duplicates folded.
    expect(
      citedUrls({
        kind: 'deepseek',
        text: 'راجع https://b7r.sa/products. أو https://b7r.sa/products، وكذلك https://printify.com/)',
        sources: [],
        raw: null,
      }),
    ).toEqual(['https://b7r.sa/products', 'https://printify.com/']);
  });

  it('reads an answer: mentioned, linked, the competitors by host or by name, the excerpt', () => {
    const reading = readAnswer({
      kind: 'anthropic',
      text: `${'بحر برنت خيار محلي. '.repeat(30)}Printful ships from abroad.`,
      sources: [{ url: 'https://www.b7r.sa/products' }, { url: 'https://merch.amazon.com/x' }],
      raw: null,
    });
    expect(reading.mentioned).toBe(true);
    expect(reading.linked).toBe(true);
    expect(reading.competitors).toEqual(['merch.amazon.com', 'printful.com']);
    expect(reading.excerpt).toHaveLength(400);
    const none = readAnswer({
      kind: 'deepseek',
      text: 'Try local printers.',
      sources: [],
      raw: null,
    });
    expect(none).toEqual({
      mentioned: false,
      linked: false,
      urls: [],
      competitors: [],
      excerpt: 'Try local printers.',
    });
  });

  it('the mock engine names B7R with a link on Arabic and two competitors on English', async () => {
    const ask = mockAsker();
    const ar = await ask('أفضل موقع طباعة؟');
    const en = await ask('Best print on demand?');
    expect(readAnswer({ kind: 'mock', ...ar })).toMatchObject({ mentioned: true, linked: true });
    expect(readAnswer({ kind: 'mock', ...en })).toMatchObject({
      mentioned: false,
      linked: false,
      competitors: ['printful.com', 'printify.com'],
    });
    expect(ar.mode).toBe('plain');
  });
});

describe('the cost, the labels, the tools (ADR-049 D5)', () => {
  it('adds the vendor search fee per search to the token cost', () => {
    const usage = { inputTokens: 100_000, outputTokens: 50_000 };
    expect(batchCostUsd(spec(), usage, 0)).toBe(0.6);
    expect(batchCostUsd(spec(), usage, 15)).toBe(0.75);
    expect(batchCostUsd(spec({ kind: 'google' }), usage, 15)).toBe(1.125);
    expect(batchCostUsd(spec({ kind: 'deepseek' }), usage, 15)).toBe(0.6);
    expect(KINDS.anthropic.searchFeeUsd).toBe(0.01);
    expect(KINDS['openai-compatible'].searchFeeUsd).toBe(0);
  });

  it('labels a batch in one line', () => {
    expect(batchLabel({ label: 'OpenAI', asked: 15, cited: 6, notRun: 0 })).toBe(
      'Citation ledger, OpenAI: 15 prompts, 6 cited',
    );
    expect(batchLabel({ label: 'Claude', asked: 1, cited: 0, notRun: 14 })).toBe(
      'Citation ledger, Claude: 1 prompt, 0 cited, 14 not run',
    );
  });

  it('leaves the ledger out of the daily cost cap', () => {
    expect(
      costTodayOf([
        { kind: 'generate', costUsd: 0.4 },
        { kind: 'freshness', costUsd: 0.1 },
        { kind: 'citation', costUsd: 3 },
        { kind: 'generate', costUsd: null },
      ]),
    ).toBe(0.5);
  });

  it('hands each vendor its own search tool under the key the vendor names', () => {
    expect(Object.keys(searchTool({ kind: 'openai', apiKey: 'k' }) ?? {})).toEqual(['web_search']);
    expect(Object.keys(searchTool({ kind: 'anthropic', apiKey: 'k' }) ?? {})).toEqual([
      'web_search',
    ]);
    expect(Object.keys(searchTool({ kind: 'google', apiKey: 'k' }) ?? {})).toEqual([
      'google_search',
    ]);
    expect(searchTool({ kind: 'deepseek', apiKey: 'k' })).toBeNull();
    expect(searchTool({ kind: 'openai-compatible', apiKey: 'k' })).toBeNull();
    expect(searchTool({ kind: 'mock', apiKey: '' })).toBeNull();
  });
});

describe('the ledger reading (ADR-049 D5)', () => {
  it('counts the cited-rate on the non-brand prompts only', () => {
    expect(citedRateOf([])).toBeNull();
    expect(citedRateOf([citation({ namesBrand: true, mentioned: true })])).toBeNull();
    expect(
      citedRateOf([
        citation({ mentioned: true }),
        citation({ id: 2, mentioned: false }),
        citation({ id: 3, namesBrand: true, mentioned: true }),
      ]),
    ).toEqual({ runs: 2, cited: 1 });
  });

  it('points an uncited prompt at the page whose title shares the most words', () => {
    const candidates = [
      { title: 'كيف تسعّر تيشيرتاً مطبوعاً في السعودية', label: 'التسعير', href: '/p/1' },
      { title: 'الطباعة عند الطلب في السعودية: أمثلة', label: 'الطباعة', href: '/p/2' },
      { title: 'About', label: 'About', href: '/p/3' },
    ];
    expect(bestMatch('أفضل موقع طباعة على الطلب في السعودية؟', candidates)).toEqual({
      label: 'الطباعة',
      href: '/p/2',
    });
    expect(bestMatch('hoodie printing riyadh', candidates)).toBeNull();
  });

  it('seeds ten Arabic and five English prompts, two naming the brand', () => {
    expect(SEED_PROMPTS.filter((p) => p.language === 'ar')).toHaveLength(10);
    expect(SEED_PROMPTS.filter((p) => p.language === 'en')).toHaveLength(5);
    expect(SEED_PROMPTS.filter((p) => p.namesBrand).map((p) => p.intent)).toEqual([
      'compare',
      'compare',
    ]);
    expect(SEED_PROMPTS.every((p) => p.namesBrand === mentionsBrand(p.text))).toBe(true);
  });
});

describe('the weekly batch (ADR-049 D5)', () => {
  const mock = { id: 7, label: 'Mock', kind: 'mock', model: 'mock', apiKey: null, enabled: true };
  const env = { AI_CONTENT_MOCK: '1' };

  it('asks every prompt on the mock, one citation run and one row each, the label saying how many', async () => {
    const { payload, created, updated } = fakeLedgerPayload({ connections: [mock] });
    const result = await runLedger(payload, { now: new Date('2026-09-14T04:00:00Z'), env });
    expect(result.date).toBe('2026-09-14');
    expect(result.connections).toEqual([
      {
        connection: 'Mock',
        status: 'done',
        reason: null,
        asked: 15,
        cited: 10,
        notRun: 0,
        costUsd: 0,
      },
    ]);
    const runs = created.filter((c) => c.collection === 'ai-runs');
    const rows = created.filter((c) => c.collection === 'citations');
    expect(runs).toHaveLength(1);
    expect(runs[0]!.data).toMatchObject({ kind: 'citation', status: 'running', connection: 7 });
    expect(rows).toHaveLength(15);
    expect(rows.filter((r) => r.data['mentioned']).length).toBe(10);
    expect(rows.filter((r) => r.data['namesBrand']).length).toBe(2);
    expect(rows[0]!.data).toMatchObject({
      date: '2026-09-14',
      provider: 'mock',
      mode: 'plain',
      run: 1,
    });
    expect(updated[0]!.data).toMatchObject({
      label: 'Citation ledger, Mock: 15 prompts, 10 cited',
      status: 'done',
      tokensIn: 600,
      tokensOut: 900,
      costUsd: 0,
    });
  });

  it('skips a connection over its limit, asked within the hour, without a key, or the mock outside its gate', async () => {
    const cases: Array<
      [Record<string, unknown>, Partial<Parameters<typeof fakeLedgerPayload>[0]>, RegExp]
    > = [
      [{ ...mock, id: 1, monthlyLimitUsd: 5 }, { spentUsd: 5 }, /reached the limit 5 USD/],
      [{ ...mock, id: 2 }, { runsWithinHour: 1 }, /asked within the hour/],
      [
        { id: 3, label: 'OpenAI', kind: 'openai', model: 'gpt-4.1', apiKey: null, enabled: true },
        {},
        /no API key/,
      ],
    ];
    for (const [connection, extra, reason] of cases) {
      const { payload, created } = fakeLedgerPayload({ connections: [connection], ...extra });
      // eslint-disable-next-line no-await-in-loop
      const result = await runLedger(payload, { env });
      expect(result.connections[0]).toMatchObject({
        status: 'skipped',
        reason: expect.stringMatching(reason),
      });
      expect(created).toEqual([
        expect.objectContaining({
          collection: 'ai-runs',
          data: expect.objectContaining({ kind: 'citation', status: 'skipped' }),
        }),
      ]);
    }
    const gated = fakeLedgerPayload({ connections: [mock] });
    const result = await runLedger(gated.payload, { env: {} });
    expect(result.connections[0]?.reason).toMatch(/AI_CONTENT_MOCK/);
  });

  it('stops asking when the budget is spent and says how many were not run', async () => {
    const { payload, created, updated } = fakeLedgerPayload({ connections: [mock] });
    let t = 0;
    // Each prompt costs six minutes of wall clock: three fit inside the twenty.
    const clock = () => {
      t += 6 * 60_000;
      return t;
    };
    const result = await runLedger(payload, { env, clock });
    expect(result.connections[0]).toMatchObject({ status: 'done', asked: 3, notRun: 12 });
    expect(created.filter((c) => c.collection === 'citations')).toHaveLength(3);
    expect(updated[0]!.data['label']).toMatch(/3 prompts, 3 cited, 12 not run/);
    expect(LEDGER_BUDGET_MS).toBe(20 * 60_000);
  });
});
