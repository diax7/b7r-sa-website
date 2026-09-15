import type { Described } from '@/modules/cms/admin/descriptions/describe';

/** Posts. */
export const POST_DESCRIPTIONS: Described = {
  slug: {
    ar: 'الجزء الأخير من رابط المقال: b7r.sa/blog/how-to-price. حروف لاتينية صغيرة وشرطات؛ تغييره بعد النشر يكسر الروابط القديمة.',
    en: 'The last part of the post address: b7r.sa/blog/how-to-price. Lowercase letters and hyphens; changing it after publishing breaks old links.',
  },
  title: {
    ar: 'عنوان المقال: H1 في صفحته، واسمه في بطاقات المدونة، وفي الخلاصة وملف llms.txt. حتى 70 حرفاً.',
    en: "The post's title: the H1 on its page, its name on the blog cards, in the feed and llms.txt. Up to 70 characters.",
  },
  hub: {
    ar: 'القسم الذي ينتمي إليه المقال: صفحة القسم تعرضه، وسطر القسم يظهر فوق العنوان.',
    en: "The hub the post belongs to: the hub's page lists it, and the hub line shows above the title.",
  },
  tags: {
    ar: 'وسوم لترتيب المقالات داخل لوحة التحكم (التصفية في القائمة). لا تظهر في الموقع؛ المقالات المرتبطة تُختار بالقسم.',
    en: 'Tags for sorting posts inside the admin (the list filters by them). Not shown on the site; related posts are chosen by hub.',
  },
  takeaways: {
    ar: 'صندوق «أهم النقاط» فوق المتن: ثلاث جمل قصيرة يقرؤها المتصفّح المستعجل ومحركات الإجابة.',
    en: 'The "key takeaways" box above the body: three short sentences for the reader in a hurry and for answer engines.',
  },
  'takeaways.text': {
    ar: 'نقطة واحدة: جملة كاملة، بلا نقطة في آخرها.',
    en: 'One takeaway: a full sentence, no full stop at the end.',
  },
  author: {
    ar: 'الكاتب في سطر التوقيع تحت العنوان وفي بيانات البحث؛ يفتح صفحة الكاتب.',
    en: "The author in the byline under the title and in the search data; opens the author's page.",
  },
  'seo.title': {
    ar: 'عنوان نتيجة البحث وتبويب المتصفح. فارغ يستخدم عنوان المقال. حتى 70 حرفاً.',
    en: "The search result's title and the browser tab. Empty uses the post's title. Up to 70 characters.",
  },
  'seo.description': {
    ar: 'الوصف تحت العنوان في نتيجة البحث. فارغ يستخدم المقتطف. حتى 160 حرفاً.',
    en: 'The description under the title in the search result. Empty uses the excerpt. Up to 160 characters.',
  },
  'seo.ogImage': {
    ar: 'صورة المشاركة في واتساب وX. فارغة تستخدم الغلاف.',
    en: 'The image shown when the link is shared on WhatsApp and X. Empty uses the cover.',
  },
};

/** Hubs (categories). */
export const CATEGORY_DESCRIPTIONS: Described = {
  slug: {
    ar: 'الجزء الأخير من رابط صفحة القسم: b7r.sa/blog/category/pricing. حروف لاتينية صغيرة وشرطات.',
    en: 'The last part of the hub page address: b7r.sa/blog/category/pricing. Lowercase letters and hyphens.',
  },
  name: {
    ar: 'اسم القسم: عنوان صفحته في المدونة، وسطر القسم فوق عنوان كل مقال فيه.',
    en: "The hub's name: its page title on the blog, and the hub line above each post's title.",
  },
  lead: {
    ar: 'سطر تحت اسم القسم في صفحته. فارغ يخفي السطر.',
    en: "A line under the hub's name on its page. Empty hides the line.",
  },
  order: {
    ar: 'ترتيب القسم في قائمة الأقسام بالمدونة: 1 أولاً.',
    en: "Where the hub sits in the blog's hub list: 1 first.",
  },
};

/** Authors. */
export const AUTHOR_DESCRIPTIONS: Described = {
  slug: {
    ar: 'الجزء الأخير من رابط صفحة الكاتب: b7r.sa/author/dhia. حروف لاتينية صغيرة وشرطات.',
    en: 'The last part of the author page address: b7r.sa/author/dhia. Lowercase letters and hyphens.',
  },
  role: {
    ar: 'صفة الكاتب تحت اسمه في التوقيع وفي صفحته: «مؤسس بحر برنت».',
    en: 'The role under the author name in the byline and on their page: "Founder of B7R Print".',
  },
  name: {
    ar: 'اسم الكاتب في سطر التوقيع تحت عنوان المقال وفي صفحته.',
    en: "The author's name in the byline under a post's title and on their page.",
  },
  bio: {
    ar: 'نبذة الكاتب في صفحته وفي بيانات البحث. جملتان إلى ثلاث. فارغة تخفي الفقرة.',
    en: "The author's bio on their page and in the search data. Two or three sentences. Empty hides the paragraph.",
  },
  photo: {
    ar: 'صورة الكاتب الدائرية في صفحته وبجانب التوقيع. فارغة تعرض الحرف الأول.',
    en: "The author's round photo on their page and beside the byline. Empty shows the initial.",
  },
  'sameAs.url': {
    ar: 'رابط حساب رسمي للكاتب (LinkedIn، X): يربط الاسم بالشخص في بيانات البحث. لا يظهر للزائر.',
    en: 'An official profile of the author (LinkedIn, X): ties the name to the person in the search data. Not shown to a visitor.',
  },
};

/** Tags: an admin-side grouping of posts; nothing on the site reads them today. */
export const TAG_DESCRIPTIONS: Described = {
  name: {
    ar: 'اسم الوسم كما يظهر في قائمة المقالات ومرشّحاتها داخل لوحة التحكم. لا يظهر في الموقع.',
    en: "The tag's name in the posts list and its filters inside the admin. Not shown on the site.",
  },
  slug: {
    ar: 'معرّف الوسم: حروف لاتينية صغيرة وشرطات. لا يظهر في الموقع.',
    en: "The tag's id: lowercase letters and hyphens. Not shown on the site.",
  },
};
