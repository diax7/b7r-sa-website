import type { Described } from '@/modules/cms/admin/descriptions/describe';

const RATE_IN = {
  ar: 'سعر مليون رمز إدخال بالدولار من صفحة أسعار المزوّد؛ لتقدير تكلفة كل تشغيل وسقف التكلفة اليومي.',
  en: "The vendor's price per million input tokens in USD, from its pricing page; for the cost estimate of each run and the daily cap.",
};
const RATE_OUT = {
  ar: 'سعر مليون رمز إخراج بالدولار من صفحة أسعار المزوّد؛ لتقدير تكلفة كل تشغيل وسقف التكلفة اليومي.',
  en: "The vendor's price per million output tokens in USD, from its pricing page; for the cost estimate of each run and the daily cap.",
};
const MODEL = {
  ar: 'معرّف النموذج كما تكتبه وثائق المزوّد حرفياً: gpt-5.1، claude-sonnet-5.',
  en: 'The model id exactly as the vendor docs write it: gpt-5.1, claude-sonnet-5.',
};
const VENDOR = (name: { ar: string; en: string }) => ({
  ar: `مفتاح ${name.ar} والنموذج والأسعار؛ يُستخدم عندما يكون هو المزوّد الفعّال. المفتاح مشفّر ولا يُعرض بعد الحفظ.`,
  en: `${name.en}'s key, model and rates; used when it is the active provider. The key is encrypted and never shown again after saving.`,
});

/** Engine settings: what each field does (ADR-046). The Providers tab leaves with PR C. */
export const AI_SETTINGS_DESCRIPTIONS: Described = {
  'providers.openai': VENDOR({ ar: 'OpenAI', en: 'OpenAI' }),
  'providers.openai.model': MODEL,
  'providers.openai.inputPerMillionUsd': RATE_IN,
  'providers.openai.outputPerMillionUsd': RATE_OUT,
  'providers.deepseek': VENDOR({ ar: 'DeepSeek', en: 'DeepSeek' }),
  'providers.deepseek.model': MODEL,
  'providers.deepseek.inputPerMillionUsd': RATE_IN,
  'providers.deepseek.outputPerMillionUsd': RATE_OUT,
  'providers.anthropic': VENDOR({ ar: 'Anthropic', en: 'Anthropic' }),
  'providers.anthropic.model': MODEL,
  'providers.anthropic.inputPerMillionUsd': RATE_IN,
  'providers.anthropic.outputPerMillionUsd': RATE_OUT,
  'providers.google': VENDOR({ ar: 'Google', en: 'Google' }),
  'providers.google.model': MODEL,
  'providers.google.inputPerMillionUsd': RATE_IN,
  'providers.google.outputPerMillionUsd': RATE_OUT,
  publishHourRiyadh: {
    ar: 'الساعة بتوقيت الرياض (0 إلى 23) التي لا يبدأ المحرّك تشغيلاً مجدولاً قبلها في اليوم؛ «توليد الآن» لا يتقيّد بها.',
    en: 'The hour in Riyadh time (0 to 23) before which a scheduled run does not start that day; "Generate now" ignores it.',
  },
  maxPostsPerMonth: {
    ar: 'أقصى عدد مقالات ينشرها المحرّك في الشهر؛ بعده يتوقف حتى الشهر التالي.',
    en: 'The most posts the engine publishes in a month; then it waits for the next month.',
  },
  dailyCostCapUsd: {
    ar: 'أقصى إنفاق يومي بالدولار (تقديري من الأسعار أعلاه)؛ التشغيل يُرفض بعد بلوغه حتى الغد.',
    en: 'The most the engine may spend in a day, in USD (estimated from the rates above); a run is refused once reached, until tomorrow.',
  },
  'style.styleGuide': {
    ar: 'دليل الأسلوب الذي يقرؤه النموذج قبل كل مقال: النبرة، الجمهور، ما يُقال وما لا يُقال.',
    en: 'The style guide the model reads before every post: tone, audience, what to say and what not to.',
  },
  'style.systemPrompt': {
    ar: 'التعليمات الأساسية للنموذج في كل تشغيل. تغييرها يرفع رقم النسخة الذي تسجّله التشغيلات.',
    en: "The model's standing instructions for every run. Changing it bumps the version number the runs record.",
  },
  'style.bannedPhrases': {
    ar: 'عبارات لا تبدأ بها جملة في مقال، سطر لكل عبارة؛ كل واحدة تخسر 5 درجات في المراجعة الذاتية (حتى 25).',
    en: 'Phrases a sentence may not start with, one per line; each costs 5 points in the self-review (25 at most).',
  },
  'style.bannedClaims': {
    ar: 'ادعاءات لا يجوز أن يقدّمها المحرّك (شهادات، أرقام غير مثبتة)، سطر لكل ادعاء.',
    en: 'Claims the engine may never make (certifications, unproven numbers), one per line.',
  },
  'images.imageStyle': {
    ar: 'كلمات تُضاف إلى البحث عن صورة الغلاف من Pexels: «استوديو، خلفية بيضاء». فارغ يبحث بعنوان المقال فقط.',
    en: 'Words appended to the Pexels search for a cover: "studio, white background". Empty searches by the title alone.',
  },
  'quality.qualityThreshold': {
    ar: 'أقل درجة (0 إلى 100) تقبلها المراجعة الذاتية؛ الأدنى يُعاد كتابته أو يُرفض.',
    en: 'The lowest score (0 to 100) the self-review accepts; below it the post is rewritten or refused.',
  },
  'quality.maxRevisionPasses': {
    ar: 'كم مرة يُعاد كتابة المقال الذي لم يبلغ الدرجة قبل رفضه.',
    en: 'How many times a post below the threshold is rewritten before it is refused.',
  },
  'quality.minWords': {
    ar: 'أقل عدد كلمات للمقال؛ الأقصر يخسر 10 درجات في المراجعة الذاتية.',
    en: 'The fewest words a post should have; shorter loses 10 points in the self-review.',
  },
  'quality.maxWords': {
    ar: 'أكثر عدد كلمات للمقال؛ الأطول يخسر 10 درجات في المراجعة الذاتية.',
    en: 'The most words a post should have; longer loses 10 points in the self-review.',
  },
  'notifications.weeklyDigest': {
    ar: 'رسالة أسبوعية إلى بريد التنبيهات: ما نُشر، وما فشل، والتكلفة.',
    en: 'A weekly e-mail to the notification address: what was published, what failed, the cost.',
  },
  'notifications.failureAlerts': {
    ar: 'رسالة فورية إلى بريد التنبيهات عند فشل تشغيل.',
    en: 'An e-mail to the notification address as soon as a run fails.',
  },
};

/** Topics: the engine's backlog. */
export const AI_TOPICS_DESCRIPTIONS: Described = {
  title: {
    ar: 'عنوان العمل للموضوع؛ المحرّك يكتب العنوان النهائي بنفسه. لا يظهر في الموقع.',
    en: 'The working title of the topic; the engine writes the final title itself. Not shown on the site.',
  },
  hub: {
    ar: 'القسم الذي يُنشر المقال فيه عند كتابته.',
    en: 'The hub the post is filed under when it is written.',
  },
  intent: {
    ar: 'نوع القارئ المستهدف: معلوماتي (يتعلم)، تجاري (يقارن ليشتري)، موسمي (مناسبة بتاريخ).',
    en: 'Who the post is for: informational (learning), commercial (comparing to buy), seasonal (an occasion with a date).',
  },
  priority: {
    ar: 'الأولوية من 1 (الأهم) إلى 5؛ المحرّك يأخذ الأعلى أولوية من القائمة أولاً.',
    en: 'Priority 1 (highest) to 5; the engine takes the highest priority in the backlog first.',
  },
  primaryKeyword: {
    ar: 'العبارة التي يبحث بها الناس ويجب أن يستهدفها المقال: «تسعير تيشيرت مطبوع».',
    en: 'The phrase people search for that the post must target: "pricing a printed t-shirt".',
  },
  secondaryKeywords: {
    ar: 'عبارات بحث ثانوية يوردها المقال حيث تناسب.',
    en: 'Secondary search phrases the post works in where they fit.',
  },
  'secondaryKeywords.keyword': {
    ar: 'عبارة واحدة كما يكتبها الباحث.',
    en: 'One phrase as a searcher types it.',
  },
  windowStart: {
    ar: 'للمواضيع الموسمية: التاريخ الذي يبدأ المحرّك بعده كتابة الموضوع (نحو ستة أسابيع قبل المناسبة).',
    en: 'For seasonal topics: the date after which the engine may write it (about six weeks before the occasion).',
  },
  status: {
    ar: 'أين الموضوع في الدورة: في القائمة، مجدول، يُكتب الآن، منشور، فشل، مرفوض.',
    en: 'Where the topic is in the cycle: backlog, scheduled, generating, published, failed, rejected.',
  },
  source: {
    ar: 'من أين جاء الموضوع: القائمة الأولى، مُضاف يدوياً، أو من Search Console.',
    en: 'Where the topic came from: the seed list, added by hand, or Search Console.',
  },
  notes: {
    ar: 'ملاحظات للمحرّك قبل الكتابة: زاوية، مثال، ما يجب تجنّبه. لا تظهر في الموقع.',
    en: 'Notes for the engine before it writes: an angle, an example, what to avoid. Not shown on the site.',
  },
};
