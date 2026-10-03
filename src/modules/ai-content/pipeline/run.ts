import { createHash } from 'node:crypto';
import type { Locale } from '@/lib/i18n';
import { capDecision } from '@/modules/ai-content/caps';
import { safeMessage } from '@/modules/connections/safe-message';
import { addUsage, estimateCostUsd, type Usage, ZERO_USAGE } from '@/modules/ai-content/cost';
import { duplicateReason } from '@/modules/ai-content/dedupe';
import {
  type Companion,
  MIN_INTERNAL_LINKS,
  otherLocale,
  writeCompanion,
} from '@/modules/ai-content/pipeline/companion';
import { sanitizeLinks } from '@/modules/ai-content/pipeline/links';
import {
  buildBrief,
  draftPrompt,
  OutlineSchema,
  outlinePrompt,
  SeoSchema,
  seoPrompt,
  systemPrompt,
} from '@/modules/ai-content/pipeline/prompts';
import { stripSharp, writeReviewed } from '@/modules/ai-content/pipeline/review';
import { PipelineStop } from '@/modules/ai-content/pipeline/stop';
import type {
  EngineSettings,
  MediaUpload,
  Outline,
  PipelineContext,
  PipelineInput,
  PipelineResult,
  StepRecord,
  StepTools,
  Store,
} from '@/modules/ai-content/pipeline/types';
import { SLUG_MAX, slugFor } from '@/modules/ai-content/transliterate';

/** A run's error keeps more of a message than a test's line (a validation report has detail). */
const RUN_MESSAGE_MAX = 1000;

/** The languages as the run's error and the alert name them. */
const LANGUAGE_NAMES: Record<Locale, string> = { ar: 'Arabic', en: 'English' };

function hash(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 12);
}

/**
 * The `generatePost` pipeline (BRD 10.2.4, ADR-066): the steps in order, each recorded on the
 * run row as it goes, the topic marked `published` or `failed` at the end. The post is written
 * in the topic's language, then in the other one by the companion (`companion.ts`); a
 * companion that fails leaves the source published in one language, said on the run and in
 * the alert. Pure over a `Store` and a `Provider`; the workflow logs each step as an inline
 * task, and the provider retries its own calls (`provider/retry.ts`).
 */
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
  let label: string | null = null;
  const settings = await store.settings();
  // Every message that leaves the pipeline (the run row, the e-mail) is scrubbed of the key.
  const apiKey = settings.connection?.apiKey ?? null;
  const message = (error: unknown) => safeMessage(error, apiKey, RUN_MESSAGE_MAX);

  /** The step machinery: timed, hashed on its input, written to the run row as it goes. */
  const tools: StepTools = {
    async step(name, inputForHash, fn, summary) {
      const t0 = Date.now();
      const inputHash = hash(inputForHash);
      try {
        const out = await ctx.run(name, fn);
        await tools.record({
          name,
          inputHash,
          summary: summary(out),
          ms: Date.now() - t0,
          ok: true,
        });
        return out;
      } catch (error) {
        await tools.record({
          name,
          inputHash,
          summary: message(error),
          ms: Date.now() - t0,
          ok: false,
        });
        throw error;
      }
    },
    async record(record) {
      steps.push(record);
      if (runId !== null) await store.updateRun(runId, { steps });
    },
    addUsage(u) {
      usage = addUsage(usage, u);
    },
  };

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
        ...(label ? { label } : {}),
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
          subject: /limit/.test(decision.reason ?? '')
            ? "Content engine: the connection's monthly limit reached"
            : 'Content engine: cost cap reached',
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
    const topic = await tools.step(
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
    const kind = input.kind ?? 'generate';
    label = `${kind} [${locale}]: ${topic.title}`;
    const run = await store.createRun({
      label,
      kind,
      topic: topic.id,
      ...(settings.connection ? { connection: settings.connection.id } : {}),
      provider: provider.name,
      model: provider.model,
      systemPromptVersion: settings.systemPromptVersion,
      startedAt: startedAt.toISOString(),
    });
    runId = run;
    await store.updateTopic(topic.id, { lastRun: run });
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
    const brief = await tools.step(
      'brief',
      { topic: topic.id, hub: hub.id, locale },
      async () => buildBrief(topic, hub, facts, style),
      (b) => `${b.linkTargets.length} link targets`,
    );
    const system = systemPrompt(style, locale);

    // 3. outline: a freshness run keeps the structure its post has and rewrites the prose.
    const stored = input.kind === 'freshness' ? (regen?.outline ?? null) : null;
    const outline = await tools.step(
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
        tools.addUsage(res.usage);
        return res.value as Outline;
      },
      (o) => `${o.headings.length} H2s${stored ? ' (stored)' : ''}`,
    );
    await store.updateRun(run, { outline });

    // 4. draft, 5. review (+ revision passes).
    const draft = await tools.step(
      'draft',
      { outline: hash(outline), version: settings.systemPromptVersion },
      async () => {
        const res = await provider.text({
          step: 'draft',
          system,
          prompt: draftPrompt(brief, outline, settings),
        });
        tools.addUsage(res.usage);
        return stripSharp(res.text);
      },
      (d) => `${d.length} chars`,
    );
    const reviewed = await writeReviewed({
      ctx,
      settings,
      brief,
      tools,
      draft,
      names: { review: 'review', revise: 'revise' },
      onReview: (r) => store.updateRun(run, { score: r.score, rubric: r.rubric }),
    });
    const links = sanitizeLinks(reviewed.draft, brief.linkTargets);
    if (links.internal < MIN_INTERNAL_LINKS) {
      throw new PipelineStop(
        `only ${links.internal} internal link(s) after the allowlist (${links.dropped.join(', ') || 'none dropped'})`,
        'failed',
      );
    }
    const article = links.markdown;

    // 7. seo (before the image: its alt text serves a stock photo).
    const seo = await tools.step(
      'seo',
      { draft: hash(article) },
      async () => {
        const res = await provider.object({
          step: 'seo',
          system,
          prompt: seoPrompt(brief, article),
          schema: SeoSchema,
          name: 'seo',
        });
        tools.addUsage(res.usage);
        return res.value;
      },
      (s) => s.title,
    );

    // The other language (ADR-066): its failure never fails the run.
    let companion: Companion | null = null;
    let oneLanguage: string | null = null;
    try {
      companion = await writeCompanion({
        ctx,
        settings,
        tools,
        topic,
        source: { locale, outline, draft: article },
      });
    } catch (error) {
      oneLanguage = message(error);
      await tools.record({
        name: 'companion',
        inputHash: hash(topic.id),
        summary: oneLanguage,
        ms: 0,
        ok: false,
      });
    }

    // 6. image.
    const cover = regen
      ? { id: regen.cover, uploaded: false }
      : await tools.step(
          'image',
          { mode: settings.imageMode, keyword: outline.imageKeyword },
          () => coverFor(store, settings, hub, outline, { alt: seo.alt, locale }),
          (c) => `media ${c.id}`,
        );

    // 8. publish, the source then the other language.
    const body = await store.markdownToLexical(article);
    // The first posts of a live provider land as drafts for a read; the mock never counts
    // `reviewFirstRuns` down (tests and the review server publish straight away).
    const status = provider.name !== 'mock' && settings.reviewFirstRuns > 0 ? 'draft' : 'published';
    const post = await tools.step(
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
        return store.createPost({ ...base, slug, cover: cover.id, status }, locale);
      },
      (p) => `post ${p.id} (${status})`,
    );
    if (companion) {
      // A regeneration republishes (`replacePost`), so its other language is live too.
      const written = regen ? 'published' : status;
      try {
        await publishCompanion({
          store,
          tools,
          postId: post.id,
          companion,
          status: written,
          cover,
        });
      } catch (error) {
        oneLanguage = message(error);
      }
    }
    if (status === 'draft') await store.decrementReviewFirstRuns();

    // 9. notify: the run row is the digest's source; one language only is said and mailed.
    const both = companion !== null && oneLanguage === null;
    label = `${kind} [${both ? `${locale}+${otherLocale(locale)}` : locale}]: ${topic.title}`;
    const warning =
      oneLanguage === null ? null : oneLanguageWarning(locale, regen !== null, oneLanguage);
    if (warning) await alertOneLanguage(store, tools, settings, { run, post: post.id, warning });
    return finish(
      {
        status: 'done',
        runId,
        postId: post.id,
        score: reviewed.review.score,
        reason: warning ?? (status === 'draft' ? 'held as a draft (reviewFirstRuns)' : null),
        usage,
      },
      warning ?? undefined,
    );
  } catch (error) {
    const reason = message(error);
    const status = error instanceof PipelineStop ? error.status : 'failed';
    return finish({ status, runId, postId: null, score: null, reason, usage }, reason);
  }
}

/**
 * What the run says when the other language was not written. A regeneration rewrote the source
 * and left the other language's previous text standing, so it says that instead.
 */
function oneLanguageWarning(locale: Locale, rewritten: boolean, reason: string): string {
  const [source, other] = [LANGUAGE_NAMES[locale], LANGUAGE_NAMES[otherLocale(locale)]];
  return rewritten
    ? `Rewritten in ${source} only; the ${other}, if any, is the previous text: ${reason}`
    : `Published in ${source} only: ${reason}`;
}

/** The other language onto the post the source wrote, and its alt onto a cover the run uploaded. */
async function publishCompanion(written: {
  store: Store;
  tools: StepTools;
  postId: number;
  companion: Companion;
  status: 'draft' | 'published';
  cover: { id: number; uploaded: boolean };
}): Promise<void> {
  const { store, tools, postId, companion, status, cover } = written;
  await tools.step(
    `publish-${companion.locale}`,
    { post: postId, locale: companion.locale, status },
    async () => {
      const body = await store.markdownToLexical(companion.markdown);
      await store.writeLocale(
        postId,
        {
          title: companion.title,
          excerpt: companion.excerpt,
          takeaways: companion.takeaways,
          body,
          seo: companion.seo,
        },
        companion.locale,
        status,
      );
      if (cover.uploaded) await store.setImageAlt(cover.id, companion.alt, companion.locale);
    },
    () => `post ${postId} (${companion.locale}, score ${companion.score})`,
  );
}

/**
 * The alert for a post that went out in one language. A mail that fails is written on the run
 * as a step, never thrown: the post is published by then and the run is done.
 */
async function alertOneLanguage(
  store: Store,
  tools: StepTools,
  settings: EngineSettings,
  sent: { run: number; post: number; warning: string },
): Promise<void> {
  if (!settings.failureAlerts || !settings.notifyEmail) return;
  try {
    await store.sendEmail({
      to: settings.notifyEmail,
      subject: 'Content engine: a post was published in one language',
      text: `Run ${sent.run} published post ${sent.post}. ${sent.warning}`,
    });
  } catch (error) {
    await tools.record({
      name: 'alert',
      inputHash: hash(sent.run),
      summary: error instanceof Error ? error.name : 'the alert was not sent',
      ms: 0,
      ok: false,
    });
  }
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
  alt: { alt: string; locale: Locale },
): Promise<{ id: number; uploaded: boolean }> {
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
    if (photo) {
      return {
        id: await store.uploadImage({ ...photo, alt: alt.alt }, alt.locale),
        uploaded: true,
      };
    }
  }
  if (hub.defaultCoverId === null) throw new PipelineStop('the hub has no default cover', 'failed');
  return { id: hub.defaultCoverId, uploaded: false };
}
