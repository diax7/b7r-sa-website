import { z } from 'zod';
import type { FactsSheet } from '@/modules/ai-content/facts';
import type {
  EngineSettings,
  HubInfo,
  Outline,
  Rubric,
  Topic,
} from '@/modules/ai-content/pipeline/types';

/**
 * The prompts of the nine tasks (BRD 10.2.4). Every prompt opens with the same header lines
 * (`TOPIC:`, `KEYWORD:`, `HUB:`) so the run log, the mock and a person reading the job all
 * see the same thing. The facts sheet goes into every call; the style guide into the
 * system prompt.
 */
export interface Brief {
  topic: Topic;
  hub: HubInfo;
  facts: FactsSheet;
  questions: string[];
  linkTargets: string[];
}

export function buildBrief(topic: Topic, hub: HubInfo, facts: FactsSheet): Brief {
  const questions = [
    `ما المقصود بـ${topic.primaryKeyword} ولماذا يهم تاجراً في السعودية؟`,
    `كيف يبدأ التاجر عملياً، خطوة بخطوة، بأقل تكلفة؟`,
    `كم يكسب من القطعة الواحدة بأرقام الكتالوج الحقيقية؟`,
  ];
  const linkTargets = [...facts.links, ...hub.posts.map((p) => `/blog/${p.slug}`)];
  return { topic, hub, facts, questions, linkTargets };
}

function header(brief: Brief): string {
  return [
    `TOPIC: ${brief.topic.title}`,
    `KEYWORD: ${brief.topic.primaryKeyword}`,
    `HUB: ${brief.hub.name}`,
    `SECONDARY: ${brief.topic.secondaryKeywords.join('، ') || 'لا شيء'}`,
    `INTENT: ${brief.topic.intent}`,
  ].join('\n');
}

export function systemPrompt(settings: EngineSettings): string {
  return `${settings.systemPrompt}\n\nدليل الأسلوب:\n${settings.styleGuide}\n\nادعاءات ممنوعة:\n${settings.bannedClaims}`;
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
  return `${header(brief)}

ضع مخطط مقال عن الموضوع أعلاه لقسم "${brief.hub.name}" (${brief.hub.description}).
- من 4 إلى 7 عناوين H2 بصيغة أسئلة، ولكل عنوان جواب مباشر في جملة واحدة.
- العنوان الأول يجيب عن الكلمة المفتاحية نفسها.
- المقال يجيب عن هذه الأسئلة الثلاثة في مكان ما: ${brief.questions.join(' | ')}
- ثلاث نقاط "أهم النقاط" قصيرة.
- كلمة إنجليزية واحدة أو اثنتان للبحث عن صورة غلاف (مثلاً: printed t-shirt studio).

ورقة الحقائق:
${brief.facts.text}`;
}

export function draftPrompt(brief: Brief, outline: Outline, settings: EngineSettings): string {
  const headings = outline.headings
    .map((h, i) => `${i + 1}. ## ${h.question}\n   الجواب المباشر: ${h.answer}`)
    .join('\n');
  return `${header(brief)}

اكتب المقال كاملاً بصيغة Markdown، بين ${settings.minWords} و${settings.maxWords} كلمة، بهذا المخطط:
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
}

export function revisePrompt(
  brief: Brief,
  draft: string,
  critique: string,
  problems: string[],
): string {
  return `${header(brief)}
REVISION PASS

أعد كتابة المقال التالي مع إصلاح ما يلي فقط، وأبقِ الباقي كما هو:
- ملاحظات المراجع: ${critique}
${problems.map((p) => `- ${p}`).join('\n')}

المقال:
${draft}

ورقة الحقائق:
${brief.facts.text}`;
}

export const RubricSchema = z.object({
  facts: z.number().min(0).max(30),
  arabic: z.number().min(0).max(25),
  structure: z.number().min(0).max(20),
  usefulness: z.number().min(0).max(15),
  formatting: z.number().min(0).max(10),
  critique: z.string(),
});

export function reviewPrompt(brief: Brief, draft: string, revision: boolean): string {
  return `${header(brief)}${revision ? '\nREVISION PASS' : ''}

قيّم المقال التالي على 100 نقطة بهذا التوزيع، وأعطِ نقداً عملياً في ثلاث جمل:
- facts (30): كل رقم وكل وعد موجود في ورقة الحقائق؛ أي رقم غريب يخصم نقاطاً.
- arabic (25): فصحى مبسطة بلا عبارات ممنوعة (قم بـ، تم، يرجى، بنجاح، الخاص بك، هناك).
- structure (20): عناوين H2 أسئلة، كل عنوان يبدأ بجواب مباشر، مثال رقمي، روابط داخلية.
- usefulness (15): مفيد ومحدد لتاجر سعودي يبدأ اليوم.
- formatting (10): الطول، الفقرات القصيرة، القوائم حيث تفيد، لا جداول، لا عنوان H1.

المقال:
${draft}

ورقة الحقائق:
${brief.facts.text}`;
}

export function rubricTotal(r: Rubric): number {
  return Math.round(r.facts + r.arabic + r.structure + r.usefulness + r.formatting);
}

export const SeoSchema = z.object({
  title: z.string().min(10).max(70),
  description: z.string().min(40).max(160),
  slug: z.string().max(60),
  alt: z.string().min(5).max(200),
});

export function seoPrompt(brief: Brief, draft: string): string {
  return `${header(brief)}

من المقال التالي اقترح:
- title: عنوان للبحث حتى 60 حرفاً يحتوي الكلمة المفتاحية.
- description: وصف حتى 155 حرفاً.
- slug: معرّف لاتيني قصير بحروف صغيرة وشرطات (حتى 40 حرفاً) مترجم من الكلمة المفتاحية.
- alt: نص بديل عربي وصفي لصورة غلاف عن الموضوع (يصف الصورة لا الموضوع).

المقال:
${draft.slice(0, 2500)}`;
}
