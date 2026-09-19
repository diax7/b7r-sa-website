import type { Described } from '@/modules/cms/admin/descriptions/describe';

/** Engine settings: what each field does (ADR-046, ADR-047). */
export const AI_SETTINGS_DESCRIPTIONS: Described = {
  connection: {
    ar: 'يكتب به المحرّك؛ مفتاحه ونموذجه وأسعاره وحدّه الشهري في الاتصالات. بلا اتصال، أو باتصال معطّل، تُرفض كل جولة.',
    en: 'The engine writes with it; its key, model, rates and monthly limit live under Connections. None, or one that is off, refuses every run.',
  },
  enabled: {
    ar: 'لا تبدأ أي جولة جديدة خلال ساعة من الإيقاف.',
    en: 'Off: no new run starts within the hour.',
  },
  postsPerDay: {
    ar: 'المدى الذي تدعمه الدراسات: 8 إلى 16 مقالاً شهرياً؛ الجودة قبل الكمية.',
    en: 'The research-backed range is 8 to 16 posts a month; quality before quantity.',
  },
  publishHourRiyadh: {
    ar: 'لا تبدأ جولة مجدولة قبل هذه الساعة من اليوم (0 إلى 23)؛ و«ولّد الآن» لا يتقيّد بها.',
    en: 'A scheduled run does not start before this hour of the day (0 to 23); "Generate now" ignores it.',
  },
  maxPostsPerMonth: {
    ar: 'يتوقف المحرّك عند بلوغه حتى الشهر التالي.',
    en: 'Reached, the engine waits for the next month.',
  },
  dailyCostCapUsd: {
    ar: 'تقديري من أسعار الاتصال؛ عند بلوغه تُرفض الجولة حتى الغد. الحد الشهري على الاتصال نفسه.',
    en: "Estimated from the connection's rates; reached, a run is refused until tomorrow. The monthly limit sits on the connection.",
  },
  reviewFirstRuns: {
    ar: 'ما دام فوق الصفر تُحفظ مقالات الخدمة الحية مسودات لتقرأها؛ ضعه صفراً عندما تطمئن.',
    en: 'While above zero, the posts of a live service land as drafts for your read; set 0 once they read well.',
  },
  'style.styleGuide': {
    ar: 'يقرؤه النموذج قبل كل مقال: النبرة، والجمهور، وما يُقال وما لا يُقال.',
    en: 'Read by the model before every post: tone, audience, what to say and what not to.',
  },
  'style.systemPrompt': {
    ar: 'ما يلتزم به النموذج في كل جولة. تغييره يرفع رقم النسخة الذي تسجّله الجولات.',
    en: "The model's standing instructions for every run. A change bumps the version the runs record.",
  },
  'style.bannedPhrases': {
    ar: 'لا تبدأ بها جملة في المقال؛ كل واحدة تخسر 5 درجات في المراجعة الذاتية (حتى 25).',
    en: 'A sentence may not start with any of them; each costs 5 points in the self-review (25 at most).',
  },
  'style.bannedClaims': {
    ar: 'ما لا يجوز للمحرّك قوله (شهادات، أرقام غير مثبتة)، سطر لكل ادعاء.',
    en: 'What the engine may never say (certifications, unproven numbers), one per line.',
  },
  'images.imageMode': {
    ar: 'التوليد يُرفض حتى تُربط خدمة صور؛ Pexels يحتاج مفتاحاً.',
    en: 'Generation is refused until an image service is wired; Pexels needs a key.',
  },
  'images.imageStyle': {
    ar: 'تُضاف إلى بحث Pexels عن غلاف: «استوديو، خلفية بيضاء». فارغ يبحث بعنوان المقال فقط.',
    en: 'Appended to the Pexels search for a cover: "studio, white background". Empty searches by the title alone.',
  },
  'images.pexelsKey': {
    ar: 'لبحث الغلاف عندما يكون المصدر «صورة من Pexels». لا يُعرض ثانية؛ اترك القناع للإبقاء عليه، أو امسحه لإزالته.',
    en: 'For the cover search when the source is "A stock photo (Pexels)". Never shown again; leave the mask to keep it, clear it to remove it.',
  },
  'quality.qualityThreshold': {
    ar: 'أقل درجة تقبلها المراجعة الذاتية؛ الأدنى منها يُعاد كتابته أو يُرفض.',
    en: 'The lowest self-review score accepted; below it the post is rewritten or refused.',
  },
  'quality.maxRevisionPasses': {
    ar: 'كم مرة يُعاد كتابة المقال الذي لم يبلغ الحد قبل رفضه.',
    en: 'How many times a post below the threshold is rewritten before it is refused.',
  },
  'quality.minWords': {
    ar: 'الأقصر منه يخسر 10 درجات في المراجعة الذاتية.',
    en: 'Shorter loses 10 points in the self-review.',
  },
  'quality.maxWords': {
    ar: 'الأطول منه يخسر 10 درجات في المراجعة الذاتية.',
    en: 'Longer loses 10 points in the self-review.',
  },
  'notifications.notifyEmail': {
    ar: 'يستقبل تنبيهات الفشل والملخص الأسبوعي.',
    en: 'Receives the failure alerts and the weekly digest.',
  },
  'notifications.weeklyDigest': {
    ar: 'رسالة كل أسبوع إلى البريد أعلاه: ما نُشر، وما فشل، والتكلفة.',
    en: 'One e-mail a week to the address above: what was published, what failed, the cost.',
  },
  'notifications.failureAlerts': {
    ar: 'رسالة إلى البريد أعلاه فور فشل جولة.',
    en: 'An e-mail to the address above as soon as a run fails.',
  },
};

/** Runs: what each column of a log row holds (ADR-042, ADR-047). Read-only. */
export const AI_RUNS_DESCRIPTIONS: Described = {
  label: {
    ar: 'ما فعلته الجولة في سطر: نوعها والموضوع، كما تعرضه القائمة ولوحة التحكم.',
    en: 'What the run did, in a line: its kind and the topic, as the list and the dashboard show it.',
  },
  kind: {
    ar: 'مقال جديد، أو مقال قائم حُدّث عند تغيّر الحقائق، أو جولة صباحية لسجل الاستشهادات.',
    en: 'A new post, an existing post refreshed when the facts changed, or a morning run of the citation ledger.',
  },
  status: {
    ar: 'تعمل، أو اكتملت، أو فشلت (السبب تحت «الخطأ»)، أو تُخطّيت قبل البداية (حد أو مفتاح).',
    en: 'Running, done, failed (the reason is under Error), or skipped before it started (a limit or the switch).',
  },
  provider: {
    ar: 'كما كانت وقتها: OpenAI، Anthropic، Google.',
    en: 'As it was at the time: OpenAI, Anthropic, Google.',
  },
  model: {
    ar: 'كما كان وقتها: gpt-4.1-mini.',
    en: 'As it was at the time: gpt-4.1-mini.',
  },
  score: {
    ar: 'من 100 في المراجعة الذاتية؛ يُنشر المقال عند بلوغ حد الجودة في إعدادات المحرّك.',
    en: 'Out of 100 in the self-review; the post publishes at the quality threshold of the engine settings.',
  },
  tokensIn: {
    ar: 'ما قرأه النموذج في الجولة كلها؛ ومنه تُقدَّر التكلفة.',
    en: 'What the model read over the whole run; the cost estimate starts here.',
  },
  tokensOut: {
    ar: 'ما كتبه النموذج في الجولة كلها؛ ومنه تُقدَّر التكلفة.',
    en: 'What the model wrote over the whole run; the cost estimate starts here.',
  },
  costUsd: {
    ar: 'من الرموز وأسعار الاتصال؛ تُحسب في الحد اليومي والحد الشهري للاتصال.',
    en: "From the tokens and the connection's rates; counted against the daily limit and the connection's monthly limit.",
  },
  durationMs: {
    ar: 'من البداية إلى النهاية بالمللي ثانية (1000 = ثانية واحدة).',
    en: 'From start to finish, in milliseconds (1000 is one second).',
  },
  systemPromptVersion: {
    ar: 'التعليمات الأساسية التي كُتب بها المقال؛ ترتفع كلما تغيّرت في إعدادات المحرّك.',
    en: 'The system prompt the post was written with; it rises whenever the prompt changes in the engine settings.',
  },
  connection: {
    ar: 'ما حُسبت عليه التكلفة؛ يُفرَّغ إن حُذف الاتصال.',
    en: 'The one the cost counted against; emptied when it is deleted.',
  },
  topic: {
    ar: 'ما كتبت عنه الجولة.',
    en: 'What the run wrote about.',
  },
  post: {
    ar: 'ما أنتجته الجولة، مسودة أو منشوراً.',
    en: 'What the run produced, as a draft or published.',
  },
  error: {
    ar: 'سبب الفشل أو التخطّي كما سجّله المحرّك، بلا مفاتيح ولا روابط.',
    en: 'Why the run failed or was skipped, as the engine recorded it, keys and links removed.',
  },
  startedAt: {
    ar: 'اللحظة التي بدأت فيها الجولة.',
    en: 'When the run started.',
  },
  finishedAt: {
    ar: 'اللحظة التي انتهت فيها الجولة؛ فارغ ما دامت تعمل.',
    en: 'When the run finished; empty while it is still running.',
  },
  rubric: {
    ar: 'درجة المراجعة الذاتية معياراً معياراً: ما خسره المقال في كل واحد.',
    en: 'The self-review score, criterion by criterion: what the post lost on each.',
  },
  steps: {
    ar: 'بترتيبها مع وقت كل خطوة ونتيجتها: المخطط، الكتابة، المراجعة، الغلاف، النشر.',
    en: 'In order, each with its time and outcome: outline, draft, review, cover, publish.',
  },
  outline: {
    ar: 'ما كُتب منه المقال؛ والتحديث الآلي يعيد التوليد منه عند تغيّر الحقائق.',
    en: 'What the post was written from; the freshness job regenerates from it when the facts change.',
  },
};

/** Topics: the engine's backlog. */
export const AI_TOPICS_DESCRIPTIONS: Described = {
  title: {
    ar: 'للمحرّك فقط؛ يكتب العنوان النهائي بنفسه. لا يظهر في الموقع.',
    en: 'For the engine only; it writes the final title itself. Not shown on the site.',
  },
  language: {
    ar: 'يُنشر المقال على المدونة العربية أو الإنجليزية.',
    en: 'The post lands on the Arabic or the English blog.',
  },
  hub: {
    ar: 'يُنشر المقال فيه عند كتابته.',
    en: 'Where the post is filed when it is written.',
  },
  intent: {
    ar: 'لمن المقال: معلوماتي (يتعلم)، تجاري (يقارن ليشتري)، موسمي (مناسبة بتاريخ).',
    en: 'Who the post is for: informational (learning), commercial (comparing to buy), seasonal (an occasion with a date).',
  },
  priority: {
    ar: 'يأخذ المحرّك الأعلى أولاً: 1 هو الأعلى.',
    en: 'The engine takes the highest first: 1 is the highest.',
  },
  primaryKeyword: {
    ar: 'ما يبحث به الناس ويجب أن يستهدفه المقال: «تسعير تيشيرت مطبوع».',
    en: 'What people search for and the post must target: "pricing a printed t-shirt".',
  },
  secondaryKeywords: {
    ar: 'يوردها المقال حيث تناسب.',
    en: 'Worked into the post where they fit.',
  },
  'secondaryKeywords.keyword': {
    ar: 'عبارة واحدة كما يكتبها الباحث.',
    en: 'One phrase as a searcher types it.',
  },
  windowStart: {
    ar: 'للمواضيع الموسمية: يكتبه المحرّك بعد هذا التاريخ (نحو ستة أسابيع قبل المناسبة).',
    en: 'For seasonal topics: the engine may write it after this date (about six weeks before the occasion).',
  },
  windowEnd: {
    ar: 'الموسمي يُنشر داخل النافذة فقط؛ اتركهما فارغين لموضوع دائم.',
    en: 'Seasonal topics publish inside the window only; leave both empty for an evergreen topic.',
  },
  notes: {
    ar: 'للمحرّك قبل الكتابة: زاوية، مثال، ما يجب تجنّبه. لا تظهر في الموقع.',
    en: 'For the engine before it writes: an angle, an example, what to avoid. Not shown on the site.',
  },
  status: {
    ar: 'الموضوع في القائمة، أو مجدول، أو يُكتب الآن، أو منشور، أو فشل، أو مرفوض.',
    en: 'In the backlog, scheduled, being written, published, failed or rejected.',
  },
  source: {
    ar: 'القائمة الأولى، أو مُضاف يدوياً، أو من Search Console.',
    en: 'The seed list, added by hand, or Search Console.',
  },
  post: {
    ar: 'ما كتبه المحرّك عن هذا الموضوع؛ يفتح المقال.',
    en: 'What the engine wrote for this topic; opens the post.',
  },
  lastRun: {
    ar: 'التي عملت على هذا الموضوع أخيراً: خطواتها ودرجتها وتكلفتها.',
    en: 'The one that last worked on this topic: its steps, score and cost.',
  },
  lastError: {
    ar: 'سبب فشل آخر جولة كما سجّله المحرّك؛ يُمحى عندما تنجح جولة.',
    en: 'Why the last run failed, as the engine recorded it; cleared when a run succeeds.',
  },
};
