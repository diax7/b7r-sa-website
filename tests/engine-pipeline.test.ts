import { describe, expect, it } from 'vitest';
import { linkTargets, plainText } from '@/lib/lexical';
import { wordCount } from '@/modules/ai-content/checks';
import { runPipeline } from '@/modules/ai-content/pipeline/run';
import type { PipelineContext } from '@/modules/ai-content/pipeline/types';
import { mockProvider } from '@/modules/ai-content/provider/mock';
import { FACTS, memoryStore, settings } from './helpers/engine-store';

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
      'image',
      'publish',
    ]);
    expect(run['status']).toBe('done');
    expect(run['outline']).toMatchObject({ takeaways: expect.any(Array) });
    expect(run['tokensIn']).toBeGreaterThan(0);
    expect(run['costUsd']).toBe(0);
    expect(provider.calls.map((c) => c.step)).toEqual(['outline', 'draft', 'review', 'seo']);
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
    expect(low.provider.calls.map((c) => c.step)).toEqual([
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
    const capped = context({ counts: { runsToday: 1, runsThisMonth: 1, costTodayUsd: 0 } });
    expect((await runPipeline(capped.ctx, { manual: true })).reason).toMatch(/today/);
    const costly = context({ counts: { runsToday: 0, runsThisMonth: 0, costTodayUsd: 9 } });
    const result = await runPipeline(costly.ctx, { manual: true });
    expect(result.reason).toMatch(/cost/);
    expect(costly.state.emails[0]?.subject).toMatch(/cost cap/);
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
