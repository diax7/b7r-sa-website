/**
 * The panel's glossary (ADR-046 "one word per thing", the 2026-09-19 words pass): one row
 * per concept the panel names, the English term, the one Arabic word, and whether the term
 * stays Latin inside Arabic copy. `docs/ADMIN-GLOSSARY.md` is rendered from this table
 * (`pnpm glossary`) and `tests/admin-glossary.test.ts` checks the document against it and
 * refuses every `refused` form across the panel's Arabic: both string trees, our Payload
 * overrides, the description maps, the config labels and options, and the visibility
 * rules' sentences. The site's own copy (`src/content/copy/ar.ts`, BRD-verbatim) is only
 * reported on, never gated.
 *
 * A refused form is matched on Arabic text with the diacritics stripped, as a whole word:
 * a clitic («و», «ف», «ب», «ل», «ك») and the article «ال» may precede it, an Arabic letter
 * may not follow it, so a form never trips on a longer word that contains it (`refusedForm`
 * builds the pattern). List every spelling to refuse; a plural is its own entry.
 */
export type GlossaryArea =
  | 'panel'
  | 'site'
  | 'inbox'
  | 'catalogue'
  | 'blog'
  | 'engine'
  | 'visibility'
  | 'traffic'
  | 'external';

export interface GlossaryRow {
  /** Where the concept lives; orders the document. */
  area: GlossaryArea;
  /** The concept as the English panel names it. */
  en: string;
  /** The word the Arabic panel uses; for a Latin term, the term itself. */
  ar: string;
  /** Whether the term stays Latin inside Arabic copy (a brand, a format, a token). */
  latin: boolean;
  /** The Arabic forms the panel must never use for this concept. */
  refused: readonly string[];
  /** One line: where the word shows, or what to keep apart. */
  note?: string;
}

const AREA_LABELS: Record<GlossaryArea, string> = {
  panel: 'The panel',
  site: 'The site',
  inbox: 'Inbox',
  catalogue: 'Catalogue',
  blog: 'Blog',
  engine: 'Content engine',
  visibility: 'Visibility',
  traffic: 'Traffic',
  external: 'External services, formats and tokens',
};

const AREA_ORDER: GlossaryArea[] = [
  'panel',
  'site',
  'inbox',
  'catalogue',
  'blog',
  'engine',
  'visibility',
  'traffic',
  'external',
];

export const GLOSSARY: readonly GlossaryRow[] = [
  // The panel
  { area: 'panel', en: 'panel (the admin)', ar: 'اللوحة', latin: false, refused: ['لوحة الإدارة'] },
  {
    area: 'panel',
    en: 'dashboard',
    ar: 'لوحة التحكم',
    latin: false,
    refused: ['لوحة القيادة', 'لوحة المعلومات'],
    note: "The panel's front page; Payload's own word.",
  },
  { area: 'panel', en: 'panel language', ar: 'لغة اللوحة', latin: false, refused: ['لغة الواجهة'] },
  {
    area: 'panel',
    en: 'content language',
    ar: 'لغة المحتوى',
    latin: false,
    refused: ['لغة المستند'],
  },
  {
    area: 'panel',
    en: 'Arabic / English',
    ar: 'العربية / الإنجليزية',
    latin: false,
    refused: ['الانجليزية', 'الإنكليزية'],
  },
  { area: 'panel', en: 'admin (role)', ar: 'مدير', latin: false, refused: ['المسؤول', 'الأدمن'] },
  { area: 'panel', en: 'editor (role)', ar: 'محرّر', latin: false, refused: [] },
  { area: 'panel', en: 'user', ar: 'مستخدم', latin: false, refused: ['العضو'] },
  { area: 'panel', en: 'account', ar: 'حساب', latin: false, refused: [] },
  {
    area: 'panel',
    en: 'publish / published',
    ar: 'نشر / منشور',
    latin: false,
    refused: ['إطلاق'],
    note: "The status pill's word everywhere: the list, the dashboard, the palette.",
  },
  {
    area: 'panel',
    en: 'draft',
    ar: 'مسودة',
    latin: false,
    refused: ['مسودة أولية', 'النسخة الأولية'],
    note: 'One spelling, no shadda; the status pill, the dashboard tile, the rules.',
  },
  {
    area: 'panel',
    en: 'changed (a draft over a published version)',
    ar: 'معدّل',
    latin: false,
    refused: ['متغيّر', 'معدل جزئياً'],
    note: 'The list pill of a live document with newer text waiting (ADR-060); amber, never folded into Draft.',
  },
  { area: 'panel', en: 'save / last saved', ar: 'حفظ / آخر حفظ', latin: false, refused: [] },
  { area: 'panel', en: 'settings', ar: 'الإعدادات', latin: false, refused: ['الضبط', 'التهيئة'] },
  { area: 'panel', en: 'field', ar: 'حقل', latin: false, refused: ['الفيلد'] },
  {
    area: 'panel',
    en: 'tab (of a form)',
    ar: 'تبويب',
    latin: false,
    refused: ['التاب', 'علامة التبويب'],
  },
  {
    area: 'panel',
    en: 'version (of a document)',
    ar: 'نسخة',
    latin: false,
    refused: [],
    note: 'The build number on the dashboard is «الإصدار», a different thing.',
  },
  {
    area: 'panel',
    en: 'required',
    ar: 'مطلوب',
    latin: false,
    refused: ['إلزامي', 'إلزامية', 'إجباري'],
  },
  { area: 'panel', en: 'optional', ar: 'اختياري', latin: false, refused: ['غير إلزامي'] },
  { area: 'panel', en: 'empty', ar: 'فارغ', latin: false, refused: ['خالي', 'خال'] },
  {
    area: 'panel',
    en: 'on / off (a switch)',
    ar: 'مفعّل / معطّل',
    latin: false,
    refused: ['مطفأ', 'مشغل'],
    note: 'A thing that runs is «يعمل» / «متوقف» (the engine, a job); a switch is on or off.',
  },
  {
    area: 'panel',
    en: 'running / stopped',
    ar: 'يعمل / متوقف',
    latin: false,
    refused: ['قيد التشغيل', 'موقوف'],
  },
  { area: 'panel', en: 'order (sort)', ar: 'الترتيب', latin: false, refused: ['التسلسل'] },
  {
    area: 'panel',
    en: 'notification / warning',
    ar: 'تنبيه',
    latin: false,
    refused: ['إشعار', 'إشعارات', 'تحذير', 'تحذيرات'],
    note: 'A failure alert and an editorial warning are both a heads-up; plural «تنبيهات».',
  },
  { area: 'panel', en: 'notes', ar: 'ملاحظات', latin: false, refused: [] },
  {
    area: 'panel',
    en: 'e-mail',
    ar: 'البريد الإلكتروني',
    latin: false,
    refused: ['الإيميل', 'البريد الالكتروني'],
  },
  { area: 'panel', en: 'library (of images)', ar: 'المكتبة', latin: false, refused: [] },
  {
    area: 'panel',
    en: 'test (a connection)',
    ar: 'اختبار',
    latin: false,
    refused: ['تجربة الاتصال'],
  },
  { area: 'panel', en: 'queue', ar: 'الطابور', latin: false, refused: ['قائمة الانتظار'] },
  {
    area: 'panel',
    en: 'scheduled jobs',
    ar: 'المهام المجدولة',
    latin: false,
    refused: ['الوظائف المجدولة'],
  },
  { area: 'panel', en: 'character (a limit)', ar: 'حرف', latin: false, refused: [] },
  {
    area: 'panel',
    en: 'desktop (screen)',
    ar: 'الحاسوب',
    latin: false,
    refused: ['سطح المكتب', 'الكمبيوتر', 'ديسكتوب'],
  },
  {
    area: 'panel',
    en: 'phone (screen)',
    ar: 'الجوال',
    latin: false,
    refused: ['موبايل', 'الهاتف المحمول', 'الهاتف الذكي'],
  },
  {
    area: 'panel',
    en: 'screen reader',
    ar: 'قارئ الشاشة',
    latin: false,
    refused: ['القارئ الصوتي'],
  },
  {
    area: 'panel',
    en: 'Riyadh time',
    ar: 'بتوقيت الرياض',
    latin: false,
    refused: ['توقيت السعودية'],
  },
  { area: 'panel', en: 'SAR', ar: 'ريال', latin: false, refused: ['ر.س'] },
  { area: 'panel', en: 'USD', ar: 'دولار', latin: false, refused: ['دولار أمريكي'] },

  // The site
  { area: 'site', en: 'site', ar: 'الموقع', latin: false, refused: [] },
  {
    area: 'site',
    en: 'home page',
    ar: 'الصفحة الرئيسية',
    latin: false,
    refused: ['الصفحة الأولى', 'صفحة البداية'],
    note: '«الرئيسية» alone in running text.',
  },
  { area: 'site', en: 'page', ar: 'صفحة', latin: false, refused: [] },
  {
    area: 'site',
    en: 'section (of a page) / hub (of the blog)',
    ar: 'قسم',
    latin: false,
    refused: ['سكشن', 'تصنيف'],
    note: 'A section of a thing: a page block, or the blog section a post belongs to («أقسام المدونة»); a page form and a post form never show both.',
  },
  { area: 'site', en: 'header', ar: 'الترويسة', latin: false, refused: ['رأس الصفحة', 'هيدر'] },
  { area: 'site', en: 'footer', ar: 'التذييل', latin: false, refused: ['فوتر', 'ذيل الصفحة'] },
  { area: 'site', en: 'menu', ar: 'القائمة', latin: false, refused: ['منيو'] },
  { area: 'site', en: 'button', ar: 'زر', latin: false, refused: ['زرار'] },
  { area: 'site', en: 'link', ar: 'رابط', latin: false, refused: ['وصلة', 'لينك'] },
  { area: 'site', en: 'card', ar: 'بطاقة', latin: false, refused: ['كرت'] },
  { area: 'site', en: 'slide', ar: 'شريحة', latin: false, refused: ['سلايد'] },
  { area: 'site', en: 'opening slides', ar: 'الشرائح الافتتاحية', latin: false, refused: ['هيرو'] },
  { area: 'site', en: 'chip (small badge)', ar: 'شارة', latin: false, refused: [] },
  { area: 'site', en: 'bottom banner', ar: 'شريط الدعوة', latin: false, refused: ['بانر'] },
  { area: 'site', en: 'title', ar: 'العنوان', latin: false, refused: [] },
  {
    area: 'site',
    en: 'line under the title',
    ar: 'السطر تحت العنوان',
    latin: false,
    refused: ['العنوان الفرعي'],
  },
  {
    area: 'site',
    en: 'tagline',
    ar: 'الجملة التعريفية',
    latin: false,
    refused: ['الشعار النصي', 'السطر التعريفي'],
  },
  { area: 'site', en: 'brand', ar: 'العلامة', latin: false, refused: ['البراند', 'الماركة'] },
  { area: 'site', en: 'designer', ar: 'المصمّم', latin: false, refused: ['أداة التصميم'] },
  { area: 'site', en: 'calculator', ar: 'الحاسبة', latin: false, refused: ['الآلة الحاسبة'] },
  {
    area: 'site',
    en: 'welcome credit',
    ar: 'الرصيد الترحيبي',
    latin: false,
    refused: ['رصيد الترحيب', 'الرصيد المجاني'],
  },
  { area: 'site', en: 'delivery', ar: 'التوصيل', latin: false, refused: ['التسليم'] },
  { area: 'site', en: 'shipping (from where)', ar: 'الشحن', latin: false, refused: [] },
  { area: 'site', en: 'visitor', ar: 'زائر', latin: false, refused: [] },
  { area: 'site', en: 'merchant', ar: 'تاجر', latin: false, refused: ['البائع', 'العميل'] },
  { area: 'site', en: 'testimonial', ar: 'رأي تاجر', latin: false, refused: ['شهادة العميل'] },
  {
    area: 'site',
    en: 'sample (a placeholder testimonial)',
    ar: 'نموذج',
    latin: false,
    refused: ['عينة'],
  },
  { area: 'site', en: 'contact form', ar: 'نموذج التواصل', latin: false, refused: ['استمارة'] },
  {
    area: 'site',
    en: 'connected stores',
    ar: 'المتاجر المتصلة',
    latin: false,
    refused: ['التكاملات', 'المنصات المتصلة'],
  },
  { area: 'site', en: 'platform (a store platform)', ar: 'منصة', latin: false, refused: [] },
  {
    area: 'site',
    en: 'image / photo',
    ar: 'صورة',
    latin: false,
    refused: ['الوسائط', 'وسائط', 'ميديا'],
  },
  { area: 'site', en: 'icon', ar: 'أيقونة', latin: false, refused: ['ايقونة'] },
  {
    area: 'site',
    en: 'alt text',
    ar: 'النص البديل',
    latin: false,
    refused: ['الوصف البديل'],
    note: 'The attribute itself is `alt`.',
  },
  {
    area: 'site',
    en: 'search title',
    ar: 'عنوان البحث',
    latin: false,
    refused: ['العنوان الوصفي', 'عنوان ميتا'],
  },
  {
    area: 'site',
    en: 'search description',
    ar: 'وصف البحث',
    latin: false,
    refused: ['الوصف الوصفي', 'وصف ميتا'],
  },
  { area: 'site', en: 'search result', ar: 'نتيجة البحث', latin: false, refused: [] },
  { area: 'site', en: 'browser tab', ar: 'تبويب المتصفح', latin: false, refused: [] },
  {
    area: 'site',
    en: 'share image',
    ar: 'صورة المشاركة',
    latin: false,
    refused: ['صورة المعاينة'],
    note: 'The tag itself is `og:image`.',
  },
  {
    area: 'site',
    en: 'search engines',
    ar: 'محركات البحث',
    latin: false,
    refused: ['محركات الفهرسة'],
  },
  {
    area: 'site',
    en: 'search data (structured data, schema)',
    ar: 'بيانات البحث',
    latin: false,
    refused: ['البيانات المهيكلة', 'البيانات المنظمة', 'بيانات المنظمة', 'مخطط المتجر', 'سكيما'],
    note: 'What search engines and assistants read behind the page: one name for all of it.',
  },
  { area: 'site', en: 'sitemap', ar: 'خريطة الموقع', latin: false, refused: ['سايت ماب'] },
  {
    area: 'site',
    en: 'consent bar / cookies',
    ar: 'شريط الموافقة / ملفات الارتباط',
    latin: false,
    refused: ['كوكيز', 'ملفات تعريف الارتباط', 'ملفات تعريف'],
  },
  {
    area: 'site',
    en: 'redirect',
    ar: 'تحويل',
    latin: false,
    refused: ['إعادة التوجيه', 'إعادة توجيه'],
  },
  {
    area: 'site',
    en: 'fixed pages',
    ar: 'الصفحات الثابتة',
    latin: false,
    refused: ['الصفحات الأساسية'],
  },
  { area: 'site', en: 'address / path', ar: 'عنوان / مسار', latin: false, refused: [] },

  // Inbox (ADR-061)
  {
    area: 'inbox',
    en: 'inbox',
    ar: 'الوارد',
    latin: false,
    refused: ['البريد الوارد', 'صندوق الوارد'],
    note: 'The section under Site and the dashboard card: the messages, and the bookings after them.',
  },
  {
    area: 'inbox',
    en: 'message (a contact form submission)',
    ar: 'رسالة',
    latin: false,
    refused: ['مراسلة', 'طلب تواصل'],
    note: 'Plural «الرسائل»; the row is what the form sent, never rewritten.',
  },
  {
    area: 'inbox',
    en: 'inquiry (the choice on the form)',
    ar: 'الاستفسار',
    latin: false,
    refused: ['نوع الطلب'],
    note: "The column reads «نوع الاستفسار», the form's own label.",
  },
  { area: 'inbox', en: 'sender', ar: 'المرسل', latin: false, refused: ['صاحب الرسالة'] },
  { area: 'inbox', en: 'reply', ar: 'رد', latin: false, refused: [] },
  {
    area: 'inbox',
    en: 'new (a message nobody opened)',
    ar: 'جديد',
    latin: false,
    refused: ['غير مقروء', 'غير مقروءة'],
    note: 'The status pill in blue, the sidebar badge and the dashboard card count these.',
  },
  {
    area: 'inbox',
    en: 'following (a reply pending)',
    ar: 'قيد المتابعة',
    latin: false,
    refused: ['تحت المتابعة', 'جارٍ المتابعة'],
    note: 'Amber, like a draft: someone is on it.',
  },
  {
    area: 'inbox',
    en: 'handled',
    ar: 'معالَج',
    latin: false,
    refused: ['تمت المعالجة', 'تم التعامل', 'منتهية'],
    note: 'Green, done; the passive participle, never «تم» + مصدر (§5). The action is «علّم كمعالَج».',
  },

  // Catalogue
  { area: 'catalogue', en: 'catalogue', ar: 'الكتالوج', latin: false, refused: [] },
  { area: 'catalogue', en: 'product', ar: 'منتج', latin: false, refused: ['سلعة'] },
  { area: 'catalogue', en: 'colour', ar: 'لون', latin: false, refused: [] },
  { area: 'catalogue', en: 'size', ar: 'مقاس', latin: false, refused: [] },
  {
    area: 'catalogue',
    en: 'print area',
    ar: 'منطقة الطباعة',
    latin: false,
    refused: ['مساحة الطباعة'],
  },
  {
    area: 'catalogue',
    en: 'base cost',
    ar: 'التكلفة الأساسية',
    latin: false,
    refused: ['سعر التكلفة'],
  },
  {
    area: 'catalogue',
    en: 'suggested price',
    ar: 'سعر البيع المقترح',
    latin: false,
    refused: ['السعر المقترح'],
  },
  {
    area: 'catalogue',
    en: 'FAQ',
    ar: 'الأسئلة الشائعة',
    latin: false,
    refused: ['الأسئلة المتكررة'],
  },
  {
    area: 'catalogue',
    en: 'question (a FAQ entry, a buyer prompt)',
    ar: 'سؤال',
    latin: false,
    refused: ['مدخل', 'موجه', 'موجهات', 'أمر نصي'],
    note: 'One word on the FAQ and in the ledger: what a visitor or a buyer asks.',
  },
  { area: 'catalogue', en: 'answer', ar: 'الإجابة', latin: false, refused: ['الجواب', 'جواب'] },
  {
    area: 'catalogue',
    en: 'group (of FAQ)',
    ar: 'مجموعة',
    latin: false,
    refused: [],
    note: 'Never «قسم»: that is a blog hub or a page section.',
  },

  // Blog
  { area: 'blog', en: 'blog', ar: 'المدونة', latin: false, refused: ['بلوق'] },
  { area: 'blog', en: 'post', ar: 'مقال', latin: false, refused: ['تدوينة', 'مقالة'] },
  { area: 'blog', en: 'author', ar: 'كاتب', latin: false, refused: ['المؤلف'] },
  { area: 'blog', en: 'byline', ar: 'سطر التوقيع', latin: false, refused: [] },
  { area: 'blog', en: 'tag', ar: 'وسم', latin: false, refused: ['تاق', 'الكلمة الدلالية'] },
  {
    area: 'blog',
    en: 'cover',
    ar: 'غلاف',
    latin: false,
    refused: ['الصورة الرئيسية', 'الصورة البارزة'],
  },
  {
    area: 'blog',
    en: 'key takeaways',
    ar: 'أهم النقاط',
    latin: false,
    refused: ['النقاط الرئيسية', 'نقاط رئيسية', 'خلاصات'],
  },
  { area: 'blog', en: 'excerpt', ar: 'المقتطف', latin: false, refused: [] },
  { area: 'blog', en: 'body', ar: 'المتن', latin: false, refused: ['جسم المقال'] },
  { area: 'blog', en: 'rich text', ar: 'نص منسّق', latin: false, refused: ['النص الغني'] },
  {
    area: 'blog',
    en: 'reading time',
    ar: 'مدة القراءة',
    latin: false,
    refused: ['وقت القراءة', 'دقائق القراءة'],
  },

  // Content engine
  {
    area: 'engine',
    en: 'content engine',
    ar: 'محرّك المحتوى',
    latin: false,
    refused: ['المولد', 'محرك الذكاء'],
    note: '«المحرّك» alone inside its own forms.',
  },
  {
    area: 'engine',
    en: 'run',
    ar: 'جولة',
    latin: false,
    refused: ['تشغيل', 'تشغيلة', 'تشغيلات'],
    note: 'The noun; the button is still «شغّل الآن».',
  },
  { area: 'engine', en: 'runs (the log)', ar: 'الجولات', latin: false, refused: [] },
  {
    area: 'engine',
    en: 'topic',
    ar: 'موضوع',
    latin: false,
    refused: ['موضوعات'],
    note: 'Plural «المواضيع».',
  },
  {
    area: 'engine',
    en: 'backlog',
    ar: 'قائمة المواضيع',
    latin: false,
    refused: ['متراكمات'],
    note: '«القائمة» alone inside the topics form; the site menu is the other «القائمة».',
  },
  { area: 'engine', en: 'connection', ar: 'اتصال', latin: false, refused: [] },
  {
    area: 'engine',
    en: 'service (the AI vendor)',
    ar: 'الخدمة',
    latin: false,
    refused: ['مزود', 'مزودة'],
    note: 'OpenAI, Anthropic, Google: the same word on a connection, a run and a citation.',
  },
  { area: 'engine', en: 'model', ar: 'النموذج', latin: false, refused: ['موديل'] },
  {
    area: 'engine',
    en: 'API key',
    ar: 'مفتاح API',
    latin: false,
    refused: ['المفتاح السري', 'مفتاح الواجهة'],
  },
  {
    area: 'engine',
    en: 'input / output tokens',
    ar: 'رموز الإدخال / رموز الإخراج',
    latin: false,
    refused: ['رموز الدخل', 'رموز الخرج', 'توكن', 'توكنات'],
  },
  { area: 'engine', en: 'cost', ar: 'التكلفة', latin: false, refused: ['كلفة'] },
  { area: 'engine', en: 'spend', ar: 'الإنفاق', latin: false, refused: ['مصروف'] },
  { area: 'engine', en: 'estimate', ar: 'تقديري', latin: false, refused: ['تقريبي'] },
  {
    area: 'engine',
    en: 'limit (a cap)',
    ar: 'الحد',
    latin: false,
    refused: ['سقف'],
    note: 'The engine limits posts, a connection limits dollars; one word.',
  },
  { area: 'engine', en: 'schedule', ar: 'جدولة', latin: false, refused: [] },
  {
    area: 'engine',
    en: 'system prompt',
    ar: 'التعليمات الأساسية',
    latin: false,
    refused: ['موجه النظام', 'برومبت'],
  },
  { area: 'engine', en: 'style guide', ar: 'دليل الأسلوب', latin: false, refused: ['دليل النمط'] },
  {
    area: 'engine',
    en: 'self-review',
    ar: 'المراجعة الذاتية',
    latin: false,
    refused: ['التقييم الذاتي'],
  },
  {
    area: 'engine',
    en: 'quality threshold',
    ar: 'حد الجودة',
    latin: false,
    refused: ['عتبة الجودة'],
  },
  {
    area: 'engine',
    en: 'keyword',
    ar: 'الكلمة المفتاحية',
    latin: false,
    refused: ['الكلمة الرئيسية'],
  },
  { area: 'engine', en: 'intent', ar: 'القصد', latin: false, refused: [] },
  { area: 'engine', en: 'priority', ar: 'الأولوية', latin: false, refused: [] },
  {
    area: 'engine',
    en: 'facts sheet',
    ar: 'ورقة الحقائق',
    latin: false,
    refused: ['قائمة الحقائق'],
  },
  { area: 'engine', en: 'refresh (freshness)', ar: 'تحديث', latin: false, refused: [] },
  { area: 'engine', en: 'digest', ar: 'ملخص', latin: false, refused: ['موجز'] },

  // Visibility
  {
    area: 'visibility',
    en: 'visibility',
    ar: 'الظهور',
    latin: false,
    refused: ['المرئية', 'الوضوح'],
  },
  {
    area: 'visibility',
    en: 'score',
    ar: 'الدرجة',
    latin: false,
    refused: ['نقاط الظهور', 'مؤشر الظهور'],
    note: 'The Score page is «درجة الظهور».',
  },
  {
    area: 'visibility',
    en: 'AI assistant',
    ar: 'مساعد ذكاء اصطناعي',
    latin: false,
    refused: ['مساعد AI', 'الشات بوت', 'روبوت المحادثة'],
  },
  { area: 'visibility', en: 'citation', ar: 'استشهاد', latin: false, refused: [] },
  {
    area: 'visibility',
    en: 'citation ledger',
    ar: 'سجل الاستشهادات',
    latin: false,
    refused: ['سجل الاستشهاد', 'سجل الاقتباسات'],
  },
  {
    area: 'visibility',
    en: 'cited rate',
    ar: 'نسبة الاستشهاد',
    latin: false,
    refused: ['معدل الاستشهاد'],
  },
  { area: 'visibility', en: 'competitor', ar: 'منافس', latin: false, refused: [] },
  {
    area: 'visibility',
    en: 'outside signals',
    ar: 'الإشارات الخارجية',
    latin: false,
    refused: ['المؤشرات الخارجية'],
  },
  { area: 'visibility', en: 'snapshot', ar: 'لقطة', latin: false, refused: ['صورة لحظية'] },
  { area: 'visibility', en: 'pull', ar: 'سحب', latin: false, refused: ['جلب'] },
  {
    area: 'visibility',
    en: 'off-site checklist',
    ar: 'قائمة الحضور الخارجي',
    latin: false,
    refused: ['قائمة التحقق', 'قائمة المهام'],
  },
  {
    area: 'visibility',
    en: 'impressions',
    ar: 'مرات الظهور',
    latin: false,
    refused: ['الانطباعات', 'مرات العرض'],
  },
  { area: 'visibility', en: 'clicks', ar: 'النقرات', latin: false, refused: ['الضغطات'] },
  { area: 'visibility', en: 'query (a search)', ar: 'الاستعلام', latin: false, refused: [] },
  {
    area: 'visibility',
    en: 'verification token',
    ar: 'رمز التحقق',
    latin: false,
    refused: ['كود التحقق'],
  },

  // Traffic
  {
    area: 'traffic',
    en: 'traffic (the page)',
    ar: 'مصادر الزيارات',
    latin: false,
    refused: ['حركة المرور', 'ترافيك', 'حركة الزيارات'],
  },
  { area: 'traffic', en: 'visit / landing', ar: 'زيارة', latin: false, refused: ['هبوط'] },
  {
    area: 'traffic',
    en: 'visitors (the people, by Umami)',
    ar: 'الزوّار',
    latin: false,
    refused: ['الزائرون', 'الزائرين'],
    note: 'The dashboard’s visits tile and the people row when Umami counts (ADR-048 amended); a landing stays «زيارة», a user «مستخدم». Counted, the four forms of `arabicCount`: «زائر واحد», «زائران», «5 زوّار», «25 زائراً».',
  },
  {
    area: 'traffic',
    en: 'page views',
    ar: 'مشاهدات الصفحات',
    latin: false,
    refused: ['الصفحات المعروضة'],
  },
  {
    area: 'traffic',
    en: 'entry page',
    ar: 'صفحة الدخول',
    latin: false,
    refused: ['صفحة الهبوط', 'صفحات الهبوط'],
  },
  { area: 'traffic', en: 'crawl', ar: 'زحف', latin: false, refused: [] },
  { area: 'traffic', en: 'crawler (a bot)', ar: 'زاحف', latin: false, refused: ['عنكبوت'] },
  { area: 'traffic', en: 'channel', ar: 'قناة', latin: false, refused: [] },
  { area: 'traffic', en: 'referrer', ar: 'المُحيل', latin: false, refused: [] },

  // External services, formats and tokens: Latin inside Arabic copy
  {
    area: 'external',
    en: 'API',
    ar: 'API',
    latin: true,
    refused: ['واجهة برمجة', 'واجهة برمجية', 'واجهات برمجة', 'واجهة التطبيقات'],
  },
  { area: 'external', en: 'JSON', ar: 'JSON', latin: true, refused: ['جيسون'] },
  {
    area: 'external',
    en: 'URL',
    ar: 'URL',
    latin: true,
    refused: ['يو آر إل'],
    note: 'A link is «رابط», an address «عنوان»; the token stays URL.',
  },
  {
    area: 'external',
    en: 'slug',
    ar: 'slug',
    latin: true,
    refused: ['سلاغ', 'سلج', 'الاسم اللطيف'],
    note: 'Glossed once on the label: «المعرّف في الرابط (slug)».',
  },
  { area: 'external', en: 'UTM', ar: 'UTM', latin: true, refused: [] },
  { area: 'external', en: 'CSV', ar: 'CSV', latin: true, refused: ['سي إس في'] },
  {
    area: 'external',
    en: 'CSP',
    ar: 'CSP',
    latin: true,
    refused: ['سياسة أمان المحتوى'],
    note: 'Never named to an editor; the panel says which addresses the site allows.',
  },
  { area: 'external', en: 'IndexNow', ar: 'IndexNow', latin: true, refused: ['إندكس ناو'] },
  {
    area: 'external',
    en: 'Search Console',
    ar: 'Search Console',
    latin: true,
    refused: ['سيرش كونسول', 'كونسول البحث', 'وحدة تحكم البحث'],
  },
  {
    area: 'external',
    en: 'Bing Webmaster Tools',
    ar: 'Bing Webmaster Tools',
    latin: true,
    refused: ['بينغ', 'أدوات مشرفي'],
  },
  {
    area: 'external',
    en: 'PageSpeed Insights',
    ar: 'PageSpeed Insights',
    latin: true,
    refused: ['بيج سبيد', 'سرعة الصفحة'],
  },
  { area: 'external', en: 'Umami', ar: 'Umami', latin: true, refused: ['أومامي'] },
  {
    area: 'external',
    en: 'GA4 (Google Analytics 4)',
    ar: 'GA4',
    latin: true,
    refused: ['تحليلات جوجل', 'تحليلات Google', 'جوجل أناليتكس'],
  },
  { area: 'external', en: 'Google', ar: 'Google', latin: true, refused: ['جوجل', 'غوغل', 'قوقل'] },
  {
    area: 'external',
    en: 'ChatGPT / Copilot / Gemini / Claude',
    ar: 'ChatGPT / Copilot / Gemini / Claude',
    latin: true,
    refused: ['شات جي بي تي', 'جيميناي', 'كلود'],
  },
  {
    area: 'external',
    en: 'WhatsApp',
    ar: 'WhatsApp',
    latin: true,
    refused: ['واتساب', 'الواتس', 'واتس اب'],
  },
  {
    area: 'external',
    en: 'X / Instagram / TikTok / LinkedIn / YouTube',
    ar: 'X / Instagram / TikTok / LinkedIn / YouTube',
    latin: true,
    refused: [
      'إنستغرام',
      'انستقرام',
      'إنستقرام',
      'تيك توك',
      'لينكدإن',
      'لينكد إن',
      'يوتيوب',
      'تويتر',
    ],
  },
  {
    area: 'external',
    en: 'Turnstile',
    ar: 'Turnstile',
    latin: true,
    refused: ['تيرنستايل'],
    note: 'The dashboard says what it does: «فحص الروبوتات».',
  },
  { area: 'external', en: 'Resend', ar: 'Resend', latin: true, refused: ['ريسند'] },
  { area: 'external', en: 'Pexels', ar: 'Pexels', latin: true, refused: ['بكسلز'] },
  { area: 'external', en: 'Cal.com', ar: 'Cal.com', latin: true, refused: [] },
  {
    area: 'external',
    en: 'Salla / Zid',
    ar: 'سلة / زد',
    latin: false,
    refused: [],
    note: "The platforms' own Arabic names, as the site shows them.",
  },
  { area: 'external', en: 'Shopify', ar: 'Shopify', latin: true, refused: ['شوبيفاي'] },
  {
    area: 'external',
    en: 'Misk',
    ar: 'مسك',
    latin: false,
    refused: [],
    note: "The foundation's own Arabic name; the programme is Launchpad.",
  },
  {
    area: 'external',
    en: 'model ids',
    ar: 'gpt-4.1-mini, claude-haiku-4-5, gemini-3-flash-preview, deepseek-chat',
    latin: true,
    refused: [],
    note: 'Exactly as the service writes them.',
  },
  { area: 'external', en: 'alt (the attribute)', ar: 'alt', latin: true, refused: [] },
  { area: 'external', en: 'og:image', ar: 'og:image', latin: true, refused: [] },
  {
    area: 'external',
    en: 'H1 / H2',
    ar: 'H1 / H2',
    latin: true,
    refused: ['العنوان الأول', 'عنوان من المستوى'],
  },
  {
    area: 'external',
    en: 'meta tag',
    ar: 'وسم meta',
    latin: true,
    refused: ['وسم ميتا', 'الميتا'],
  },
  {
    area: 'external',
    en: 'llms.txt / robots.txt / noindex',
    ar: 'llms.txt / robots.txt / noindex',
    latin: true,
    refused: [],
  },
  {
    area: 'external',
    en: 'Markdown / HTML',
    ar: 'Markdown / HTML',
    latin: true,
    refused: ['ماركداون'],
  },
  {
    area: 'external',
    en: 'file formats and codes (PNG, JPG, SVG, UUID, hex)',
    ar: 'PNG, JPG, SVG, UUID, #rrggbb',
    latin: true,
    refused: [],
  },
  {
    area: 'external',
    en: 'brand and product names',
    ar: 'B7R Print, بحر برنت',
    latin: true,
    refused: [],
    note: 'The brand has both names; a product name is the catalogue’s.',
  },
];

/** Tashkeel (U+064B to U+0652, U+0670) and the tatweel, stripped before a form is matched. */
const DIACRITICS = /[\u064B-\u0652\u0670\u0640]/g;
const ARABIC_LETTER = '\\u0621-\\u064A';

/** The text as the glossary reads it: no diacritics, so «مفعّل» and «مفعل» are one word. */
export function stripDiacritics(text: string): string {
  return text.replace(DIACRITICS, '');
}

/**
 * The pattern for a refused form: the form as a whole word, after an optional clitic and
 * the article, with no Arabic letter after it. Built over `stripDiacritics` text.
 */
export function refusedForm(form: string): RegExp {
  const escaped = stripDiacritics(form).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(
    `(?<![${ARABIC_LETTER}])(?:[وفبك]?ال|لل|[وفبلك])?${escaped}(?![${ARABIC_LETTER}])`,
    'u',
  );
}

/** A table cell: a bar inside the text escaped. */
const cell = (text: string) => text.replace(/\|/g, '\\|');

/** The document `docs/ADMIN-GLOSSARY.md`, rendered from the table above (`pnpm glossary`). */
export function renderGlossary(rows: readonly GlossaryRow[] = GLOSSARY): string {
  const lines: string[] = [
    '# Admin glossary',
    '',
    'One word per thing (ADR-046), in both languages of the panel (ADR-056). Generated from',
    '`src/modules/cms/admin/glossary.ts` by `pnpm glossary`; `tests/admin-glossary.test.ts` checks',
    'this file against the table and refuses every "never" form across the panel’s Arabic (the',
    'string trees, the Payload overrides, the description maps, the config labels and options,',
    'the visibility rules). Edit the table, not this file.',
    '',
    'A term marked Latin stays in Latin letters inside Arabic copy: brands, services, formats',
    'and tokens. Everything else has its one Arabic word; the "never" column lists the forms the',
    'test refuses (translations of a Latin term, or synonyms of the settled word).',
    '',
    '| Area | English | In Arabic copy | Latin | Never | Note |',
    '|---|---|---|---|---|---|',
  ];
  for (const area of AREA_ORDER) {
    for (const row of rows.filter((r) => r.area === area)) {
      lines.push(
        `| ${AREA_LABELS[area]} | ${cell(row.en)} | ${cell(row.ar)} | ${row.latin ? 'yes' : ''} | ${row.refused.map(cell).join('، ')} | ${cell(row.note ?? '')} |`,
      );
    }
  }
  lines.push('');
  return lines.join('\n');
}
