import type { PageSeo } from '@/content/schema';

/** BRD 4.16 rows, verbatim: the seed for the `seo-defaults` global (ADR-026). */
export const seo: PageSeo[] = [
  {
    route: '/compare-printful',
    title: 'بحر برنت مقابل Printful لمتجر سعودي',
    description:
      'مقارنة بالأرقام: الطباعة في جدة والتوصيل خلال 5 أيام مقابل الشحن من الخارج خلال أسابيع؛ الأسعار بالريال وربط سلة وزد.',
    updatedAt: '2026-09-16',
  },
  {
    route: '/',
    title: 'بحر برنت: منصة الطباعة عند الطلب في السعودية',
    description:
      'ابدأ براندك بدون رأس مال أو مخزون. صمّم منتجاتك، اربط متجرك في سلة أو زد أو شوبيفاي، ونحن نطبع في جدة ونشحن باسمك خلال 5 أيام.',
    ogImage: '/og/default.png',
    updatedAt: '2026-09-13',
  },
  {
    route: '/products',
    title: 'منتجات الطباعة عند الطلب',
    description:
      'تيشيرتات، هودي، بربتوز أطفال، وحقائب قماشية تُطبع عند الطلب وتُشحن باسم متجرك. الأسعار تبدأ من 30 ريالاً.',
    updatedAt: '2026-09-13',
  },
  {
    route: '/how-it-works',
    title: 'كيف تعمل الطباعة عند الطلب مع بحر',
    description:
      'خمس خطوات من إنشاء الحساب إلى وصول الطلب لعميلك: صمّم، اربط متجرك، انشر، ونحن نطبع ونشحن باسمك.',
    updatedAt: '2026-09-13',
  },
  {
    route: '/about',
    title: 'من نحن',
    description: 'قصة بحر برنت، أول منصة سعودية للطباعة عند الطلب، من خريجي برنامج Misk Launchpad.',
    updatedAt: '2026-09-13',
  },
  {
    route: '/contact',
    title: 'تواصل معنا',
    description: 'راسلنا على واتساب أو البريد، أو احجز استشارة مجانية لمدة 30 دقيقة.',
    updatedAt: '2026-09-13',
  },
  {
    route: '/faq',
    title: 'الأسئلة الشائعة عن الطباعة عند الطلب',
    description: 'إجابات مباشرة عن التكلفة والربح والتوصيل وربط المتاجر مع بحر برنت.',
    updatedAt: '2026-09-13',
  },
  {
    route: '/blog',
    title: 'مدونة بحر',
    description: 'أدلة عملية لبدء براندك وبيع المنتجات المطبوعة في السعودية.',
    updatedAt: '2026-09-13',
  },
  {
    route: '/terms',
    title: 'الشروط والأحكام',
    description: 'شروط استخدام منصة بحر برنت.',
    updatedAt: '2026-09-13',
  },
  {
    route: '/shipping',
    title: 'الشحن والتوصيل',
    description: 'سياسة الشحن والتوصيل في بحر برنت داخل المملكة.',
    updatedAt: '2026-09-13',
  },
  {
    route: '/privacy',
    title: 'سياسة الخصوصية',
    description: 'كيف نجمع بياناتك ونحميها في بحر برنت.',
    updatedAt: '2026-09-13',
  },
];
