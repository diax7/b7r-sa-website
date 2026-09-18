import type { Described } from '@/modules/cms/admin/descriptions/describe';

/** Engine settings: what each field does (ADR-046, ADR-047). */
export const AI_SETTINGS_DESCRIPTIONS: Described = {
  connection: {
    ar: 'الاتصال الذي يكتب به المحرّك: مفتاحه ونموذجه وأسعاره وحدّه الشهري في صفحة الاتصالات. بلا اتصال، أو باتصال موقوف، يرفض المحرّك كل تشغيل ويقول ذلك في لوحة التحكم.',
    en: 'The connection the engine writes with: its key, model, rates and monthly limit live on the Connections page. With none, or with an off one, the engine refuses every run and says so on the dashboard.',
  },
  publishHourRiyadh: {
    ar: 'الساعة بتوقيت الرياض (0 إلى 23) التي لا يبدأ المحرّك تشغيلاً مجدولاً قبلها في اليوم؛ «توليد الآن» لا يتقيّد بها.',
    en: 'The hour in Riyadh time (0 to 23) before which a scheduled run does not start that day; "Generate now" ignores it.',
  },
  maxPostsPerMonth: {
    ar: 'أقصى عدد مقالات ينشرها المحرّك في الشهر؛ بعده يتوقف حتى الشهر التالي.',
    en: 'The most posts the engine publishes in a month; then it waits for the next month.',
  },
  dailyCostCapUsd: {
    ar: 'أقصى إنفاق يومي بالدولار (تقديري من أسعار الاتصال)؛ التشغيل يُرفض بعد بلوغه حتى الغد. الحدّ الشهري على صفحة الاتصال نفسه.',
    en: "The most the engine may spend in a day, in USD (estimated from the connection's rates); a run is refused once reached, until tomorrow. The monthly limit sits on the connection itself.",
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
  'images.pexelsKey': {
    ar: 'مفتاح Pexels لبحث صور الغلاف عندما يكون مصدر الغلاف «صورة من Pexels». يُحفظ مشفّراً ولا يُعرض مرة أخرى؛ اتركه كما هو للإبقاء عليه، أو امسحه لإزالته.',
    en: 'The Pexels key for the cover search when the cover source is "A stock photo (Pexels)". Stored encrypted and never shown again; leave the mask to keep it, clear it to remove it.',
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

/** Runs: what each column of a log row holds (ADR-042, ADR-047). Read-only. */
export const AI_RUNS_DESCRIPTIONS: Described = {
  rubric: {
    ar: 'تفصيل درجة المراجعة الذاتية: كل معيار وما خسره المقال فيه.',
    en: 'The self-review score, criterion by criterion: what the post lost on each.',
  },
  steps: {
    ar: 'خطوات الجولة بترتيبها مع وقت كل خطوة ونتيجتها: المخطط، الكتابة، المراجعة، الصورة، النشر.',
    en: 'The steps of the run in order, each with its time and outcome: outline, draft, review, cover, publish.',
  },
  outline: {
    ar: 'مخطط المقال الذي كُتب منه؛ التحديث الآلي يعيد التوليد منه عند تغيّر الحقائق.',
    en: 'The outline the post was written from; the freshness job regenerates from it when the facts change.',
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
    en: 'Where the topic is in the cycle: in the backlog, scheduled, being written, published, failed, rejected.',
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
