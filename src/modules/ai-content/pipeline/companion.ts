import type { Locale } from '@/lib/i18n';
import { sanitizeLinks } from '@/modules/ai-content/pipeline/links';
import {
  buildBrief,
  type CompanionOutline,
  companionDraftPrompt,
  CompanionOutlineSchema,
  companionOutlinePrompt,
  SeoSchema,
  seoPrompt,
  systemPrompt,
} from '@/modules/ai-content/pipeline/prompts';
import { stripSharp, writeReviewed } from '@/modules/ai-content/pipeline/review';
import { PipelineStop } from '@/modules/ai-content/pipeline/stop';
import type {
  EngineSettings,
  Outline,
  PipelineContext,
  StepTools,
  Topic,
} from '@/modules/ai-content/pipeline/types';

/** The rule the source keeps too: a post links into the site at least twice. */
export const MIN_INTERNAL_LINKS = 2;

/** The other language of the site's two. */
export const otherLocale = (locale: Locale): Locale => (locale === 'ar' ? 'en' : 'ar');

/** The other language's version of a post, ready to write onto it. */
export interface Companion {
  locale: Locale;
  title: string;
  excerpt: string;
  seo: { title: string; description: string };
  takeaways: string[];
  markdown: string;
  alt: string;
  score: number;
}

export interface CompanionInput {
  ctx: PipelineContext;
  settings: EngineSettings;
  tools: StepTools;
  topic: Topic;
  /** The source as it passed: its language, outline and final article. */
  source: { locale: Locale; outline: Outline; draft: string };
}

/**
 * The companion language (ADR-066): the post the source wrote, written again in the other
 * language as a native writer would, through the same outline, draft, review and SEO steps
 * and the other language's style, facts, links and checks. The outline step returns the
 * working title and the search phrase in that language, and the brief is rebuilt from them.
 * Throws like the source does (a `PipelineStop` for a refusal, a low score or too few links;
 * a model error after its retries); the caller publishes the source alone then.
 */
export async function writeCompanion(input: CompanionInput): Promise<Companion> {
  const { ctx, settings, tools, topic, source } = input;
  const { store, provider } = ctx;
  const locale = otherLocale(source.locale);
  const [facts, hub, style] = await Promise.all([
    store.facts(locale),
    store.hub(topic.hubId, locale),
    store.style(locale),
  ]);
  const system = systemPrompt(style, locale);
  const seed = buildBrief({ ...topic, language: locale, secondaryKeywords: [] }, hub, facts, style);
  const adapted = await tools.step(
    `outline-${locale}`,
    { topic: topic.id, locale },
    async () => {
      const res = await provider.object({
        step: 'outline',
        system,
        prompt: companionOutlinePrompt(seed, source.outline, source.locale),
        schema: CompanionOutlineSchema,
        name: 'outline',
      });
      tools.addUsage(res.usage);
      return res.value as CompanionOutline;
    },
    (o) => `${o.headings.length} H2s: ${o.title}`,
  );
  const brief = buildBrief(
    {
      ...topic,
      language: locale,
      title: adapted.title,
      primaryKeyword: adapted.keyword,
      secondaryKeywords: [],
    },
    hub,
    facts,
    style,
  );
  const outline: Outline = {
    headings: adapted.headings,
    takeaways: adapted.takeaways,
    imageKeyword: source.outline.imageKeyword,
  };
  const draft = await tools.step(
    `draft-${locale}`,
    { title: adapted.title, version: settings.systemPromptVersion },
    async () => {
      const res = await provider.text({
        step: 'draft',
        system,
        prompt: companionDraftPrompt(brief, outline, settings, source.draft, source.locale),
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
    names: { review: `review-${locale}`, revise: `revise-${locale}` },
  });
  const links = sanitizeLinks(reviewed.draft, brief.linkTargets);
  if (links.internal < MIN_INTERNAL_LINKS) {
    throw new PipelineStop(
      `only ${links.internal} internal link(s) after the allowlist (${links.dropped.join(', ') || 'none dropped'})`,
      'failed',
    );
  }
  const seo = await tools.step(
    `seo-${locale}`,
    { title: adapted.title },
    async () => {
      const res = await provider.object({
        step: 'seo',
        system,
        prompt: seoPrompt(brief, links.markdown),
        schema: SeoSchema,
        name: 'seo',
      });
      tools.addUsage(res.usage);
      return res.value;
    },
    (s) => s.title,
  );
  return {
    locale,
    title: seo.title.length <= 70 ? seo.title : adapted.title.slice(0, 70),
    excerpt: seo.description.slice(0, 160),
    seo: { title: seo.title.slice(0, 70), description: seo.description.slice(0, 160) },
    takeaways: outline.takeaways,
    markdown: links.markdown,
    alt: seo.alt,
    score: reviewed.review.score,
  };
}
