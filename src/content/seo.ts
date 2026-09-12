import type { PageSeo } from '@/content/schema';

/** BRD 4.16. The template appends « | بحر برنت» except on the home page. */
export const seo: PageSeo[] = [
  {
    route: '/',
    title: 'بحر برنت: منصة الطباعة عند الطلب في السعودية',
    description:
      'ابدأ براندك بدون رأس مال أو مخزون. صمّم منتجاتك، اربط متجرك في سلة أو زد أو شوبيفاي، ونحن نطبع في جدة ونشحن باسمك خلال 5 أيام.',
    ogImage: '/og/default.png',
  },
  {
    route: '/products',
    title: 'منتجات الطباعة عند الطلب',
    description:
      'تيشيرتات، هودي، بربتوز أطفال، وحقائب قماشية تُطبع عند الطلب وتُشحن باسم متجرك. الأسعار تبدأ من 30 ريالاً.',
  },
  {
    route: '/how-it-works',
    title: 'كيف تعمل الطباعة عند الطلب مع بحر',
    description:
      'خمس خطوات من إنشاء الحساب إلى وصول الطلب لعميلك: صمّم، اربط متجرك، انشر، ونحن نطبع ونشحن باسمك.',
  },
  {
    route: '/about',
    title: 'من نحن',
    description: 'قصة بحر برنت، أول منصة سعودية للطباعة عند الطلب، من خريجي برنامج Misk Launchpad.',
  },
  {
    route: '/contact',
    title: 'تواصل معنا',
    description: 'راسلنا على واتساب أو البريد، أو احجز استشارة مجانية لمدة 30 دقيقة.',
  },
  {
    route: '/faq',
    title: 'الأسئلة الشائعة عن الطباعة عند الطلب',
    description: 'إجابات مباشرة عن التكلفة والربح والتوصيل وربط المتاجر مع بحر برنت.',
  },
  {
    route: '/blog',
    title: 'مدونة بحر',
    description: 'أدلة عملية لبدء براندك وبيع المنتجات المطبوعة في السعودية.',
  },
  { route: '/terms', title: 'الشروط والأحكام', description: 'شروط استخدام منصة بحر برنت.' },
  {
    route: '/shipping',
    title: 'الشحن والتوصيل',
    description: 'سياسة الشحن والتوصيل في بحر برنت داخل المملكة.',
  },
  {
    route: '/privacy',
    title: 'سياسة الخصوصية',
    description: 'كيف نجمع بياناتك ونحميها في بحر برنت.',
  },
];

export const SEO_TITLE_TEMPLATE = '%s | بحر برنت';

export function getSeo(route: string): PageSeo {
  const entry = seo.find((s) => s.route === route);
  if (!entry) throw new Error(`No SEO entry for route ${route}; add it to content/seo.ts`);
  return entry;
}
