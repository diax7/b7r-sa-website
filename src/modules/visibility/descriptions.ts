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
