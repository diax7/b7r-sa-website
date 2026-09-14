/**
 * The content backlog (BRD Appendix E, 10.2.2): the thirty seed topics with their hub,
 * keywords, intent, priority and, for the seasonal ones, the publish window. The three
 * topics the Level 1 posts already cover are seeded `published` and linked to their post,
 * so the engine never writes them twice and the freshness job knows their topic.
 */
export type SeedIntent = 'informational' | 'commercial' | 'seasonal';

/** A yearly window as `MM-DD` pairs, or fixed dates for a moving feast (Ramadan). */
export type SeedWindow = { start: string; end: string };

export interface SeedTopic {
  title: string;
  hub: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  intent: SeedIntent;
  priority: 1 | 2 | 3 | 4 | 5;
  window?: SeedWindow;
  /** The Level 1 post that already covers the topic (by slug). */
  post?: string;
}

const MONTH_DAY = /^\d{2}-\d{2}$/;

/**
 * The next occurrence of a yearly window at `now`: the coming end date (this year, or next
 * when it has passed) and the start before it (the previous year when the window crosses
 * New Year). Fixed `YYYY-MM-DD` dates pass through.
 */
export function nextWindow(now: Date, window: SeedWindow): { start: string; end: string } {
  if (!MONTH_DAY.test(window.end)) return { start: window.start, end: window.end };
  const today = now.toISOString().slice(0, 10);
  let year = now.getUTCFullYear();
  if (`${year}-${window.end}` < today) year += 1;
  const startYear = window.start > window.end ? year - 1 : year;
  return { start: `${startYear}-${window.start}`, end: `${year}-${window.end}` };
}

export const seedTopics: SeedTopic[] = [
  {
    title: 'كيف تبدأ براند ملابس في السعودية بدون مصنع وبدون مخزون (2026)',
    hub: 'getting-started',
    primaryKeyword: 'كيف أبدأ براند ملابس',
    secondaryKeywords: ['مشروع بدون مخزون', 'بيع تيشيرتات بدون رأس مال'],
    intent: 'informational',
    priority: 5,
    post: 'start-clothing-brand-saudi-no-factory-no-stock',
  },
  {
    title: 'بيع تيشيرتات بدون رأس مال: الخطوات من التصميم لأول طلب',
    hub: 'getting-started',
    primaryKeyword: 'بيع تيشيرتات بدون رأس مال',
    secondaryKeywords: ['مشروع من البيت', 'أول طلب'],
    intent: 'informational',
    priority: 5,
  },
  {
    title: 'مشروع بدون مخزون من البيت: 7 أفكار تناسب السعودية',
    hub: 'getting-started',
    primaryKeyword: 'مشروع بدون مخزون',
    secondaryKeywords: ['مشروع من البيت', 'أفكار مشاريع صغيرة'],
    intent: 'informational',
    priority: 4,
  },
  {
    title: 'سجل تجاري أم وثيقة عمل حر؟ ما تحتاجه لمتجر ملابس مطبوعة',
    hub: 'getting-started',
    primaryKeyword: 'وثيقة العمل الحر لمتجر إلكتروني',
    secondaryKeywords: ['سجل تجاري متجر إلكتروني', 'ترخيص متجر ملابس'],
    intent: 'informational',
    priority: 3,
  },
  {
    title: 'توثيق متجرك في المركز السعودي للأعمال خطوة بخطوة',
    hub: 'getting-started',
    primaryKeyword: 'توثيق المتجر الإلكتروني',
    secondaryKeywords: ['المركز السعودي للأعمال', 'شهادة توثيق المتجر'],
    intent: 'informational',
    priority: 3,
  },
  {
    title: 'ما هي الطباعة عند الطلب؟ شرح مبسط بالأمثلة السعودية',
    hub: 'pod-basics',
    primaryKeyword: 'ما هي الطباعة عند الطلب',
    secondaryKeywords: ['الطباعة حسب الطلب', 'طباعة تيشيرت حسب الطلب'],
    intent: 'informational',
    priority: 5,
    post: 'what-is-print-on-demand-saudi-examples',
  },
  {
    title: 'الطباعة حسب الطلب مقابل الدروبشيبينغ: أيهما أنسب لك؟',
    hub: 'pod-basics',
    primaryKeyword: 'الطباعة حسب الطلب مقابل الدروبشيبينغ',
    secondaryKeywords: ['دروبشيبينغ السعودية', 'الفرق بين الطباعة عند الطلب والدروبشيبينغ'],
    intent: 'informational',
    priority: 4,
  },
  {
    title: 'تقنيات الطباعة على الملابس: أي طريقة تناسب تصميمك؟',
    hub: 'pod-basics',
    primaryKeyword: 'تقنيات الطباعة على الملابس',
    secondaryKeywords: ['طباعة DTG', 'طباعة DTF', 'طباعة تيشيرت حسب الطلب'],
    intent: 'informational',
    priority: 3,
  },
  {
    title: 'كم يستغرق وصول الطلب؟ مقارنة الطباعة الخارجية بالطباعة المحلية في السعودية',
    hub: 'pod-basics',
    primaryKeyword: 'مدة توصيل الطباعة عند الطلب',
    secondaryKeywords: ['الطباعة المحلية في السعودية', 'مدة الشحن من الخارج'],
    intent: 'informational',
    priority: 4,
  },
  {
    title: 'لماذا تفشل متاجر التيشيرتات؟ أخطاء الجودة والمقاسات والتسعير',
    hub: 'pod-basics',
    primaryKeyword: 'أخطاء متاجر التيشيرتات',
    secondaryKeywords: ['جودة الطباعة', 'مقاسات التيشيرتات', 'أخطاء التسعير'],
    intent: 'informational',
    priority: 3,
  },
  {
    title: 'ربط متجر سلة بالطباعة عند الطلب في 10 دقائق',
    hub: 'salla-zid-shopify',
    primaryKeyword: 'طباعة حسب الطلب لمتاجر سلة',
    secondaryKeywords: ['ربط متجر سلة بالطباعة', 'دروبشيبينغ سلة'],
    intent: 'commercial',
    priority: 5,
  },
  {
    title: 'ربط متجر زد بالطباعة عند الطلب',
    hub: 'salla-zid-shopify',
    primaryKeyword: 'تطبيق زد طباعة',
    secondaryKeywords: ['ربط متجر زد', 'الطباعة عند الطلب زد'],
    intent: 'commercial',
    priority: 4,
  },
  {
    title: 'إعداد خيارات المقاس واللون في سلة لمنتجات مطبوعة',
    hub: 'salla-zid-shopify',
    primaryKeyword: 'خيارات المنتج في سلة',
    secondaryKeywords: ['مقاسات المنتجات في سلة', 'ألوان المنتج سلة'],
    intent: 'informational',
    priority: 3,
  },
  {
    title: 'أفضل تطبيقات سلة لمتاجر الملابس والهدايا',
    hub: 'salla-zid-shopify',
    primaryKeyword: 'أفضل تطبيقات سلة',
    secondaryKeywords: ['تطبيقات سلة للملابس', 'تطبيقات سلة للهدايا'],
    intent: 'commercial',
    priority: 3,
  },
  {
    title: 'كيف تضيف تخصيصاً بالاسم على منتجاتك في سلة',
    hub: 'salla-zid-shopify',
    primaryKeyword: 'تخصيص المنتج بالاسم في سلة',
    secondaryKeywords: ['منتجات مخصصة سلة', 'طباعة بالاسم'],
    intent: 'informational',
    priority: 3,
  },
  {
    title: 'مقاسات ملفات الطباعة: الدقة والخلفية الشفافة والألوان',
    hub: 'design',
    primaryKeyword: 'مقاس ملف الطباعة',
    secondaryKeywords: ['DPI للطباعة', 'خلفية شفافة للطباعة', 'ألوان الطباعة'],
    intent: 'informational',
    priority: 4,
  },
  {
    title: '20 فكرة تصميم تيشيرت بالخط العربي',
    hub: 'design',
    primaryKeyword: 'تصميم تيشيرت بالخط العربي',
    secondaryKeywords: ['أفكار تصاميم تيشيرتات', 'الخط العربي على الملابس'],
    intent: 'informational',
    priority: 5,
  },
  {
    title: 'تصاميم تنجح في السعودية: القهوة والصقور والديوانية والجامعات',
    hub: 'design',
    primaryKeyword: 'أفكار تصاميم تيشيرتات',
    secondaryKeywords: ['تصاميم سعودية', 'تصاميم الجامعات'],
    intent: 'informational',
    priority: 4,
  },
  {
    title: 'حقوق الملكية: ما الذي لا يجوز طباعته على المنتجات',
    hub: 'design',
    primaryKeyword: 'حقوق الملكية الفكرية للطباعة',
    secondaryKeywords: ['طباعة الشعارات', 'حقوق التصميم'],
    intent: 'informational',
    priority: 3,
  },
  {
    title: 'كيف تسعّر تيشيرتاً مطبوعاً في السعودية (مع حاسبة هامش الربح)',
    hub: 'pricing-profit',
    primaryKeyword: 'تسعير التيشيرت المطبوع',
    secondaryKeywords: ['هامش ربح الطباعة عند الطلب', 'حاسبة الربح'],
    intent: 'informational',
    priority: 5,
    post: 'how-to-price-printed-tshirt-saudi',
  },
  {
    title: 'تكلفة الشحن داخل المملكة وتأثيرها على السعر النهائي',
    hub: 'pricing-profit',
    primaryKeyword: 'تكلفة الشحن داخل المملكة',
    secondaryKeywords: ['الشحن والسعر النهائي', 'شحن مجاني متجر إلكتروني'],
    intent: 'informational',
    priority: 4,
  },
  {
    title: 'الضريبة والفاتورة الإلكترونية لمتاجر الطباعة عند الطلب',
    hub: 'pricing-profit',
    primaryKeyword: 'الفاتورة الإلكترونية للمتاجر',
    secondaryKeywords: ['ضريبة القيمة المضافة متجر إلكتروني', 'التسجيل في الضريبة'],
    intent: 'informational',
    priority: 3,
  },
  {
    title: 'متى تنتقل من الطباعة عند الطلب إلى الطباعة بالجملة؟',
    hub: 'pricing-profit',
    primaryKeyword: 'الطباعة بالجملة مقابل الطباعة عند الطلب',
    secondaryKeywords: ['هامش ربح الطباعة عند الطلب', 'طباعة بالجملة'],
    intent: 'commercial',
    priority: 3,
  },
  {
    title: 'تيشيرتات اليوم الوطني: جهّز متجرك قبل 23 سبتمبر بستة أسابيع',
    hub: 'seasons',
    primaryKeyword: 'تيشيرت اليوم الوطني',
    secondaryKeywords: ['تصاميم اليوم الوطني', 'منتجات اليوم الوطني'],
    intent: 'seasonal',
    priority: 4,
    window: { start: '06-15', end: '08-10' },
  },
  {
    title: 'يوم التأسيس (22 فبراير): أفكار تصاميم السدو والبشت بدون مخزون',
    hub: 'seasons',
    primaryKeyword: 'تيشيرت يوم التأسيس',
    secondaryKeywords: ['تصاميم السدو', 'منتجات يوم التأسيس'],
    intent: 'seasonal',
    priority: 4,
    window: { start: '11-15', end: '01-05' },
  },
  {
    title: 'هدايا رمضان والعيد المخصصة: التوقيت والتصاميم الأعلى طلباً',
    hub: 'seasons',
    primaryKeyword: 'هدايا رمضان مخصصة',
    secondaryKeywords: ['هدايا العيد بالاسم', 'توزيعات رمضان'],
    intent: 'seasonal',
    priority: 4,
    // Ramadan 1448 begins around 8 February 2027: thirty days before, with a month to write.
    window: { start: '2026-12-01', end: '2027-01-09' },
  },
  {
    title: 'العودة للمدارس: توزيعات وتيشيرتات المدارس والجامعات',
    hub: 'seasons',
    primaryKeyword: 'توزيعات العودة للمدارس',
    secondaryKeywords: ['تيشيرتات الجامعات', 'تيشيرتات المدارس'],
    intent: 'seasonal',
    priority: 3,
    window: { start: '06-15', end: '08-01' },
  },
  {
    title: 'موسم الرياض: كيف تبيع ميرش الفعاليات بدون مخالفة الحقوق',
    hub: 'seasons',
    primaryKeyword: 'ميرش موسم الرياض',
    secondaryKeywords: ['ميرش الفعاليات', 'حقوق الشعارات'],
    intent: 'seasonal',
    priority: 3,
    window: { start: '07-15', end: '09-01' },
  },
  {
    title: 'حفلات التخرج: تيشيرتات وأكواب بالاسم (مايو ويونيو)',
    hub: 'seasons',
    primaryKeyword: 'تيشيرتات التخرج بالاسم',
    secondaryKeywords: ['أكواب التخرج', 'هدايا التخرج'],
    intent: 'seasonal',
    priority: 3,
    window: { start: '03-01', end: '04-15' },
  },
  {
    title: 'الجمعة البيضاء ويوم العلم (11 مارس): تقويم مواسم البيع للمتاجر المطبوعة',
    hub: 'seasons',
    primaryKeyword: 'تقويم مواسم البيع',
    secondaryKeywords: ['الجمعة البيضاء', 'يوم العلم', 'مواسم التسوق في السعودية'],
    intent: 'seasonal',
    priority: 3,
    window: { start: '09-15', end: '11-01' },
  },
];
