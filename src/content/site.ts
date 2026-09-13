import type { SiteSettings } from '@/content/schema';

/** BRD 1.1 facts. Every number here is displayed from this single object. */
export const site: SiteSettings = {
  brandName: 'بحر برنت',
  brandNameLatin: 'B7R Print',
  tagline: 'منصة الطباعة عند الطلب في السعودية',
  contact: {
    phone: '0501699572',
    phoneIntl: '+966501699572',
    whatsapp: '966501699572',
    email: 'contact@b7r.sa',
  },
  social: {
    x: 'https://x.com/b7rprint',
    instagram: 'https://instagram.com/b7rprint',
    tiktok: 'https://tiktok.com/@b7rprint',
  },
  offer: { welcomeCredit: 30 },
  delivery: { maxDays: 5, origin: 'جدة', region: 'منطقة مكة المكرمة' },
  appUrls: {
    register: 'https://b7r.app/register',
    login: 'https://b7r.app/login',
  },
  legalEntity: 'B7R Print Company',
};
