import type { Home } from '@/content/schema';

/**
 * BRD 4.4 homepage copy, verbatim. Placeholder hero photos per BRD 6.4.1: slides 1 and 3 use
 * set A, slides 2 and 4 use set B, until Dhia supplies the final four photographs.
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
    slideIndicatorAria: 'الشريحة {n} من 4',
    pauseAria: 'إيقاف التبديل التلقائي',
    resumeAria: 'استئناف التبديل التلقائي',
  },
  productStrip: {
    eyebrow: 'المنتجات',
    title: 'بحر من المنتجات',
    lead: 'بِعها في متجرك بدون أي مخزون.',
    pricePrefix: 'يبدأ من',
    button: 'تصفح كل المنتجات',
    order: ['tee-essential', 'hoodie', 'tee-oversize', 'tote-bag', 'baby-onesie'],
    swipeHint: 'اسحب',
  },
  designer: {
    eyebrow: 'جرّب بنفسك',
    title: 'شاهد تصميمك واحسب ربحك',
    lead: 'ارفع تصميمك، حرّكه على المنتج، وحدّد سعرك.',
    groups: { product: 'المنتج', pricing: 'التسعير' },
    // TODO(copy): Appendix G — the print area is the upload target (Dhia, 2026-09-13).
    uploadPrompt: 'اضغط لرفع شعارك أو صورتك',
    uploadHelper: 'PNG أو JPG أو SVG، حتى 10 ميجابايت',
    sample: 'جرّب تصميماً جاهزاً',
    // TODO(copy): Appendix G — the «×» that clears the placed design.
    removeAria: 'إزالة التصميم',
    canvasHint: 'اسحب التصميم لتحريكه، واستخدم الزوايا لتغيير الحجم.',
    baseCostLabel: 'التكلفة من بحر',
    sellPriceLabel: 'سعر البيع في متجرك',
    suggestedPriceHelper: 'السعر المقترح',
    dailySalesLabel: 'مبيعات يومية',
    perPieceLabel: 'ربحك لكل قطعة',
    monthlyLabel: 'ربحك الشهري التقديري',
    negativeWarning: 'سعر البيع أقل من التكلفة. ارفع السعر لتربح.',
    footnote: 'تقدير لا يشمل الشحن والضريبة.',
    cta: 'ابدأ بيع هذا المنتج',
    fileError: 'الملف غير مدعوم أو أكبر من 10 ميجابايت.',
  },
  steps: { eyebrow: 'كيف نعمل', title: 'ثلاث خطوات وتبدأ', link: 'اعرف أكثر عن طريقة العمل' },
  video: {
    title: 'شاهد كيف نطبع طلبك',
    lead: 'من ملف التصميم إلى الطرد الجاهز، كل شيء يتم عندنا في جدة.',
  },
  whyUs: { eyebrow: 'لماذا بحر', title: 'لماذا يختارنا التجار؟' },
  testimonials: { eyebrow: 'آراء التجار', title: 'تجار بدأوا معنا', placeholderTag: 'نموذج' },
  integrations: {
    title: 'اربط متجرك بضغطة واحدة',
    lead: 'الطلبات تتزامن تلقائياً من متجرك إلى بحر.',
    availableTag: 'متاح الآن',
    tileAria: 'ربط متجر {platform}',
  },
  faq: { title: 'الأسئلة الشائعة', link: 'كل الأسئلة' },
  ribbon: {
    title: 'ابدأ اليوم واحصل على 30 ريالاً رصيداً ترحيبياً',
    lead: 'سجّل مجاناً بدون بطاقة، وأطلق أول منتج خلال دقائق.',
    button: 'ابدأ براندك مجانًا',
  },
};
