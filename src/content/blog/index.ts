import type { BlogPost } from '@/content/schema';

/** BRD 4.13 hubs and the three placeholder posts (titles only; bodies arrive in Phase 1c). */
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
};

export const blogPosts: BlogPost[] = [
  {
    slug: 'start-clothing-brand-saudi-no-factory-no-stock',
    title: 'كيف تبدأ براند ملابس في السعودية بدون مصنع وبدون مخزون',
    hub: 'getting-started',
    sample: true,
  },
  {
    slug: 'what-is-print-on-demand-saudi-examples',
    title: 'ما هي الطباعة عند الطلب؟ شرح مبسط بالأمثلة السعودية',
    hub: 'pod-basics',
    sample: true,
  },
  {
    slug: 'how-to-price-printed-tshirt-saudi',
    title: 'كيف تسعّر تيشيرت مطبوع في السعودية؟',
    hub: 'pricing-profit',
    sample: true,
  },
];
