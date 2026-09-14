import { z } from 'zod';
import type { Locale } from '@/lib/i18n';
import type { FactsSheet } from '@/modules/ai-content/facts';
import type {
  EngineSettings,
  EngineStyle,
  HubInfo,
  Outline,
  Rubric,
  Topic,
} from '@/modules/ai-content/pipeline/types';

/**
 * The prompts of the nine tasks (BRD 10.2.4), in the topic's language (ADR-043). Every
 * prompt opens with the same header lines (`LANGUAGE:`, `TOPIC:`, `KEYWORD:`, `HUB:`) so
 * the run log, the mock and a person reading the job all see the same thing. The facts
 * sheet goes into every call; the style guide into the system prompt.
 */
export interface Brief {
  topic: Topic;
  locale: Locale;
  hub: HubInfo;
  facts: FactsSheet;
  style: EngineStyle;
  questions: string[];
  linkTargets: string[];
}

export function buildBrief(
  topic: Topic,
  hub: HubInfo,
  facts: FactsSheet,
  style: EngineStyle,
): Brief {
  const locale = topic.language;
  const questions = TEXT[locale].questions(topic.primaryKeyword);
  const blog = locale === 'ar' ? '/blog' : '/en/blog';
  const linkTargets = [...facts.links, ...hub.posts.map((p) => `${blog}/${p.slug}`)];
  return { topic, locale, hub, facts, style, questions, linkTargets };
}

function header(brief: Brief): string {
  const t = TEXT[brief.locale];
  return [
    `LANGUAGE: ${brief.locale}`,
    `TOPIC: ${brief.topic.title}`,
    `KEYWORD: ${brief.topic.primaryKeyword}`,
    `HUB: ${brief.hub.name}`,
    `SECONDARY: ${brief.topic.secondaryKeywords.join(t.listSeparator) || t.none}`,
    `INTENT: ${brief.topic.intent}`,
  ].join('\n');
}

export function systemPrompt(style: EngineStyle, locale: Locale): string {
  const t = TEXT[locale];
  return `${style.systemPrompt}\n\n${t.styleGuideLabel}\n${style.styleGuide}\n\n${t.bannedClaimsLabel}\n${style.bannedClaims}`;
}

export const OutlineSchema = z.object({
  headings: z
    .array(z.object({ question: z.string().min(3), answer: z.string().min(3) }))
    .min(4)
    .max(7),
  takeaways: z.array(z.string().min(5)).length(3),
  imageKeyword: z.string().min(3),
});

export function outlinePrompt(brief: Brief): string {
  return `${header(brief)}\n\n${TEXT[brief.locale].outline(brief)}`;
}

export function draftPrompt(brief: Brief, outline: Outline, settings: EngineSettings): string {
  return `${header(brief)}\n\n${TEXT[brief.locale].draft(brief, outline, settings)}`;
}

export function revisePrompt(
  brief: Brief,
  draft: string,
  critique: string,
  problems: string[],
): string {
  return `${header(brief)}\nREVISION PASS\n\n${TEXT[brief.locale].revise(brief, draft, critique, problems)}`;
}

export const RubricSchema = z.object({
  facts: z.number().min(0).max(30),
  language: z.number().min(0).max(25),
  structure: z.number().min(0).max(20),
  usefulness: z.number().min(0).max(15),
  formatting: z.number().min(0).max(10),
  critique: z.string(),
});

export function reviewPrompt(brief: Brief, draft: string, revision: boolean): string {
  return `${header(brief)}${revision ? '\nREVISION PASS' : ''}\n\n${TEXT[brief.locale].review(brief, draft)}`;
}

export function rubricTotal(r: Rubric): number {
  return Math.round(r.facts + r.language + r.structure + r.usefulness + r.formatting);
}

export const SeoSchema = z.object({
  title: z.string().min(10).max(70),
  description: z.string().min(40).max(160),
  slug: z.string().max(60),
  alt: z.string().min(5).max(200),
});

export function seoPrompt(brief: Brief, draft: string): string {
  return `${header(brief)}\n\n${TEXT[brief.locale].seo(draft)}`;
}

interface PromptText {
  listSeparator: string;
  none: string;
  styleGuideLabel: string;
  bannedClaimsLabel: string;
  questions(keyword: string): string[];
  outline(brief: Brief): string;
  draft(brief: Brief, outline: Outline, settings: EngineSettings): string;
  revise(brief: Brief, draft: string, critique: string, problems: string[]): string;
  review(brief: Brief, draft: string): string;
  seo(draft: string): string;
}

const TEXT: Record<Locale, PromptText> = {
  ar: {
    listSeparator: '، ',
    none: 'لا شيء',
    styleGuideLabel: 'دليل الأسلوب:',
    bannedClaimsLabel: 'ادعاءات ممنوعة:',
    questions: (keyword) => [
      `ما المقصود بـ${keyword} ولماذا يهم تاجراً في السعودية؟`,
      `كيف يبدأ التاجر عملياً، خطوة بخطوة، بأقل تكلفة؟`,
      `كم يكسب من القطعة الواحدة بأرقام الكتالوج الحقيقية؟`,
    ],
    outline: (
      brief,
    ) => `ضع مخطط مقال عن الموضوع أعلاه لقسم "${brief.hub.name}" (${brief.hub.description}).
- من 4 إلى 7 عناوين H2 بصيغة أسئلة، ولكل عنوان جواب مباشر في جملة واحدة.
- العنوان الأول يجيب عن الكلمة المفتاحية نفسها.
- المقال يجيب عن هذه الأسئلة الثلاثة في مكان ما: ${brief.questions.join(' | ')}
- ثلاث نقاط "أهم النقاط" قصيرة.
- كلمة إنجليزية واحدة أو اثنتان للبحث عن صورة غلاف (مثلاً: printed t-shirt studio).

ورقة الحقائق:
${brief.facts.text}`,
    draft: (brief, outline, settings) => {
      const headings = outline.headings
        .map((h, i) => `${i + 1}. ## ${h.question}\n   الجواب المباشر: ${h.answer}`)
        .join('\n');
      return `اكتب المقال كاملاً بصيغة Markdown، بين ${settings.minWords} و${settings.maxWords} كلمة، بهذا المخطط:
${headings}

القواعد:
- فقرة افتتاحية بلا عنوان، ثم العناوين بالترتيب. كل عنوان يبدأ بجوابه المباشر ثم التفصيل.
- مثال واحد على الأقل بأرقام حقيقية من ورقة الحقائق (التكلفة، السعر المقترح، الربح، مدة التوصيل).
- رابطان داخليان على الأقل بصيغة [نص](/مسار) إلى هذه المسارات فقط: ${brief.linkTargets.join(' ، ')}
- لا روابط خارجية إلا إلى b7r.app أو مواقع حكومية سعودية.
- لا أرقام ولا وعود خارج ورقة الحقائق. لا ذكر للذكاء الاصطناعي. لا شرطة طويلة. لا جداول. لا عنوان H1.
- الأسلوب: فصحى مبسطة، فقرات قصيرة، قوائم عند الحاجة، أفعال أولاً في الإرشادات.

ورقة الحقائق:
${brief.facts.text}`;
    },
    revise: (
      brief,
      draft,
      critique,
      problems,
    ) => `أعد كتابة المقال التالي مع إصلاح ما يلي فقط، وأبقِ الباقي كما هو:
- ملاحظات المراجع: ${critique}
${problems.map((p) => `- ${p}`).join('\n')}

المقال:
${draft}

ورقة الحقائق:
${brief.facts.text}`,
    review: (
      brief,
      draft,
    ) => `قيّم المقال التالي على 100 نقطة بهذا التوزيع، وأعطِ نقداً عملياً في ثلاث جمل:
- facts (30): كل رقم وكل وعد موجود في ورقة الحقائق؛ أي رقم غريب يخصم نقاطاً.
- language (25): فصحى مبسطة بلا عبارات ممنوعة (قم بـ، تم، يرجى، بنجاح، الخاص بك، هناك).
- structure (20): عناوين H2 أسئلة، كل عنوان يبدأ بجواب مباشر، مثال رقمي، روابط داخلية.
- usefulness (15): مفيد ومحدد لتاجر سعودي يبدأ اليوم.
- formatting (10): الطول، الفقرات القصيرة، القوائم حيث تفيد، لا جداول، لا عنوان H1.

المقال:
${draft}

ورقة الحقائق:
${brief.facts.text}`,
    seo: (draft) => `من المقال التالي اقترح:
- title: عنوان للبحث حتى 60 حرفاً يحتوي الكلمة المفتاحية.
- description: وصف حتى 155 حرفاً.
- slug: معرّف لاتيني قصير بحروف صغيرة وشرطات (حتى 40 حرفاً) مترجم من الكلمة المفتاحية.
- alt: نص بديل عربي وصفي لصورة غلاف عن الموضوع (يصف الصورة لا الموضوع).

المقال:
${draft.slice(0, 2500)}`,
  },
  en: {
    listSeparator: ', ',
    none: 'none',
    styleGuideLabel: 'Style guide:',
    bannedClaimsLabel: 'Banned claims:',
    questions: (keyword) => [
      `What does "${keyword}" mean and why does it matter to a merchant in Saudi Arabia?`,
      `How does a merchant start in practice, step by step, at the lowest cost?`,
      `How much do they earn per piece, with the real numbers of the catalogue?`,
    ],
    outline: (
      brief,
    ) => `Outline an article on the topic above for the "${brief.hub.name}" hub (${brief.hub.description}).
- 4 to 7 H2 headings phrased as questions, each with a direct one-sentence answer.
- The first heading answers the keyword itself.
- Somewhere, the article answers these three questions: ${brief.questions.join(' | ')}
- Three short "key takeaways".
- One or two English words to search a cover photo with (for example: printed t-shirt studio).

Facts sheet:
${brief.facts.text}`,
    draft: (brief, outline, settings) => {
      const headings = outline.headings
        .map((h, i) => `${i + 1}. ## ${h.question}\n   Direct answer: ${h.answer}`)
        .join('\n');
      return `Write the whole article in Markdown, between ${settings.minWords} and ${settings.maxWords} words, on this outline:
${headings}

Rules:
- An opening paragraph with no heading, then the headings in order. Each heading opens with its direct answer, then the detail.
- At least one example with real numbers from the facts sheet (cost, suggested price, profit, delivery time).
- At least two internal links written as [text](/path) to these paths only: ${brief.linkTargets.join(', ')}
- No external links except to b7r.app or Saudi government sites.
- No numbers and no promises beyond the facts sheet. No mention of AI. No em dash. No tables. No H1.
- Style: plain, direct English; short paragraphs; lists where they help; verbs first in instructions; "SAR 45" for money, "5 days" for durations.

Facts sheet:
${brief.facts.text}`;
    },
    revise: (
      brief,
      draft,
      critique,
      problems,
    ) => `Rewrite the article below fixing only the points listed, and keep everything else as it is:
- Reviewer's notes: ${critique}
${problems.map((p) => `- ${p}`).join('\n')}

Article:
${draft}

Facts sheet:
${brief.facts.text}`,
    review: (
      brief,
      draft,
    ) => `Score the article below out of 100 on this split, and give a practical critique in three sentences:
- facts (30): every number and every promise is on the facts sheet; a stray number costs points.
- language (25): plain, natural English with no banned phrases (leverage, unlock, seamless, game-changing, in today's world, it's important to note).
- structure (20): H2 headings as questions, each opening with a direct answer, a numeric example, internal links.
- usefulness (15): useful and specific for a Saudi merchant starting today.
- formatting (10): length, short paragraphs, lists where they help, no tables, no H1.

Article:
${draft}

Facts sheet:
${brief.facts.text}`,
    seo: (draft) => `From the article below propose:
- title: a search title of up to 60 characters containing the keyword.
- description: a description of up to 155 characters.
- slug: a short lowercase slug with hyphens (up to 40 characters) from the keyword.
- alt: descriptive English alt text for a cover photo about the topic (describe the picture, not the topic).

Article:
${draft.slice(0, 2500)}`,
  },
};
