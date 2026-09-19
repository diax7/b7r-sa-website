import type { Described } from '@/modules/cms/admin/descriptions/describe';

/** The off-site checklist: what counts for each box (ADR-046, ADR-049). */
export const CHECKLIST_DESCRIPTIONS: Described = {
  linkedinCompany: {
    ar: 'باسم بحر برنت، نبذتها الجملة التعريفية نفسها، وتنشر عرضاً للمنتج أسبوعياً. علّمها عند اكتمالها.',
    en: 'Named B7R Print, its About the tagline itself, posting a product demo a week. Tick it once it exists.',
  },
  linkedinFounder: {
    ar: 'يذكر بحر برنت ويربط الموقع: هو التوقيع الذي تحلّه محرّكات الإجابة إلى شخص. علّمه عند اكتماله.',
    en: 'Names B7R Print and links the site: the byline the answer engines resolve to a person. Tick it once it exists.',
  },
  youtube: {
    ar: 'شرح واحد على الأقل للمصمّم مع النص الكامل في الوصف. علّمها عند نشر الشرح.',
    en: 'At least one walkthrough of the designer, with the full transcript in its description. Tick it once the walkthrough is up.',
  },
  xProfile: {
    ar: 'نبذته الجملة التعريفية ومنشوره المثبّت يعرض المنتج. علّمه عند التثبيت.',
    en: 'Its bio the tagline, its pinned post showing the product. Tick it once pinned.',
  },
  firstMention: {
    ar: 'مقال ضيف أو بودكاست أو دليل يصف بحر برنت بكلماته ومع مصطلحات الفئة. علّمه عند النشر.',
    en: 'A guest post, a podcast or a directory describing B7R Print in its own words with the category terms. Tick it once published.',
  },
};

/** The nightly snapshots: what each column holds (ADR-049). Read-only. */
export const METRICS_DESCRIPTIONS: Described = {
  date: {
    ar: 'بتوقيت الرياض؛ صف لكل يوم ومصدر، وسحب ثانٍ في اليوم نفسه يستبدله.',
    en: 'In Riyadh time; one row per day and source, and a second pull the same day replaces it.',
  },
  source: {
    ar: 'Search Console أو Bing أو PageSpeed، أو «الدرجة» لدرجة الظهور ذلك اليوم.',
    en: 'Search Console, Bing or PageSpeed, or "Score" for that day’s visibility score.',
  },
  data: {
    ar: 'إجابة الخدمة كما جاءت: الأرقام الكلية وأعلى الاستعلامات والصفحات، أو درجات الأداء لكل صفحة، أو نسب الأقسام.',
    en: "The service's answer as it came: the totals and the top queries and pages, the performance scores per page, or the sections' percentages.",
  },
};

/** The buyer prompts: what each field does (ADR-049 D5). */
export const PROMPT_DESCRIPTIONS: Described = {
  text: {
    ar: 'كما يكتبه المشتري لمساعد ذكاء اصطناعي، بلا ذكر للعلامة إلا في سؤال مقارنة: «أفضل موقع طباعة تيشيرتات في السعودية؟». حتى 300 حرف.',
    en: 'As a buyer types it to an assistant, naming no brand unless it compares: "best t-shirt printing in Saudi Arabia?". Up to 300 characters.',
  },
  language: {
    ar: 'الدرجة تطلب خمسة أسئلة على الأقل لكل لغة.',
    en: 'The score asks for at least five questions per language.',
  },
  intent: {
    ar: 'ما يريده السائل: فئة (من يقدّم الخدمة)، مقارنة (بحر برنت مقابل غيره)، أو كيف (طريقة عمل شيء). للقراءة في السجل فقط.',
    en: 'What the asker wants: a category (who offers the service), a compare (B7R against others) or a how-to. Read in the ledger only.',
  },
  order: {
    ar: 'موضعه في الجولة والسجل؛ الأصغر أولاً. عندما تنفد دقائق الجولة العشرون تُترك الأسئلة الأخيرة إلى الجولة التالية.',
    en: "Its place in the run and the ledger; smallest first. When the run's twenty minutes run out, the last ones wait for the next run.",
  },
  everyDays: {
    ar: '7 كل أسبوع، 1 كل يوم، 30 كل شهر. مع البحث على الويب يكلّف السؤال نحو 0.02 دولار على OpenAI و0.01 على Gemini Flash و0.03 على Claude Haiku.',
    en: '7 weekly, 1 daily, 30 monthly. With web search an ask costs about $0.02 on OpenAI, $0.01 on Gemini Flash and $0.03 on Claude Haiku.',
  },
  namesBrand: {
    ar: 'يُسأل ويُسجَّل لكنه لا يدخل في نسبة الاستشهاد، لأن الإجابة ستذكر العلامة حتماً. سؤال يذكر «بحر برنت» أو b7r يُعامل كذلك وإن لم يُعلَّم.',
    en: 'Asked and recorded, but left out of the cited rate: the answer is bound to name the brand. A text naming b7r counts as such unticked.',
  },
  enabled: {
    ar: 'يُسأل في كل جولة ويُعدّ في الدرجة؛ وعند الإيقاف يبقى في القائمة بلا سؤال.',
    en: 'Asked in every run and counted in the score; off, it stays in the list unasked.',
  },
};

/** The citation rows: what each column holds (ADR-049 D5). Read-only. */
export const CITATION_DESCRIPTIONS: Described = {
  title: {
    ar: 'ليُقرأ الصف في القائمة ولوحة البحث: اليوم والاتصال.',
    en: 'So the row reads in the list and the palette: the day and the connection.',
  },
  promptText: {
    ar: 'كما طُرح وقتها، وإن عُدّل السؤال أو حُذف لاحقاً.',
    en: 'As it was asked at the time, whatever was edited or removed since.',
  },
  date: {
    ar: 'بتوقيت الرياض، يوم الجولة.',
    en: 'Of the run, in Riyadh time.',
  },
  provider: {
    ar: 'نوع الاتصال الذي أُجريت به الجولة (OpenAI، Anthropic، Google)، كما كان وقتها.',
    en: 'The kind of connection the run used (OpenAI, Anthropic, Google), as it was at the time.',
  },
  model: {
    ar: 'معرّفه كما كان وقتها.',
    en: 'As it was at the time.',
  },
  mode: {
    ar: '«مفعّل» عندما كان بحث الويب في الخدمة مفعّلاً للسؤال؛ «معطّل» للخدمات التي لا تقدّمه عبرنا.',
    en: '"On" when the service’s web search was on for the ask; "off" for services that offer none through us.',
  },
  mentioned: {
    ar: 'الإجابة ذكرت بحر برنت أو b7r بالاسم.',
    en: 'The answer named B7R (بحر برنت or b7r).',
  },
  linked: {
    ar: 'الإجابة استشهدت برابط إلى b7r.sa أو b7r.app.',
    en: 'The answer cited a link to b7r.sa or b7r.app.',
  },
  namesBrand: {
    ar: 'كان يذكر العلامة عند طرحه؛ مثل هذا الصف لا يدخل في نسبة الاستشهاد.',
    en: 'Named the brand when asked; such a row leaves the cited rate.',
  },
  excerpt: {
    ar: 'أول 400 حرف من الإجابة، للقائمة.',
    en: 'The first 400 characters of the answer, for the list.',
  },
  answer: {
    ar: 'كما أعطاها المساعد، بتنسيقها: العناوين والقوائم والروابط.',
    en: 'As the assistant gave it, with its formatting: headings, lists, links.',
  },
  urls: {
    ar: 'كل ما استشهدت به الإجابة، روابطنا وغيرها.',
    en: 'Every link the answer cited, ours and others.',
  },
  competitors: {
    ar: 'من قائمة الخطة، ممن ورد اسمهم أو رابطهم في الإجابة.',
    en: 'From the BRD’s list, whose name or link appeared in the answer.',
  },
  prompt: {
    ar: 'ما طُرح في هذه الجولة.',
    en: 'The one that was asked.',
  },
  connection: {
    ar: 'ما طُرح عبره؛ يُفرَّغ إن حُذف الاتصال.',
    en: 'What it went through; emptied when the connection is deleted.',
  },
  run: {
    ar: 'التي كتبت هذا الصف (في الجولات، النوع «سجل الاستشهادات»).',
    en: 'The one that wrote this row (under Runs, kind Citation ledger).',
  },
};
