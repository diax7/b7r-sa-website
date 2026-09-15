import { createHash } from 'node:crypto';
import { capDecision } from '@/modules/ai-content/caps';
import { checkDraft, deterministicScore } from '@/modules/ai-content/checks';
import { addUsage, estimateCostUsd, type Usage, ZERO_USAGE } from '@/modules/ai-content/cost';
import { duplicateReason } from '@/modules/ai-content/dedupe';
import { sanitizeLinks } from '@/modules/ai-content/pipeline/links';
import {
  type Brief,
  buildBrief,
  draftPrompt,
  OutlineSchema,
  outlinePrompt,
  reviewPrompt,
  revisePrompt,
  RubricSchema,
  rubricTotal,
  SeoSchema,
  seoPrompt,
  systemPrompt,
} from '@/modules/ai-content/pipeline/prompts';
import type {
  EngineSettings,
  MediaUpload,
  Outline,
  PipelineContext,
  PipelineInput,
  PipelineResult,
  Rubric,
  StepRecord,
  Store,
} from '@/modules/ai-content/pipeline/types';
import type { Provider } from '@/modules/ai-content/provider/types';
import { SLUG_MAX, slugFor } from '@/modules/ai-content/transliterate';

/**
 * The `generatePost` pipeline (BRD 10.2.4): nine steps in order, each recorded on the run
 * row as it goes, the topic marked `published` or `failed` at the end. Pure over a `Store`
 * and a `Provider`; Payload's workflow wraps each step in an inline task for retries.
 */
const MIN_INTERNAL_LINKS = 2;

class PipelineStop extends Error {
  constructor(
    message: string,
    readonly status: 'failed' | 'skipped',
  ) {
    super(message);
    this.name = 'PipelineStop';
  }
}

function hash(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 12);
}

function stripSharp(text: string): string {
  return text.replace(/^#\s.*$/gm, '').trim();
}

export async function runPipeline(
  ctx: PipelineContext,
  input: PipelineInput = {},
): Promise<PipelineResult> {
  const { store, provider } = ctx;
  const startedAt = ctx.now();
  const steps: StepRecord[] = [];
  let usage: Usage = ZERO_USAGE;
  let runId: number | null = null;
  let topicId: number | null = null;
  const settings = await store.settings();

  /** One step: timed, hashed on its input, written to the run row, retried by the runner. */
  async function step<T>(
    name: string,
    inputForHash: unknown,
    fn: () => Promise<T>,
    summary: (out: T) => string,
  ): Promise<T> {
    const t0 = Date.now();
    try {
      const out = await ctx.run(name, fn, { retries: LLM_STEPS.has(name) ? 2 : 0 });
      steps.push({
        name,
        inputHash: hash(inputForHash),
        summary: summary(out),
        ms: Date.now() - t0,
        ok: true,
      });
      if (runId !== null) await store.updateRun(runId, { steps });
      return out;
    } catch (error) {
      steps.push({
        name,
        inputHash: hash(inputForHash),
        summary: error instanceof Error ? error.message : String(error),
        ms: Date.now() - t0,
        ok: false,
      });
      if (runId !== null) await store.updateRun(runId, { steps });
      throw error;
    }
  }

  const finish = async (result: PipelineResult, error?: string): Promise<PipelineResult> => {
    const rates = settings.connection?.rates ?? { inputPerMillionUsd: 0, outputPerMillionUsd: 0 };
    const costUsd = estimateCostUsd(usage, rates);
    if (runId !== null) {
      await store.updateRun(runId, {
        status: result.status,
        steps,
        tokensIn: usage.inputTokens,
        tokensOut: usage.outputTokens,
        costUsd,
        durationMs: Date.now() - startedAt.getTime(),
        finishedAt: ctx.now().toISOString(),
        ...(result.postId !== null ? { post: result.postId } : {}),
        ...(result.score !== null ? { score: result.score } : {}),
        ...(error ? { error } : {}),
      });
    }
    if (topicId !== null) {
      if (result.status === 'done') {
        await store.updateTopic(topicId, {
          status: 'published',
          ...(result.postId !== null ? { post: result.postId } : {}),
          ...(runId !== null ? { lastRun: runId } : {}),
          lastError: null,
        });
      } else if (result.status === 'failed') {
        // A failed regeneration leaves the post standing, so its topic stays `published`.
        await store.updateTopic(topicId, {
          status: input.replacePostId ? 'published' : 'failed',
          ...(runId !== null ? { lastRun: runId } : {}),
          lastError: error ?? result.reason,
        });
        if (settings.failureAlerts && settings.notifyEmail) {
          await store.sendEmail({
            to: settings.notifyEmail,
            subject: 'Content engine: a run failed',
            text: `Run ${runId ?? '?'} for topic ${topicId} failed: ${error ?? result.reason}\nSteps: ${steps.map((s) => `${s.name} ${s.ok ? 'ok' : 'FAILED'} (${s.ms} ms)`).join(', ')}`,
          });
        }
      } else {
        await store.updateTopic(topicId, { status: 'backlog', lastError: result.reason });
      }
    }
    return { ...result, usage };
  };

  try {
    // Guards, before anything is written.
    const counts = await store.counts(startedAt);
    const decision = capDecision({
      settings,
      counts,
      now: startedAt,
      manual: input.manual ?? false,
      kind: input.kind ?? 'generate',
      ...(ctx.env ? { env: ctx.env } : {}),
    });
    if (!decision.allowed) {
      if (settings.notifyEmail && /cost/.test(decision.reason ?? '')) {
        await store.sendEmail({
          to: settings.notifyEmail,
          subject: 'Content engine: cost cap reached',
          text: decision.reason ?? '',
        });
      }
      // A person who pressed the button gets a row that says why; the hourly tick stays quiet.
      if (input.manual) {
        runId = await store.createRun({
          label: `${input.kind ?? 'generate'}: skipped`,
          kind: input.kind ?? 'generate',
          ...(input.topicId ? { topic: input.topicId } : {}),
          ...(settings.connection ? { connection: settings.connection.id } : {}),
          provider: provider.name,
          model: provider.model,
          systemPromptVersion: settings.systemPromptVersion,
          startedAt: startedAt.toISOString(),
        });
      }
      return finish(
        { status: 'skipped', runId, postId: null, score: null, reason: decision.reason, usage },
        decision.reason ?? undefined,
      );
    }

    // 1. pickTopic (compare-and-set) and dedupe.
    const regen = input.replacePostId ? await store.postForRegeneration(input.replacePostId) : null;
    if (input.replacePostId && !regen?.topicId) {
      return finish({
        status: 'skipped',
        runId: null,
        postId: null,
        score: null,
        reason: 'the post has no topic to regenerate from',
        usage,
      });
    }
    const topic = await step(
      'pickTopic',
      { topicId: input.topicId ?? regen?.topicId ?? null },
      () =>
        store.pickTopic(startedAt, input.topicId ?? regen?.topicId ?? undefined, regen !== null),
      (t) => (t ? `topic ${t.id}: ${t.title}` : 'nothing to write'),
    );
    if (!topic) {
      const asked = input.topicId ?? regen?.topicId;
      return finish({
        status: 'skipped',
        runId: null,
        postId: null,
        score: null,
        reason: asked
          ? `topic ${asked} cannot be picked (deleted, generating or already written)`
          : 'no topic in the backlog with an open window',
        usage,
      });
    }
    topicId = topic.id;
    const locale = topic.language;
    runId = await store.createRun({
      label: `${input.kind ?? 'generate'}${locale === 'ar' ? '' : ` [${locale}]`}: ${topic.title}`,
      kind: input.kind ?? 'generate',
      topic: topic.id,
      ...(settings.connection ? { connection: settings.connection.id } : {}),
      provider: provider.name,
      model: provider.model,
      systemPromptVersion: settings.systemPromptVersion,
      startedAt: startedAt.toISOString(),
    });
    await store.updateTopic(topic.id, { lastRun: runId });
    if (!regen) {
      const published = await store.publishedPosts(locale);
      const duplicate = duplicateReason(topic, published, startedAt);
      if (duplicate) {
        await store.updateTopic(topic.id, { status: 'rejected', lastError: duplicate });
        topicId = null;
        return finish(
          {
            status: 'skipped',
            runId,
            postId: null,
            score: null,
            reason: `duplicate: ${duplicate}`,
            usage,
          },
          duplicate,
        );
      }
    }

    // 2. brief, in the topic's language (ADR-043).
    const [facts, hub, style] = await Promise.all([
      store.facts(locale),
      store.hub(topic.hubId, locale),
      store.style(locale),
    ]);
    const brief = await step(
      'brief',
      { topic: topic.id, hub: hub.id, locale },
      async () => buildBrief(topic, hub, facts, style),
      (b) => `${b.linkTargets.length} link targets`,
    );
    const system = systemPrompt(style, locale);

    // 3. outline: a freshness run keeps the structure its post has and rewrites the prose.
    const stored = input.kind === 'freshness' ? (regen?.outline ?? null) : null;
    const outline = await step(
      'outline',
      { brief: brief.topic.id, hub: hub.slug, stored: stored !== null },
      async () => {
        if (stored) return stored;
        const res = await provider.object({
          step: 'outline',
          system,
          prompt: outlinePrompt(brief),
          schema: OutlineSchema,
          name: 'outline',
        });
        usage = addUsage(usage, res.usage);
        return res.value as Outline;
      },
      (o) => `${o.headings.length} H2s${stored ? ' (stored)' : ''}`,
    );
    await store.updateRun(runId, { outline });

    // 4. draft, 5. review (+ one revision pass).
    let draft = await step(
      'draft',
      { outline: hash(outline), version: settings.systemPromptVersion },
      async () => {
        const res = await provider.text({
          step: 'draft',
          system,
          prompt: draftPrompt(brief, outline, settings),
        });
        usage = addUsage(usage, res.usage);
        return stripSharp(res.text);
      },
      (d) => `${d.length} chars`,
    );
    let review = await reviewDraft(
      ctx,
      settings,
      brief,
      draft,
      false,
      (u) => (usage = addUsage(usage, u)),
    );
    steps.push(review.record);
    await store.updateRun(runId, { steps, score: review.score, rubric: review.rubric });
    let passes = 0;
    while (
      review.score < settings.qualityThreshold &&
      passes < settings.maxRevisionPasses &&
      review.refused.length === 0
    ) {
      passes += 1;
      // A revision pass reads the previous review: sequential by nature.
      // oxlint-disable-next-line no-await-in-loop
      draft = await step(
        'revise',
        { pass: passes, score: review.score },
        async () => {
          const res = await provider.text({
            step: 'revise',
            system,
            prompt: revisePrompt(brief, draft, review.rubric.critique, review.problems),
          });
          usage = addUsage(usage, res.usage);
          return stripSharp(res.text);
        },
        (d) => `${d.length} chars`,
      );
      // oxlint-disable-next-line no-await-in-loop
      review = await reviewDraft(
        ctx,
        settings,
        brief,
        draft,
        true,
        (u) => (usage = addUsage(usage, u)),
      );
      steps.push(review.record);
      // Each pass depends on the previous review; they cannot run in parallel.
      // oxlint-disable-next-line no-await-in-loop
      await store.updateRun(runId, { steps, score: review.score, rubric: review.rubric });
    }
    if (review.refused.length > 0) {
      throw new PipelineStop(`refused: ${review.refused.join('; ')}`, 'failed');
    }
    if (review.score < settings.qualityThreshold) {
      throw new PipelineStop(
        `score ${review.score} below the threshold ${settings.qualityThreshold}: ${review.rubric.critique}`,
        'failed',
      );
    }
    const links = sanitizeLinks(draft, brief.linkTargets);
    if (links.internal < MIN_INTERNAL_LINKS) {
      throw new PipelineStop(
        `only ${links.internal} internal link(s) after the allowlist (${links.dropped.join(', ') || 'none dropped'})`,
        'failed',
      );
    }
    draft = links.markdown;

    // 7. seo (before the image: its alt text serves a stock photo).
    const seo = await step(
      'seo',
      { draft: hash(draft) },
      async () => {
        const res = await provider.object({
          step: 'seo',
          system,
          prompt: seoPrompt(brief, draft),
          schema: SeoSchema,
          name: 'seo',
        });
        usage = addUsage(usage, res.usage);
        return res.value;
      },
      (s) => s.title,
    );

    // 6. image.
    const cover = regen
      ? regen.cover
      : await step(
          'image',
          { mode: settings.imageMode, keyword: outline.imageKeyword },
          () => coverFor(store, settings, hub, outline, seo.alt),
          (id) => `media ${id}`,
        );

    // 8. publish.
    const body = await store.markdownToLexical(draft);
    // The first posts of a live provider land as drafts for a read; the mock never counts
    // `reviewFirstRuns` down (tests and the review server publish straight away).
    const status = provider.name !== 'mock' && settings.reviewFirstRuns > 0 ? 'draft' : 'published';
    const post = await step(
      'publish',
      { slug: regen?.slug ?? seo.slug, status },
      async () => {
        const base = {
          title: seo.title.length <= 70 ? seo.title : topic.title.slice(0, 70),
          excerpt: seo.description.slice(0, 160),
          hub: hub.id,
          author: await store.authorId(),
          takeaways: outline.takeaways,
          body,
          seo: { title: seo.title.slice(0, 70), description: seo.description.slice(0, 160) },
          publishedAt: ctx.now().toISOString(),
          factsBaseline: facts.numbers,
        };
        if (regen && input.replacePostId) {
          return store.replacePost(input.replacePostId, base, locale);
        }
        const slug = await freeSlug(store, slugFor(seo.slug, topic.primaryKeyword));
        return store.createPost({ ...base, slug, cover, status }, locale);
      },
      (p) => `post ${p.id} (${status})`,
    );
    if (status === 'draft') await store.decrementReviewFirstRuns();

    // 9. notify: the run row is the digest's source; nothing to send on success.
    return finish({
      status: 'done',
      runId,
      postId: post.id,
      score: review.score,
      reason: status === 'draft' ? 'held as a draft (reviewFirstRuns)' : null,
      usage,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = error instanceof PipelineStop ? error.status : 'failed';
    return finish({ status, runId, postId: null, score: null, reason: message, usage }, message);
  }
}

const LLM_STEPS = new Set(['outline', 'draft', 'review', 'revise', 'seo', 'image']);

interface ReviewOutcome {
  score: number;
  rubric: Rubric & { deductions: Array<{ rule: string; points: number; detail: string }> };
  problems: string[];
  refused: string[];
  record: StepRecord;
}

/** Step 5: the deterministic checks, then the model's rubric, merged into one score. */
async function reviewDraft(
  ctx: PipelineContext,
  settings: EngineSettings,
  brief: Brief,
  draft: string,
  revision: boolean,
  addUsageFn: (u: Usage) => void,
): Promise<ReviewOutcome> {
  const t0 = Date.now();
  const checks = checkDraft(draft, brief.facts.numbers, {
    bannedPhrases: brief.style.bannedPhrases,
    minWords: settings.minWords,
    maxWords: settings.maxWords,
    locale: brief.locale,
  });
  const res = await ctx.run(
    'review',
    () =>
      ctx.provider.object({
        step: 'review',
        system: systemPrompt(brief.style, brief.locale),
        prompt: reviewPrompt(brief, draft, revision),
        schema: RubricSchema,
        name: 'review',
      }),
    { retries: 2 },
  );
  addUsageFn(res.usage);
  const modelTotal = rubricTotal(res.value);
  const deterministic = deterministicScore(checks);
  const score = Math.max(0, Math.min(modelTotal, deterministic, 100));
  return {
    score,
    rubric: { ...res.value, deductions: checks.deductions },
    problems: checks.deductions.map((d) => d.detail),
    refused: checks.refused,
    record: {
      name: revision ? 'review-2' : 'review',
      inputHash: createHash('sha256').update(draft).digest('hex').slice(0, 12),
      summary: `${score} (model ${modelTotal}, checks ${deterministic}; ${checks.words} words)`,
      ms: Date.now() - t0,
      ok: true,
    },
  };
}

/** `slug`, `slug-2`, `slug-3`… until the store says it is free. */
async function freeSlug(store: Store, base: string): Promise<string> {
  if (!(await store.slugTaken(base))) return base;
  for (let n = 2; n < 1000; n++) {
    const candidate = `${base.slice(0, SLUG_MAX - String(n).length - 1)}-${n}`;
    // One probe at a time: the first free candidate wins.
    // oxlint-disable-next-line no-await-in-loop
    if (!(await store.slugTaken(candidate))) return candidate;
  }
  throw new PipelineStop(`no free slug for ${base}`, 'failed');
}

/** Step 6: the cover per `imageMode`; generation is refused until a provider draws. */
async function coverFor(
  store: Store,
  settings: EngineSettings,
  hub: { defaultCoverId: number | null },
  outline: Outline,
  alt: string,
): Promise<number> {
  if (settings.imageMode === 'generate') {
    throw new PipelineStop(
      'imageMode "generate" is not wired yet: choose "hubDefault" or "stock"',
      'failed',
    );
  }
  if (settings.imageMode === 'stock') {
    if (!settings.pexelsKey)
      throw new PipelineStop('imageMode "stock" needs a Pexels key', 'failed');
    if (!store.fetchStockPhoto) throw new PipelineStop('no stock photo source', 'failed');
    const photo: MediaUpload | null = await store.fetchStockPhoto(
      outline.imageKeyword,
      settings.pexelsKey,
    );
    if (photo) return store.uploadImage({ ...photo, alt });
  }
  if (hub.defaultCoverId === null) throw new PipelineStop('the hub has no default cover', 'failed');
  return hub.defaultCoverId;
}

export { PipelineStop };
export type { Provider };
