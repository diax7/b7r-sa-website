import type { BlogPost } from '@/content/schema';

/** BRD 4.13 hubs (filters in Level 1, routes in Level 3). */
export const blogHubs = [
  { slug: 'getting-started', name: 'البداية' },
  { slug: 'pod-basics', name: 'أساسيات الطباعة عند الطلب' },
  { slug: 'salla-zid-shopify', name: 'سلة وزد وشوبيفاي' },
  { slug: 'design', name: 'التصميم' },
  { slug: 'pricing-profit', name: 'التسعير والربح' },
  { slug: 'seasons', name: 'المواسم' },
];

export const blogCopy = {
  title: 'مدونة بحر',
  lead: 'أدلة عملية لبدء براندك وبيع منتجاتك المطبوعة في السعودية.',
  metaTemplate: 'كتبه ضياء · {date} · {n} دقائق قراءة',
  takeawaysTitle: 'أهم النقاط',
  relatedTitle: 'مقالات ذات صلة',
  share: 'شارك',
  inPostCta: {
    title: 'ابدأ براندك اليوم',
    text: 'بدون رأس مال وبدون مخزون.',
    button: 'ابدأ براندك مجانًا',
  },
  author: { name: 'ضياء', role: 'مؤسس بحر برنت' },
  // TODO(copy): not in BRD 4.13; listed in Appendix G for Dhia
  allHubs: 'الكل',
  // TODO(copy): not in BRD 4.13; listed in Appendix G for Dhia
  emptyHub: 'لا مقالات في هذا القسم بعد.',
  // TODO(copy): not in BRD 4.13 (plan 1c §D; «تم النسخ» avoided per 4.1)
  copied: 'نُسخ الرابط',
};

/**
 * The three Level 1 placeholder posts (BRD 4.13, ADR-018). Titles are the BRD's; excerpts,
 * takeaways and the bodies in `posts/*.md` are agent-written samples under BRD 4.1 with
 * facts from BRD 1.1 only, marked `sample: true` and listed for Dhia's review.
 */
export const blogPosts: BlogPost[] = [
  {
    slug: 'start-clothing-brand-saudi-no-factory-no-stock',
    title: 'كيف تبدأ براند ملابس في السعودية بدون مصنع وبدون مخزون',
    hub: 'getting-started',
    sample: true,
    excerpt: 'ثلاثة أشياء تكفي للبداية: اسم، تصميم واحد، ومتجر. الباقي يحدث بعد أول طلب.',
    cover: '/images/lifestyle/cover-start-brand.jpg',
    publishedAt: '2026-09-13',
    updatedAt: '2026-09-13',
    takeaways: [
      'تبيع القطعة قبل أن تُطبع، فلا تدفع إلا تكلفة ما بيع فعلاً.',
      'تحتاج اسماً وتصميماً واحداً ومتجراً على سلة أو زد أو شوبيفاي.',
      'التيشيرت الأساسي أفضل بداية: تكلفة 45 ريالاً وسعر مقترح 89 ريالاً.',
    ],
    author: 'ضياء',
  },
  {
    slug: 'what-is-print-on-demand-saudi-examples',
    title: 'ما هي الطباعة عند الطلب؟ شرح مبسط بالأمثلة السعودية',
    hub: 'pod-basics',
    sample: true,
    excerpt: 'لا تُطبع القطعة إلا بعد أن يشتريها عميلك. مثال كامل من الطلب إلى الشحن.',
    cover: '/images/lifestyle/cover-print-on-demand.jpg',
    publishedAt: '2026-09-13',
    updatedAt: '2026-09-13',
    takeaways: [
      'لا مخزون ولا حد أدنى: تدفع تكلفة قطعة واحدة عند كل عملية بيع.',
      'الطلب يصل تلقائياً من متجرك، ونطبعه في جدة ونشحنه باسمك خلال 5 أيام.',
      'خمسة منتجات بمنطقة طباعة أمامية 28 × 38 سم.',
    ],
    author: 'ضياء',
  },
  {
    slug: 'how-to-price-printed-tshirt-saudi',
    title: 'كيف تسعّر تيشيرت مطبوع في السعودية؟',
    hub: 'pricing-profit',
    sample: true,
    excerpt: 'ابدأ من التكلفة الأساسية، أضف الشحن والضريبة، ثم حدد هامشاً يستحق الجهد.',
    cover: '/images/lifestyle/cover-pricing.jpg',
    publishedAt: '2026-09-13',
    updatedAt: '2026-09-13',
    takeaways: [
      'التكلفة الأساسية تشمل المنتج والطباعة والتغليف، لا الشحن والضريبة.',
      'السعر المقترح للتيشيرت الأساسي 89 ريالاً، أي ربح تقديري 44 ريالاً للقطعة.',
      'اختبر السعر أسبوعين قبل أن تغيّره، والخصومات الدائمة تعلّم عميلك الانتظار.',
    ],
    author: 'ضياء',
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}

export function hubName(slug: string): string {
  return blogHubs.find((h) => h.slug === slug)?.name ?? slug;
}
