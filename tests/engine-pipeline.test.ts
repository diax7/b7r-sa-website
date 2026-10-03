import { describe, expect, it } from 'vitest';
import { linkTargets, plainText } from '@/lib/lexical';
import { wordCount } from '@/modules/ai-content/checks';
import { runPipeline } from '@/modules/ai-content/pipeline/run';
import type { PipelineContext } from '@/modules/ai-content/pipeline/types';
import { mockProvider } from '@/modules/ai-content/provider/mock';
import { connection, FACTS, memoryStore, settings, topic } from './helpers/engine-store';

const LATE = () => new Date('2026-09-14T07:30:00Z'); // 10:30 in Riyadh, after the 9:00 slot
const runDirect: PipelineContext['run'] = async (_name, fn) => fn();

function context(overrides: Parameters<typeof memoryStore>[0] = {}, providerOptions = {}) {
  const { store, state } = memoryStore(overrides);
  const provider = mockProvider({ facts: FACTS, ...providerOptions });
  const ctx: PipelineContext = {
    store,
    provider,
    now: LATE,
    run: runDirect,
    env: { AI_CONTENT_MOCK: '1' },
  };
  return { ctx, state, provider };
}

describe('generatePost with the mock provider (BRD 10.2.4, 10.3 item 2)', () => {
  it('runs the nine steps in order and publishes a post that meets the rules', async () => {
    const { ctx, state, provider } = context();
    const result = await runPipeline(ctx);
    expect(result.status).toBe('done');
    expect(result.score).toBeGreaterThanOrEqual(80);
    // The steps, in order, on the run row; the review twice would mean a revision pass.
    const run = state.runs.get(result.runId!)!;
    const names = (run['steps'] as Array<{ name: string; ok: boolean }>).map((s) => s.name);
    expect(names).toEqual([
      'pickTopic',
      'brief',
      'outline',
      'draft',
      'review',
      'seo',
      'outline-en',
      'draft-en',
      'review-en',
      'seo-en',
      'image',
      'publish',
      'publish-en',
    ]);
    expect(run['status']).toBe('done');
    expect(run['outline']).toMatchObject({ takeaways: expect.any(Array) });
    expect(run['tokensIn']).toBeGreaterThan(0);
    expect(run['costUsd']).toBe(0);
    // The source's four calls, then the companion's four under the same step names.
    expect(provider.calls.map((c) => c.step)).toEqual([
      'outline',
      'draft',
      'review',
      'seo',
      'outline',
      'draft',
      'review',
      'seo',
    ]);
    // The post: three takeaways, two internal links, the hub's cover, published, no AI mention.
    const post = state.posts[0]!;
    expect(post.status).toBe('published');
    expect(post.takeaways).toHaveLength(3);
    expect(post.cover).toBe(77);
    expect(post.slug).toMatch(/^[a-z0-9-]+$/);
    expect(post.title.length).toBeLessThanOrEqual(70);
    expect(post.excerpt.length).toBeLessThanOrEqual(160);
    expect(linkTargets(post.body).filter((l) => l.internal).length).toBeGreaterThanOrEqual(2);
    const text = plainText(post.body);
    expect(text).not.toMatch(/ذكاء اصطناعي|\bAI\b/);
    expect(text).not.toContain(String.fromCharCode(0x2014));
    expect(wordCount(text)).toBeGreaterThanOrEqual(300);
    // The topic points at the post and the run.
    expect(state.topicStatus.get(10)).toBe('published');
    expect(state.topicPatches.at(-1)?.patch).toMatchObject({ status: 'published', post: post.id });
    expect(state.emails).toEqual([]);
  });

  it('writes an English topic on the English blog: English prompts, facts, links and rules (ADR-043)', async () => {
    const english = topic({
      id: 11,
      language: 'en',
      title: 'How to start a clothing brand in Saudi Arabia with no factory and no stock',
      primaryKeyword: 'start a clothing brand in Saudi Arabia',
      secondaryKeywords: ['print on demand Saudi Arabia'],
    });
    const { ctx, state, provider } = context({ topics: [english] });
    const result = await runPipeline(ctx);
    expect(result.status).toBe('done');
    // The source's prompts name English and carry the English facts sheet and link targets;
    // the companion's name Arabic and the language they adapt from (ADR-066).
    const [source, companion] = [provider.calls.slice(0, 4), provider.calls.slice(4)];
    for (const call of source) expect(call.prompt).toMatch(/^LANGUAGE: en$/m);
    expect(companion.map((c) => c.step)).toEqual(['outline', 'draft', 'review', 'seo']);
    for (const call of companion) expect(call.prompt).toMatch(/^LANGUAGE: ar$/m);
    expect(
      companion.filter((c) => /^SOURCE LANGUAGE: en$/m.test(c.prompt)).map((c) => c.step),
    ).toEqual(['outline', 'draft']);
    const draftPrompt = provider.calls.find((c) => c.step === 'draft')!.prompt;
    expect(draftPrompt).toContain('Facts sheet:');
    expect(draftPrompt).toContain('Company: ');
    expect(draftPrompt).toContain('/en/products/tee-essential');
    expect(draftPrompt).toContain('/en/blog/start-clothing-brand-saudi-no-factory-no-stock');
    expect(draftPrompt).not.toContain('/blog/start-clothing-brand-saudi-no-factory-no-stock,');
    // The post lands in the English locale with an English slug and English links.
    const post = state.posts[0]!;
    expect(state.postLocales.get(post.id)).toBe('en');
    expect(post.slug).toMatch(/^[a-z0-9-]+$/);
    expect(post.slug).toContain('start-a-clothing-brand');
    const text = plainText(post.body);
    expect(text).not.toMatch(/[؀-ۿ]/);
    expect(
      linkTargets(post.body).filter((l) => l.href.startsWith('/en/')).length,
    ).toBeGreaterThanOrEqual(2);
    expect(wordCount(text)).toBeGreaterThanOrEqual(300);
    // The Arabic is written onto the same post, and the run's label names both languages.
    expect(state.localeWrites).toHaveLength(1);
    const arabic = state.localeWrites[0]!;
    expect(arabic).toMatchObject({ id: post.id, locale: 'ar', status: 'published' });
    expect(arabic.fields.title).toMatch(/[؀-ۿ]/);
    expect(arabic.fields.takeaways).toHaveLength(3);
    const arabicLinks = linkTargets(arabic.fields.body).filter((l) => l.internal);
    expect(arabicLinks.length).toBeGreaterThanOrEqual(2);
    for (const link of arabicLinks) expect(link.href).not.toMatch(/^\/en\//);
    const run = state.runs.get(result.runId!)!;
    expect(run['label']).toBe(`generate [en+ar]: ${english.title}`);
  });

  it('holds a live provider’s first posts as drafts and counts them down', async () => {
    const { ctx, state } = context();
    ctx.provider = { ...ctx.provider, name: 'openai' };
    const result = await runPipeline(ctx);
    expect(result.status).toBe('done');
    expect(state.posts[0]!.status).toBe('draft');
    expect(state.reviewFirstRunsDecrements).toBe(1);
    expect(result.reason).toMatch(/draft/);
  });

  it('revises once when the review is below the threshold, then fails when still below', async () => {
    const low = context({}, { reviewScore: 60, revisedScore: 85 });
    const ok = await runPipeline(low.ctx);
    expect(ok.status).toBe('done');
    // Both languages take their revision pass under the same rule.
    expect(low.provider.calls.map((c) => c.step)).toEqual([
      'outline',
      'draft',
      'review',
      'revise',
      'review',
      'seo',
      'outline',
      'draft',
      'review',
      'revise',
      'review',
      'seo',
    ]);
    const still = context({}, { reviewScore: 60, revisedScore: 62 });
    const failed = await runPipeline(still.ctx);
    expect(failed.status).toBe('failed');
    expect(failed.reason).toMatch(/below the threshold/);
    expect(still.state.topicStatus.get(10)).toBe('failed');
    expect(still.state.emails[0]).toMatchObject({ to: 'dhia@example.com', subject: /failed/ });
    expect(still.state.posts).toHaveLength(0);
  });

  it('skips a duplicate topic and marks it rejected', async () => {
    const { ctx, state } = context({
      published: [
        {
          title: 'بيع تيشيرتات بدون رأس مال: الخطوات',
          primaryKeyword: 'بيع تيشيرتات بدون رأس مال',
          publishedAt: '2026-08-01T00:00:00Z',
        },
      ],
    });
    const result = await runPipeline(ctx);
    expect(result.status).toBe('skipped');
    expect(result.reason).toMatch(/duplicate/);
    expect(state.topicStatus.get(10)).toBe('rejected');
    expect(state.posts).toHaveLength(0);
  });

  it('skips before the publish hour, off, or over a cap; a manual run ignores the hour only', async () => {
    const early = context();
    early.ctx.now = () => new Date('2026-09-14T04:00:00Z');
    expect((await runPipeline(early.ctx)).reason).toMatch(/publish hour/);
    expect((await runPipeline(early.ctx, { manual: true })).status).toBe('done');
    const off = context({ settings: settings({ enabled: false }) });
    expect((await runPipeline(off.ctx, { manual: true })).reason).toMatch(/switched off/);
    const zero = { runsToday: 0, runsThisMonth: 0, costTodayUsd: 0, connectionSpentMonthUsd: 0 };
    const capped = context({ counts: { ...zero, runsToday: 1, runsThisMonth: 1 } });
    expect((await runPipeline(capped.ctx, { manual: true })).reason).toMatch(/today/);
    const costly = context({ counts: { ...zero, costTodayUsd: 9 } });
    const result = await runPipeline(costly.ctx, { manual: true });
    expect(result.reason).toMatch(/cost/);
    expect(costly.state.emails[0]?.subject).toMatch(/cost cap/);
    // The connection (ADR-047): none, off, or over its monthly limit refuses with the reason
    // in the skipped row; the limit mails like the daily cap does, under its own subject.
    const none = context({ settings: settings({ connection: null }) });
    expect((await runPipeline(none.ctx, { manual: true })).reason).toMatch(/no connection/);
    const offConnection = context({
      settings: settings({ connection: connection({ enabled: false, label: 'Paused' }) }),
    });
    const refused = await runPipeline(offConnection.ctx, { manual: true });
    expect(refused.reason).toMatch(/"Paused" is off/);
    expect([...offConnection.state.runs.values()][0]?.['error']).toMatch(/is off/);
    const limited = context({
      settings: settings({ connection: connection({ monthlyLimitUsd: 4 }) }),
      counts: { ...zero, connectionSpentMonthUsd: 4 },
    });
    const overLimit = await runPipeline(limited.ctx, { manual: true });
    expect(overLimit.reason).toMatch(/reached its limit 4 USD/);
    expect(limited.state.emails[0]?.subject).toMatch(/monthly limit reached/);
  });

  it('refuses image generation until a provider draws; stock uploads a photo', async () => {
    const generate = context({ settings: settings({ imageMode: 'generate' }) });
    const refused = await runPipeline(generate.ctx);
    expect(refused.status).toBe('failed');
    expect(refused.reason).toMatch(/not wired/);
    const stock = context({ settings: settings({ imageMode: 'stock', pexelsKey: 'px' }) });
    const done = await runPipeline(stock.ctx);
    expect(done.status).toBe('done');
    expect(stock.state.uploads).toBe(1);
    expect(stock.state.posts[0]!.cover).toBe(901);
  });

  it('takes the topic only once when two runners race', async () => {
    const { ctx, state } = context();
    const [a, b] = await Promise.all([
      runPipeline(ctx, { manual: true }),
      runPipeline(ctx, { manual: true }),
    ]);
    const statuses = [a.status, b.status].toSorted();
    expect(statuses).toEqual(['done', 'skipped']);
    expect(state.posts).toHaveLength(1);
  });

  it('regenerates a post under its slug and cover', async () => {
    const { ctx, state } = context();
    const first = await runPipeline(ctx, { manual: true });
    const post = state.posts[0]!;
    state.topicStatus.set(10, 'published');
    const again = await runPipeline(ctx, { manual: true, replacePostId: first.postId! });
    expect(again.status).toBe('done');
    expect(state.posts).toHaveLength(1);
    expect(state.posts[0]!.slug).toBe(post.slug);
    expect(state.posts[0]!.cover).toBe(post.cover);
  });
});

describe('the companion language (ADR-066)', () => {
  const ARABIC = /[؀-ۿ]/;

  it('writes the English onto the same post, and the run keeps the source’s score and outline', async () => {
    const { ctx, state, provider } = context();
    const result = await runPipeline(ctx);
    expect(result.status).toBe('done');
    const post = state.posts[0]!;
    expect(state.postLocales.get(post.id)).toBe('ar');
    expect(state.localeWrites).toHaveLength(1);
    const english = state.localeWrites[0]!;
    expect(english).toMatchObject({ id: post.id, locale: 'en', status: 'published' });
    expect(english.fields.title).not.toMatch(ARABIC);
    expect(english.fields.takeaways).toHaveLength(3);
    expect(english.fields.seo.title.length).toBeLessThanOrEqual(70);
    expect(english.fields.excerpt.length).toBeLessThanOrEqual(160);
    const text = plainText(english.fields.body);
    expect(text).not.toMatch(ARABIC);
    expect(wordCount(text)).toBeGreaterThanOrEqual(300);
    const links = linkTargets(english.fields.body).filter((l) => l.internal);
    expect(links.length).toBeGreaterThanOrEqual(2);
    for (const link of links) expect(link.href).toMatch(/^\/en\//);
    // The companion prompts adapt the Arabic, with the Arabic links reduced to their text.
    const draft = provider.calls.filter((c) => c.step === 'draft')[1]!.prompt;
    expect(draft).toMatch(/^SOURCE LANGUAGE: ar$/m);
    expect(draft).not.toMatch(/\]\(\/products\//);
    // The run: both languages in its label, the source's score, rubric and outline, every
    // call's tokens.
    const run = state.runs.get(result.runId!)!;
    expect(run['label']).toBe(`generate [ar+en]: ${state.topics[0]!.title}`);
    expect(run['error']).toBeUndefined();
    expect(run['score']).toBe(result.score);
    expect((run['rubric'] as { critique: string }).critique).toMatch(ARABIC);
    const outline = run['outline'] as { headings: Array<{ question: string }> };
    expect(outline.headings[0]!.question).toMatch(ARABIC);
    expect(run['tokensIn']).toBe(1200 * provider.calls.length);
    expect(state.emails).toEqual([]);
  });

  it('publishes the source alone when the English is refused after its revision pass, and says so', async () => {
    const { ctx, state, provider } = context({}, { emDashIn: 'en' });
    const result = await runPipeline(ctx);
    expect(result.status).toBe('done');
    expect(state.posts[0]!.status).toBe('published');
    expect(state.localeWrites).toEqual([]);
    // The English took its revision pass before it was refused.
    expect(provider.calls.slice(4).map((c) => c.step)).toEqual([
      'outline',
      'draft',
      'review',
      'revise',
      'review',
    ]);
    const run = state.runs.get(result.runId!)!;
    expect(run['status']).toBe('done');
    expect(run['error']).toMatch(/^Published in Arabic only: refused: An em dash/);
    expect(run['label']).toBe(`generate [ar]: ${state.topics[0]!.title}`);
    const steps = run['steps'] as Array<{ name: string; ok: boolean }>;
    expect(steps.find((s) => s.name === 'companion')).toMatchObject({ ok: false });
    expect(state.topicStatus.get(10)).toBe('published');
    expect(state.emails).toHaveLength(1);
    expect(state.emails[0]).toMatchObject({ subject: /published in one language/ });
    expect(state.emails[0]!.text).toMatch(/Published in Arabic only/);
  });

  it('gives a refused source its revision pass before the run fails', async () => {
    const { ctx, state, provider } = context({}, { emDashIn: 'ar' });
    const result = await runPipeline(ctx);
    expect(result.status).toBe('failed');
    expect(result.reason).toMatch(/refused: An em dash/);
    expect(provider.calls.map((c) => c.step)).toEqual([
      'outline',
      'draft',
      'review',
      'revise',
      'review',
    ]);
    expect(state.posts).toHaveLength(0);
    expect(state.localeWrites).toHaveLength(0);
  });

  it('writes the other language as a draft when the source is held for a read', async () => {
    const { ctx, state } = context();
    ctx.provider = { ...ctx.provider, name: 'openai' };
    const result = await runPipeline(ctx);
    expect(result.status).toBe('done');
    expect(state.posts[0]!.status).toBe('draft');
    expect(state.localeWrites[0]).toMatchObject({ locale: 'en', status: 'draft' });
  });

  it('rewrites both languages on a regeneration', async () => {
    const { ctx, state } = context();
    const first = await runPipeline(ctx, { manual: true });
    state.topicStatus.set(10, 'published');
    const again = await runPipeline(ctx, { manual: true, replacePostId: first.postId! });
    expect(again.status).toBe('done');
    expect(state.localeWrites.map((w) => [w.id, w.locale, w.status])).toEqual([
      [first.postId, 'en', 'published'],
      [first.postId, 'en', 'published'],
    ]);
  });

  it('keeps the source published when writing the other language fails', async () => {
    const { ctx, state } = context();
    ctx.store = {
      ...ctx.store,
      async writeLocale() {
        throw new Error('the database went away');
      },
    };
    const result = await runPipeline(ctx);
    expect(result.status).toBe('done');
    const run = state.runs.get(result.runId!)!;
    expect(run['error']).toMatch(/^Published in Arabic only: the database went away/);
    expect(run['label']).toMatch(/^generate \[ar\]:/);
    const steps = run['steps'] as Array<{ name: string; ok: boolean }>;
    expect(steps.find((s) => s.name === 'publish-en')).toMatchObject({ ok: false });
  });

  it('records an alert it cannot send instead of failing a published run', async () => {
    const { ctx, state } = context({}, { emDashIn: 'en' });
    ctx.store = {
      ...ctx.store,
      async sendEmail() {
        throw new Error('the mail server refused');
      },
    };
    const result = await runPipeline(ctx);
    expect(result.status).toBe('done');
    const steps = state.runs.get(result.runId!)!['steps'] as Array<{ name: string; ok: boolean }>;
    expect(steps.find((s) => s.name === 'alert')).toMatchObject({ ok: false });
  });

  it('uploads a stock cover with the source’s alt and adds the other language’s', async () => {
    const { ctx, state } = context({ settings: settings({ imageMode: 'stock', pexelsKey: 'px' }) });
    const result = await runPipeline(ctx);
    expect(result.status).toBe('done');
    expect(state.uploadLocales).toEqual(['ar']);
    expect(state.altWrites).toEqual([{ id: 901, alt: expect.any(String), locale: 'en' }]);
    expect(state.altWrites[0]!.alt).not.toMatch(ARABIC);
  });

  it('hands the topic’s notes to the model', async () => {
    const noted = topic({ notes: 'ركّز على المتاجر الصغيرة في جدة.' });
    const { ctx, provider } = context({ topics: [noted] });
    await runPipeline(ctx);
    expect(provider.calls[0]!.prompt).toMatch(/^NOTES: ركّز على المتاجر الصغيرة في جدة\.$/m);
    const plain = context();
    await runPipeline(plain.ctx);
    expect(plain.provider.calls[0]!.prompt).not.toMatch(/^NOTES:/m);
  });
});

describe('the companion language on a regeneration (ADR-066)', () => {
  it('says the other language kept its previous text when its rewrite fails', async () => {
    const { ctx, state } = context();
    const first = await runPipeline(ctx, { manual: true });
    state.topicStatus.set(10, 'published');
    ctx.store = {
      ...ctx.store,
      async writeLocale() {
        throw new Error('the database went away');
      },
    };
    const again = await runPipeline(ctx, { manual: true, replacePostId: first.postId! });
    expect(again.status).toBe('done');
    expect(state.runs.get(again.runId!)!['error']).toBe(
      'Rewritten in Arabic only; the English is the previous text: the database went away',
    );
  });
});
