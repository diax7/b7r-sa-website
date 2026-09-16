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
