import type { Described } from '@/modules/cms/admin/descriptions/describe';

/** Posts. */
export const POST_DESCRIPTIONS: Described = {
  title: {
    ar: 'H1 في صفحته، واسمه في بطاقات المدونة والخلاصة وملف llms.txt.',
    en: 'The H1 on its page, its name on the blog cards, in the feed and llms.txt.',
  },
  slug: {
    ar: 'آخر رابط المقال: b7r.sa/blog/how-to-price. حروف لاتينية صغيرة وشرطات؛ تغييره بعد النشر يكسر الروابط القديمة.',
    en: 'The end of the post address: b7r.sa/blog/how-to-price. Lowercase letters and hyphens; a change after publishing breaks old links.',
  },
  body: {
    ar: 'عناوين H2 بصيغة أسئلة، فقرات قصيرة، رابطان على الأقل إلى صفحات الموقع.',
    en: 'H2s as questions, short paragraphs, at least two links to pages of this site.',
  },
  excerpt: {
    ar: 'جملة أو جملتان في بطاقة المقال ونتائج البحث.',
    en: 'One or two sentences on the post card and in search results.',
  },
  hub: {
    ar: 'صفحته تعرض المقال، واسمه يظهر فوق عنوان المقال.',
    en: 'Its page lists the post, and its name shows above the post title.',
  },
  tags: {
    ar: 'لترتيب المقالات داخل اللوحة (التصفية في القائمة). لا تظهر في الموقع؛ المقالات المرتبطة تُختار بالقسم.',
    en: 'Sort posts inside the panel (the list filters by them). Not shown on the site; related posts are chosen by hub.',
  },
  cover: {
    ar: 'في بطاقة المقال وأعلى المقال وبطاقة المشاركة؛ تُختار من المكتبة مع نصها البديل العربي.',
    en: 'On the post card, at the top of the post and on the share card; picked from the library with its Arabic alt text.',
  },
  takeaways: {
    ar: 'صندوق فوق المتن: ثلاث جمل قصيرة للقارئ المستعجل ولمحرّكات الإجابة.',
    en: 'The box above the body: three short sentences for the reader in a hurry and for answer engines.',
  },
  'takeaways.text': {
    ar: 'جملة كاملة واحدة، بلا نقطة في آخرها.',
    en: 'One full sentence, no full stop at the end.',
  },
  seo: {
    ar: 'اختياري: يُستخدم العنوان والمقتطف عند تركها فارغة.',
    en: 'Optional: the title and the excerpt are used when left empty.',
  },
  'seo.title': {
    ar: 'في نتيجة البحث وتبويب المتصفح. فارغ يستخدم عنوان المقال.',
    en: "In the search result and the browser tab. Empty uses the post's title.",
  },
  'seo.description': {
    ar: 'تحت العنوان في نتيجة البحث. فارغ يستخدم المقتطف.',
    en: 'Under the title in the search result. Empty uses the excerpt.',
  },
  'seo.ogImage': {
    ar: 'تظهر عند مشاركة الرابط في WhatsApp وX. فارغة تستخدم الغلاف.',
    en: 'Shown when the link is shared on WhatsApp and X. Empty uses the cover.',
  },
  author: {
    ar: 'في سطر التوقيع تحت العنوان وفي بيانات البحث؛ يفتح صفحة الكاتب.',
    en: "In the byline under the title and in the search data; opens the author's page.",
  },
  publishedAt: {
    ar: 'يُملأ عند أول نشر إن تُرك فارغاً؛ وهو ما يعرضه المقال.',
    en: 'The date the post shows; filled on the first publish when left empty.',
  },
  contentUpdatedAt: {
    ar: 'يُعرض على المقال عندما يتغيّر محتواه فعلاً.',
    en: 'Shown on the post when its content really changed.',
  },
  origin: {
    ar: 'تعديل محرّر على مقال المحرّك يجعله «آلي ثم عُدّل» ويستثنيه من التحديث الآلي.',
    en: 'A change by an editor to an engine post marks it "engine, then edited" and exempts it from the freshness job.',
  },
};

/** Hubs (categories). */
export const CATEGORY_DESCRIPTIONS: Described = {
  name: {
    ar: 'عنوان صفحته في المدونة، والسطر فوق عنوان كل مقال فيه.',
    en: 'The page title on the blog, and the line above each post title in it.',
  },
  slug: {
    ar: 'آخر رابط صفحة القسم: b7r.sa/blog/category/pricing. حروف لاتينية صغيرة وشرطات.',
    en: 'The end of the hub page address: b7r.sa/blog/category/pricing. Lowercase letters and hyphens.',
  },
  description: {
    ar: 'جملة واحدة تحت عنوان القسم وفي بطاقات المدونة.',
    en: 'One sentence under the hub title and on the blog cards.',
  },
  lead: {
    ar: 'تحت اسم القسم في صفحته. فارغ يخفي السطر.',
    en: "Under the hub's name on its page. Empty hides the line.",
  },
  defaultCover: {
    ar: 'يُستخدم عندما لا يملك المقال غلافاً خاصاً.',
    en: 'Used when a post has no cover of its own.',
  },
  order: {
    ar: 'في قائمة أقسام المدونة: 1 أولاً.',
    en: "In the blog's hub list: 1 first.",
  },
};

/** Authors. */
export const AUTHOR_DESCRIPTIONS: Described = {
  name: {
    ar: 'في سطر التوقيع تحت عنوان المقال وفي صفحة الكاتب.',
    en: "In the byline under a post's title and on the author's page.",
  },
  slug: {
    ar: 'آخر رابط صفحة الكاتب: b7r.sa/author/dhia. حروف لاتينية صغيرة وشرطات.',
    en: 'The end of the author page address: b7r.sa/author/dhia. Lowercase letters and hyphens.',
  },
  role: {
    ar: 'تحت الاسم في سطر التوقيع وفي صفحته: «مؤسس بحر برنت».',
    en: 'Under the name in the byline and on the page: "Founder of B7R Print".',
  },
  bio: {
    ar: 'في صفحة الكاتب وبيانات البحث. جملتان إلى ثلاث. فارغة تخفي الفقرة.',
    en: "On the author's page and in the search data. Two or three sentences. Empty hides the paragraph.",
  },
  photo: {
    ar: 'دائرية، في صفحة الكاتب وبجانب سطر التوقيع. فارغة تعرض الحرف الأول.',
    en: "Round, on the author's page and beside the byline. Empty shows the initial.",
  },
  sameAs: {
    ar: 'الحسابات العامة (X، LinkedIn) في بيانات البحث للصفحة؛ تربط الاسم بشخص.',
    en: 'Public profiles (X, LinkedIn) in the search data of the page; ties the name to a person.',
  },
  'sameAs.url': {
    ar: 'حساب واحد برابطه الكامل. لا يظهر للزائر.',
    en: 'One full profile link. Not shown to a visitor.',
  },
};

/** Tags: an admin-side grouping of posts; nothing on the site reads them today. */
export const TAG_DESCRIPTIONS: Described = {
  name: {
    ar: 'في قائمة المقالات ومرشّحاتها داخل اللوحة. لا يظهر في الموقع.',
    en: 'In the posts list and its filters inside the panel. Not shown on the site.',
  },
  slug: {
    ar: 'حروف لاتينية صغيرة وشرطات. لا يظهر في الموقع.',
    en: 'Lowercase letters and hyphens. Not shown on the site.',
  },
};
