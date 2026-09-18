import type { Payload } from 'payload';
import { describe, expect, it } from 'vitest';
import { costTodayOf } from '@/modules/ai-content/caps';
import { KINDS } from '@/modules/connections/kinds';
import { searchTool } from '@/modules/connections/model';
import { mockAsker, searchesOf } from '@/modules/visibility/ledger/ask';
import { citedUrls, mentionsBrand, readAnswer } from '@/modules/visibility/ledger/read-answer';
import { bestMatch, citedRateOf, type CitationRow } from '@/modules/visibility/ledger/reading';
import {
  batchCostUsd,
  batchLabel,
  daysBetween,
  duePrompts,
  LEDGER_BUDGET_MS,
  runLedger,
} from '@/modules/visibility/ledger/run';
import { SEED_EVERY_DAYS, SEED_PROMPTS } from '@/modules/visibility/ledger/seed';

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
  answer: null,
  createdAt: '2026-09-14T04:00:00.000Z',
  ...over,
});

/** A Payload with prompts, connections and the rows the run writes, recorded. */
function fakeLedgerPayload(args: {
  connections: Array<Record<string, unknown>>;
  prompts?: Array<Record<string, unknown>>;
  runsWithinHour?: number;
  spentUsd?: number;
  /** The citation rows already on the connection, newest first (the due check reads them). */
  citations?: Array<{ prompt: number; date: string }>;
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
      if (collection === 'citations') {
        const docs = args.citations ?? [];
        return { docs, totalDocs: docs.length };
      }
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

/** The competitors an answer names, by name alone (no sources). */
const byName = (text: string) =>
  readAnswer({ kind: 'deepseek', text, sources: [], raw: null }).competitors;

/** A prompt of the ledger's shape with its period. */
const prompt = (id: number, everyDays: number) => ({
  id,
  text: 'x',
  language: 'ar' as const,
  namesBrand: false,
  everyDays,
});

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
    // By name on word boundaries: "merchant" is not Merch by Amazon, "springboard" is not Spring.
    expect(byName('A merchant needs a springboard; try Gelato or Redbubble.')).toEqual([
      'gelato.com',
      'redbubble.com',
    ]);
    expect(
      byName('Merch by Amazon pays royalties; Printify prints; برنتفل يشحن من أوروبا'),
    ).toEqual(['printful.com', 'printify.com', 'merch.amazon.com']);
    expect(byName('the printfulness of it')).toEqual([]);
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

  it('counts the searches per vendor: tool calls for OpenAI and Anthropic, one grounded prompt for Google', () => {
    const steps = [
      { content: [{ type: 'tool-call' }, { type: 'tool-result' }, { type: 'text' }] },
      { content: [{ type: 'tool-call' }, { type: 'text' }] },
    ];
    expect(searchesOf('openai', { steps, sources: [] })).toBe(2);
    expect(searchesOf('anthropic', { steps: [{ content: [{ type: 'text' }] }], sources: [] })).toBe(
      0,
    );
    // Google emits no tool-call part for grounding: the sources or the metadata say it grounded.
    expect(searchesOf('google', { steps: [{ content: [{ type: 'text' }] }], sources: [{}] })).toBe(
      1,
    );
    expect(
      searchesOf('google', {
        steps: [{ content: [{ type: 'text' }] }],
        sources: [],
        providerMetadata: { google: { groundingMetadata: { webSearchQueries: ['x'] } } },
      }),
    ).toBe(1);
    expect(searchesOf('google', { steps: [{ content: [{ type: 'text' }] }], sources: [] })).toBe(0);
    // Anthropic reports the real number; the tool-call parts over-count it.
    expect(
      searchesOf('anthropic', {
        steps,
        sources: [],
        providerMetadata: { anthropic: { usage: { server_tool_use: { web_search_requests: 1 } } } },
      }),
    ).toBe(1);
    expect(searchesOf('anthropic', { steps, sources: [] })).toBe(2);
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
    // The fee follows the model family: the mini models search at $25 a thousand.
    expect(batchCostUsd(spec({ model: 'gpt-4.1-mini' }), usage, 10)).toBe(0.85);
    expect(batchCostUsd(spec({ kind: 'google', model: 'gemini-3-flash-preview' }), usage, 10)).toBe(
      0.74,
    );
    expect(KINDS.anthropic.searchFeeUsd).toBe(0.01);
    expect(KINDS['openai-compatible'].searchFeeUsd).toBe(0);
  });

  it('labels a batch in one line, the failures and the leftovers named', () => {
    expect(batchLabel({ label: 'OpenAI', asked: 15, cited: 6, notRun: 0 })).toBe(
      'Citation ledger, OpenAI: 15 prompts, 6 cited',
    );
    expect(batchLabel({ label: 'Claude', asked: 1, cited: 0, failed: 2, notRun: 12 })).toBe(
      'Citation ledger, Claude: 1 prompt, 0 cited, 2 failed, 12 not run',
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

  it('points an uncited prompt at the page whose title shares the most words, in either language', () => {
    const candidates = [
      { title: 'كيف تسعّر تيشيرتاً مطبوعاً في السعودية', label: 'التسعير', href: '/p/1' },
      { title: 'الطباعة عند الطلب في السعودية: أمثلة', label: 'الطباعة', href: '/p/2' },
      { title: 'Print on demand in Saudi Arabia: examples', label: 'POD', href: '/p/2?locale=en' },
      { title: 'About', label: 'About', href: '/p/3' },
    ];
    expect(bestMatch('أفضل موقع طباعة على الطلب في السعودية؟', candidates)).toEqual({
      label: 'الطباعة',
      href: '/p/2',
    });
    expect(bestMatch('Best print on demand service in Saudi Arabia?', candidates)).toEqual({
      label: 'POD',
      href: '/p/2?locale=en',
    });
    expect(bestMatch('hoodie riyadh', candidates)).toBeNull();
  });

  it('seeds fourteen Arabic and eight English prompts, nine naming the brand, all weekly', () => {
    expect(SEED_PROMPTS.filter((p) => p.language === 'ar')).toHaveLength(14);
    expect(SEED_PROMPTS.filter((p) => p.language === 'en')).toHaveLength(8);
    // The two compare prompts and the seven brand questions name B7R and leave the rate.
    expect(SEED_PROMPTS.filter((p) => p.namesBrand)).toHaveLength(9);
    expect(SEED_PROMPTS.every((p) => p.namesBrand === mentionsBrand(p.text))).toBe(true);
    expect(new Set(SEED_PROMPTS.map((p) => p.text)).size).toBe(SEED_PROMPTS.length);
    expect(SEED_EVERY_DAYS).toBe(7);
  });

  it('asks a prompt again only when its period has passed, and never asked means due', () => {
    expect(daysBetween('2026-09-10', '2026-09-16')).toBe(6);
    expect(daysBetween('2026-09-16', '2026-09-16')).toBe(0);
    const prompts = [prompt(1, 1), prompt(2, 7), prompt(3, 30), prompt(4, 1)];
    const last = new Map([
      [1, '2026-09-15'],
      [2, '2026-09-10'],
      [3, '2026-09-01'],
    ]);
    expect(duePrompts(prompts, last, '2026-09-16').map((p) => p.id)).toEqual([1, 4]);
    expect(duePrompts(prompts, last, '2026-09-17').map((p) => p.id)).toEqual([1, 2, 4]);
    expect(duePrompts(prompts, last, '2026-10-01').map((p) => p.id)).toEqual([1, 2, 3, 4]);
    expect(
      duePrompts(prompts, new Map([[1, '2026-09-16']]), '2026-09-16').map((p) => p.id),
    ).toEqual([2, 3, 4]);
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
        asked: 22,
        cited: 14,
        notRun: 0,
        costUsd: 0,
      },
    ]);
    const runs = created.filter((c) => c.collection === 'ai-runs');
    const rows = created.filter((c) => c.collection === 'citations');
    expect(runs).toHaveLength(1);
    expect(runs[0]!.data).toMatchObject({ kind: 'citation', status: 'running', connection: 7 });
    expect(rows).toHaveLength(22);
    expect(rows.filter((r) => r.data['mentioned']).length).toBe(14);
    expect(rows.filter((r) => r.data['namesBrand']).length).toBe(9);
    expect(rows[0]!.data).toMatchObject({
      title: '2026-09-14 · Mock',
      date: '2026-09-14',
      provider: 'mock',
      mode: 'plain',
      promptText: SEED_PROMPTS[0]!.text,
      run: 1,
    });
    expect(updated[0]!.data).toMatchObject({
      label: 'Citation ledger, Mock: 22 prompts, 14 cited',
      status: 'done',
      tokensIn: 880,
      tokensOut: 1320,
      costUsd: 0,
    });
  });

  it('a scheduled run asks only what is due and writes no row when nothing is; "Run now" asks everything', async () => {
    const today = new Date('2026-09-16T04:00:00Z');
    const asked = (citations: Array<{ prompt: number; date: string }>) =>
      fakeLedgerPayload({ connections: [mock], citations });
    // Every seeded prompt is daily and was asked this morning already: nothing due, no row.
    const all = asked(SEED_PROMPTS.map((_, i) => ({ prompt: i + 1, date: '2026-09-16' })));
    const idle = await runLedger(all.payload, { now: today, env });
    expect(idle.connections).toEqual([
      {
        connection: 'Mock',
        status: 'skipped',
        reason: 'nothing due today',
        asked: 0,
        cited: 0,
        notRun: 0,
        costUsd: 0,
      },
    ]);
    expect(all.created).toEqual([]);
    // Asked yesterday: due again today; "Run now" asks whatever the day says.
    const stale = asked(SEED_PROMPTS.map((_, i) => ({ prompt: i + 1, date: '2026-09-15' })));
    expect((await runLedger(stale.payload, { now: today, env })).connections[0]?.asked).toBe(22);
    const forced = asked(SEED_PROMPTS.map((_, i) => ({ prompt: i + 1, date: '2026-09-16' })));
    expect(
      (await runLedger(forced.payload, { now: today, env, all: true })).connections[0]?.asked,
    ).toBe(22);
  });

  it('treats a prompt whose text names B7R as brand-naming whatever the box says', async () => {
    const { payload, created } = fakeLedgerPayload({
      connections: [mock],
      prompts: [
        { id: 1, text: 'بحر برنت أم Printful؟', language: 'ar', namesBrand: false, enabled: true },
        { id: 2, text: 'Is b7r.sa legit?', language: 'en', namesBrand: false, enabled: true },
        { id: 3, text: 'أين أطبع هودي؟', language: 'ar', namesBrand: false, enabled: true },
      ],
    });
    await runLedger(payload, { env });
    const rows = created.filter((c) => c.collection === 'citations');
    expect(rows.map((r) => r.data['namesBrand'])).toEqual([true, true, false]);
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
    expect(result.connections[0]).toMatchObject({ status: 'done', asked: 3, notRun: 19 });
    expect(created.filter((c) => c.collection === 'citations')).toHaveLength(3);
    expect(updated[0]!.data['label']).toMatch(/3 prompts, 3 cited, 19 not run/);
    expect(LEDGER_BUDGET_MS).toBe(20 * 60_000);
  });
});
