import type { Described } from '@/modules/cms/admin/descriptions/describe';

/** The off-site checklist: what counts for each box (ADR-046, ADR-049). */
export const CHECKLIST_DESCRIPTIONS: Described = {
  linkedinCompany: {
    ar: 'صفحة شركة باسم بحر برنت، نبذتها هي الجملة التعريفية نفسها، وتنشر عرضاً للمنتج أسبوعياً. علّمها عند اكتمالها.',
    en: 'A company page named B7R Print whose About is the tagline itself, posting a product demo a week. Tick it once it exists.',
  },
  linkedinFounder: {
    ar: 'حساب المؤسس يذكر بحر برنت ويربط الموقع: هو التوقيع الذي تحلّه محرّكات الإجابة إلى شخص. علّمه عند اكتماله.',
    en: 'The founder’s profile names B7R Print and links the site: the byline the answer engines resolve to a person. Tick it once it exists.',
  },
  youtube: {
    ar: 'قناة فيها شرح واحد على الأقل للمصمّم مع النص الكامل في الوصف. علّمها عند نشر الشرح.',
    en: 'A channel with at least one walkthrough of the designer and the full transcript in its description. Tick it once the walkthrough is up.',
  },
  xProfile: {
    ar: 'حساب X نبذته الجملة التعريفية ومنشوره المثبّت يعرض المنتج. علّمه عند التثبيت.',
    en: 'An X profile whose bio is the tagline and whose pinned post shows the product. Tick it once pinned.',
  },
  firstMention: {
    ar: 'أول ذكر مستقل: مقال ضيف أو بودكاست أو دليل يصف بحر برنت بكلماته ومع مصطلحات الفئة. علّمه عند النشر.',
    en: 'A first independent mention: a guest post, a podcast or a directory describing B7R Print in its own words with the category terms. Tick it once published.',
  },
};

/** The nightly snapshots: what each column holds (ADR-049). Read-only. */
export const METRICS_DESCRIPTIONS: Described = {
  date: {
    ar: 'اليوم بتوقيت الرياض الذي أُخذت فيه اللقطة؛ صف واحد لكل يوم ومصدر، وسحب ثانٍ في اليوم نفسه يستبدله.',
    en: 'The day in Riyadh time the snapshot was taken; one row per day and source, and a second pull the same day replaces it.',
  },
  source: {
    ar: 'الخدمة التي أُخذت منها: Search Console أو Bing أو PageSpeed، أو «الدرجة» لدرجة الظهور ذلك اليوم.',
    en: 'The service it came from: Search Console, Bing or PageSpeed, or "Score" for that day’s visibility score.',
  },
  data: {
    ar: 'جواب الخدمة كما جاء: الأرقام الكلية وأعلى الاستعلامات والصفحات، أو درجات الأداء لكل صفحة، أو درجات الأقسام.',
    en: "The service's answer as it came: the totals and the top queries and pages, the performance scores per page, or the sections' percentages.",
  },
};

/** The buyer prompts: what each field does (ADR-049 D5). */
export const PROMPT_DESCRIPTIONS: Described = {
  text: {
    ar: 'السؤال كما يكتبه المشتري لمساعد ذكاء اصطناعي، بلا ذكر للعلامة إلا إن كان سؤال مقارنة: «أفضل موقع طباعة تيشيرتات في السعودية؟». حتى 300 حرف.',
    en: 'The question as a buyer types it to an AI assistant, naming no brand unless it compares: "best site to print t-shirts in Saudi Arabia?". Up to 300 characters.',
  },
  language: {
    ar: 'لغة السؤال؛ الدرجة تطلب خمسة أسئلة على الأقل لكل لغة.',
    en: 'The language the prompt is in; the score asks for at least five per language.',
  },
  intent: {
    ar: 'ما يريده السائل: فئة (من يقدّم الخدمة)، مقارنة (بحر برنت مقابل غيره)، أو كيف (طريقة عمل شيء). للقراءة في السجل فقط.',
    en: 'What the asker wants: a category (who offers the service), a compare (B7R against others) or a how-to. Read in the ledger only.',
  },
  order: {
    ar: 'ترتيب السؤال في الجولة والجدول؛ الأصغر أولاً. عندما تنفد ميزانية الجولة (عشرون دقيقة) تُترك الأسئلة الأخيرة.',
    en: 'The prompt’s place in the run and the table; smallest first. When the run’s twenty-minute budget runs out, the last prompts are left for next week.',
  },
  namesBrand: {
    ar: 'السؤال نفسه يذكر بحر برنت (سؤال مقارنة): يُسأل ويُسجَّل، لكنه لا يدخل في نسبة الاستشهاد، لأن الجواب سيذكر العلامة حتماً. النص يقرّر أيضاً: سؤال يذكر «بحر برنت» أو b7r يُعامل كذلك وإن لم يُعلَّم.',
    en: 'The prompt itself names B7R (a compare prompt): asked and recorded, but left out of the cited-rate, since the answer is bound to name the brand. The text decides too: a prompt naming «بحر برنت» or b7r counts as such even unticked.',
  },
  enabled: {
    ar: 'مفعّل: يُسأل في كل جولة أسبوعية ويُعدّ في الدرجة. معطّل: يبقى في القائمة ولا يُسأل.',
    en: 'On: asked in every weekly run and counted in the score. Off: kept in the list, not asked.',
  },
};

/** The citation rows: what each column holds (ADR-049 D5). Read-only. */
export const CITATION_DESCRIPTIONS: Described = {
  title: {
    ar: 'اليوم والاتصال، ليُقرأ الصف في القائمة ولوحة البحث.',
    en: 'The day and the connection, so the row reads in the list and the palette.',
  },
  promptText: {
    ar: 'نص السؤال كما طُرح وقتها، وإن عُدّل السؤال أو حُذف لاحقاً.',
    en: 'The prompt as it was asked at the time, whatever was edited or removed since.',
  },
  date: {
    ar: 'يوم الجولة بتوقيت الرياض.',
    en: 'The day of the run, Riyadh time.',
  },
  provider: {
    ar: 'نوع الاتصال الذي أُجريت به الجولة (OpenAI، Anthropic، Google…)، كما كان وقتها.',
    en: 'The kind of connection the run used (OpenAI, Anthropic, Google…), as it was at the time.',
  },
  model: {
    ar: 'معرّف النموذج كما كان وقتها.',
    en: 'The model id at the time.',
  },
  mode: {
    ar: '«مع البحث» عندما كان بحث الويب الخاص بالمزوّد مفعّلاً في السؤال؛ «بلا بحث» للمزوّدين الذين لا يقدّمونه عبرنا.',
    en: '"With search" when the vendor’s web search was on for the ask; "plain" for vendors that offer none through us.',
  },
  mentioned: {
    ar: 'الجواب ذكر بحر برنت أو b7r بالاسم.',
    en: 'The answer named B7R (بحر برنت or b7r).',
  },
  linked: {
    ar: 'الجواب استشهد برابط إلى b7r.sa أو b7r.app.',
    en: 'The answer cited a link to b7r.sa or b7r.app.',
  },
  namesBrand: {
    ar: 'السؤال نفسه كان يذكر العلامة عند طرحه؛ مثل هذا الصف لا يدخل في نسبة الاستشهاد.',
    en: 'The prompt itself named the brand when asked; such a row leaves the cited-rate.',
  },
  excerpt: {
    ar: 'أول 400 حرف من الجواب.',
    en: 'The first 400 characters of the answer.',
  },
  urls: {
    ar: 'كل الروابط التي استشهد بها الجواب، روابطنا وغيرها.',
    en: 'Every link the answer cited, ours and others.',
  },
  competitors: {
    ar: 'المنافسون (من قائمة الخطة) الذين ورد اسمهم أو رابطهم في الجواب.',
    en: 'The competitors (from the BRD’s list) whose name or link appeared in the answer.',
  },
  prompt: {
    ar: 'السؤال الذي طُرح.',
    en: 'The prompt that was asked.',
  },
  connection: {
    ar: 'الاتصال الذي طُرح عبره؛ يُفرَّغ إن حُذف الاتصال.',
    en: 'The connection it went through; emptied when the connection is deleted.',
  },
  run: {
    ar: 'جولة السجل التي كتبت هذا الصف (في سجل المحرّك، النوع citation).',
    en: 'The ledger run that wrote this row (in the engine’s runs, kind citation).',
  },
};
