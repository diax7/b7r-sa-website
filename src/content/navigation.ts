import type { Navigation } from '@/content/schema';

/** BRD 4.3 global elements and 4.5 policy links. Order is RTL start to end. */
export const navigation: Navigation = {
  primary: [
    { label: 'الرئيسية', href: '/' },
    { label: 'المنتجات', href: '/products', matchPrefix: '/products' },
    { label: 'كيف نعمل', href: '/how-it-works' },
    { label: 'من نحن', href: '/about' },
    { label: 'المدونة', href: '/blog', matchPrefix: '/blog' },
    { label: 'تواصل معنا', href: '/contact' },
  ],
  policies: [
    { label: 'الشروط والأحكام', href: '/terms' },
    { label: 'الشحن والتوصيل', href: '/shipping' },
    { label: 'سياسة الخصوصية', href: '/privacy' },
    { label: 'الأسئلة الشائعة', href: '/faq' },
  ],
  ctaLabel: 'ابدأ براندك مجانًا',
  loginLabel: 'تسجيل الدخول',
  skipLinkLabel: 'تخطَّ إلى المحتوى',
  menuOpenLabel: 'فتح القائمة',
  menuCloseLabel: 'إغلاق القائمة',
  menuWhatsappLine: 'تواصل معنا عبر واتساب',
};
