import { createHash } from 'node:crypto';
import { checkDraft, deterministicScore } from '@/modules/ai-content/checks';
import type { Usage } from '@/modules/ai-content/cost';
import {
  type Brief,
  reviewPrompt,
  revisePrompt,
  RubricSchema,
  rubricTotal,
  systemPrompt,
} from '@/modules/ai-content/pipeline/prompts';
import { PipelineStop } from '@/modules/ai-content/pipeline/stop';
import type {
  EngineSettings,
  PipelineContext,
  Rubric,
  StepRecord,
  StepTools,
} from '@/modules/ai-content/pipeline/types';

export interface ReviewOutcome {
  score: number;
  rubric: Rubric & { deductions: Array<{ rule: string; points: number; detail: string }> };
  problems: string[];
  refused: string[];
  record: StepRecord;
}

/** A level-one heading the model added anyway: the post's title is its H1. */
export function stripSharp(text: string): string {
  return text.replace(/^#\s.*$/gm, '').trim();
}

/** Step 5: the deterministic checks, then the model's rubric, merged into one score. */
async function reviewDraft(
  ctx: PipelineContext,
  settings: EngineSettings,
  brief: Brief,
  draft: string,
  name: string,
  revision: boolean,
  addUsage: (usage: Usage) => void,
): Promise<ReviewOutcome> {
  const t0 = Date.now();
  const checks = checkDraft(draft, brief.facts.numbers, {
    bannedPhrases: brief.style.bannedPhrases,
    minWords: settings.minWords,
    maxWords: settings.maxWords,
    locale: brief.locale,
  });
  const res = await ctx.run(name, () =>
    ctx.provider.object({
      step: 'review',
      system: systemPrompt(brief.style, brief.locale),
      prompt: reviewPrompt(brief, draft, revision),
      schema: RubricSchema,
      name: 'review',
    }),
  );
  addUsage(res.usage);
  const modelTotal = rubricTotal(res.value);
  const deterministic = deterministicScore(checks);
  const score = Math.max(0, Math.min(modelTotal, deterministic, 100));
  return {
    score,
    rubric: { ...res.value, deductions: checks.deductions },
    problems: checks.deductions.map((d) => d.detail),
    refused: checks.refused,
    record: {
      name: revision ? `${name}-2` : name,
      inputHash: createHash('sha256').update(draft).digest('hex').slice(0, 12),
      summary: `${score} (model ${modelTotal}, checks ${deterministic}; ${checks.words} words)`,
      ms: Date.now() - t0,
      ok: true,
    },
  };
}

const passed = (review: ReviewOutcome, settings: EngineSettings) =>
  review.refused.length === 0 && review.score >= settings.qualityThreshold;

/**
 * Review and revise until the draft passes (BRD 10.2.4 step 5, ADR-066): a score below the
 * threshold or a refusal (an em dash, a mention of AI) takes a revision pass with the
 * reviewer's critique, the refusals and the problems the checks found; after the last pass a
 * refusal or a low score stops the run. `names` are the step records (`review`, `revise`;
 * `review-en`, `revise-en` for the companion); `onReview` sees each review as it lands.
 */
export async function writeReviewed(
  ctx: PipelineContext,
  settings: EngineSettings,
  brief: Brief,
  draft: string,
  tools: StepTools,
  names: { review: string; revise: string },
  onReview: (review: ReviewOutcome) => Promise<void> = async () => {},
): Promise<{ draft: string; review: ReviewOutcome }> {
  let current = draft;
  let review = await reviewDraft(ctx, settings, brief, current, names.review, false, tools.addUsage);
  await tools.record(review.record);
  await onReview(review);
  for (let pass = 1; pass <= settings.maxRevisionPasses && !passed(review, settings); pass++) {
    const { critique } = review.rubric;
    const problems = [...review.refused, ...review.problems];
    const base = current;
    // A revision pass reads the previous review: sequential by nature.
    // oxlint-disable-next-line no-await-in-loop
    current = await tools.step(
      names.revise,
      { pass, score: review.score },
      async () => {
        const res = await ctx.provider.text({
          step: 'revise',
          system: systemPrompt(brief.style, brief.locale),
          prompt: revisePrompt(brief, base, critique, problems),
        });
        tools.addUsage(res.usage);
        return stripSharp(res.text);
      },
      (d) => `${d.length} chars`,
    );
    // oxlint-disable-next-line no-await-in-loop
    review = await reviewDraft(ctx, settings, brief, current, names.review, true, tools.addUsage);
    // oxlint-disable-next-line no-await-in-loop
    await tools.record(review.record);
    // oxlint-disable-next-line no-await-in-loop
    await onReview(review);
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
  return { draft: current, review };
}
