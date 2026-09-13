import type { Home } from '@/content/schema';

/**
 * BRD 4.4 homepage copy, verbatim: the seed for the `home` global (ADR-026) and the shape
 * the verbatim test checks. Placeholder hero photos per BRD 6.4.1: slides 1 and 3 use set A,
 * slides 2 and 4 use set B, until Dhia supplies the final four photographs. Interface
 * strings live in `src/messages/ar.json` (ADR-031).
 */
export const home: Home = {
  hero: {
    slides: [
      {
        id: 'brand-from-one-piece',
        headline: 'علامتك التجارية تبدأ من قطعة واحدة',
        subline: 'صمّمها وبِعها، ونحن نطبع ونشحن باسمك.',
        imageDesktop: '/images/hero/set-a-desktop.jpg',
        imageMobile: '/images/hero/set-a-mobile.jpg',
        alt: 'شاب يرتدي تيشيرت أسود مطبوعاً بشعار بحر برنت، وبجانبه حقيبة قماشية وقبعة وهودي',
      },
      {
        id: 'no-capital-no-stock',
        headline: 'بدون رأس مال، بدون مخزون',
        subline: 'نطبع فقط عند وصول الطلب، وتربح من أول قطعة.',
        imageDesktop: '/images/hero/set-b-desktop.jpg',
        imageMobile: '/images/hero/set-b-mobile.jpg',
        alt: 'شاب يرتدي هودي أبيض مطبوعاً بعبارة تصميمك هنا، وبجانبه حقيبة قماشية وقبعة وتيشيرت',
      },
      {
        id: 'jeddah-to-kingdom',
        headline: 'من جدة إلى كل المملكة خلال 5 أيام',
        subline: 'إنتاج محلي وشحن سريع، بدون جمارك ولا انتظار.',
        imageDesktop: '/images/hero/set-a-desktop.jpg',
        imageMobile: '/images/hero/set-a-mobile.jpg',
        alt: 'شاب يرتدي تيشيرت أسود مطبوعاً بشعار بحر برنت، وبجانبه حقيبة قماشية وقبعة وهودي',
      },
      {
        id: 'connect-salla-zid',
        headline: 'متجرك في سلة أو زد؟ اربطه بضغطة',
        subline: 'الطلبات تصلنا تلقائياً، وتوصل عميلك باسم متجرك.',
        imageDesktop: '/images/hero/set-b-desktop.jpg',
        imageMobile: '/images/hero/set-b-mobile.jpg',
        alt: 'شاب يرتدي هودي أبيض مطبوعاً بعبارة تصميمك هنا، وبجانبه حقيبة قماشية وقبعة وتيشيرت',
      },
    ],
    primaryCta: 'ابدأ براندك مجانًا',
    secondaryCta: 'استكشف المنتجات',
    microcopy: 'رصيد ترحيبي 30 ريالاً، بدون بطاقة',
    chips: ['مجاني 100%', 'بدون حد أدنى للطلبات', 'توصيل لكل المملكة خلال 5 أيام'],
  },
  productStrip: {
    eyebrow: 'المنتجات',
    title: 'بحر من المنتجات',
    lead: 'بِعها في متجرك بدون أي مخزون.',
    pricePrefix: 'يبدأ من',
    button: 'تصفح كل المنتجات',
    order: ['tee-essential', 'hoodie', 'tee-oversize', 'tote-bag', 'baby-onesie'],
  },
  designer: {
    eyebrow: 'جرّب بنفسك',
    title: 'شاهد تصميمك واحسب ربحك',
    lead: 'ارفع تصميمك، حرّكه على المنتج، وحدّد سعرك.',
    cta: 'ابدأ بيع هذا المنتج',
  },
  steps: {
    enabled: true,
    eyebrow: 'كيف نعمل',
    title: 'ثلاث خطوات وتبدأ',
    link: 'اعرف أكثر عن طريقة العمل',
    items: [
      {
        order: 1,
        title: 'صمّم منتجك',
        text: 'ارفع تصميمك وشاهده على المنتج فوراً.',
        icon: '/images/icons-3d/tee-plus-create-product.jpg',
      },
      {
        order: 2,
        title: 'اربط متجرك',
        text: 'سلة أو زد أو شوبيفاي بضغطة واحدة.',
        icon: '/images/icons-3d/laptop-link-connect-store.jpg',
      },
      {
        order: 3,
        title: 'نطبع ونشحن',
        text: 'كل طلب يصلنا تلقائياً ويوصل عميلك باسم متجرك.',
        icon: '/images/icons-3d/printer-print.jpg',
      },
    ],
  },
  video: {
    enabled: true,
    title: 'شاهد كيف نطبع طلبك',
    lead: 'من ملف التصميم إلى الطرد الجاهز، كل شيء يتم عندنا في جدة.',
  },
  whyUs: {
    enabled: true,
    eyebrow: 'لماذا بحر',
    title: 'لماذا يختارنا التجار؟',
    items: [
      {
        icon: 'ShieldCheck',
        title: 'بدون مخاطرة',
        text: 'صفر رأس مال، صفر مخزون، بدون حد أدنى للطلبات.',
      },
      {
        icon: 'Workflow',
        title: 'كل شيء تلقائي',
        text: 'الطلبات تتزامن من متجرك وتُنفّذ بدون تدخل منك.',
      },
      {
        icon: 'Zap',
        title: 'جودة محلية وسريعة',
        text: 'طباعة في جدة وتوصيل لكل المملكة خلال 5 أيام.',
      },
    ],
  },
  testimonials: { enabled: true, eyebrow: 'آراء التجار', title: 'تجار بدأوا معنا' },
  integrations: {
    enabled: true,
    title: 'اربط متجرك بضغطة واحدة',
    lead: 'الطلبات تتزامن تلقائياً من متجرك إلى بحر.',
  },
  faq: { enabled: true, title: 'الأسئلة الشائعة', link: 'كل الأسئلة' },
  ribbon: {
    title: 'ابدأ اليوم واحصل على 30 ريالاً رصيداً ترحيبياً',
    lead: 'سجّل مجاناً بدون بطاقة، وأطلق أول منتج خلال دقائق.',
    button: 'ابدأ براندك مجانًا',
  },
};
