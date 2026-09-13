import type { GlobalConfig } from 'payload';
import { hiddenUnlessAdmin, isAdmin } from '@/modules/cms/access';
import { revalidateGlobal } from '@/modules/cms/hooks/revalidate';

const APP_HELP = {
  ar: 'يجب أن يطابق التطبيق (لا مزامنة آلية).',
  en: 'Must match the app; no automatic sync.',
};

/** BRD 9.4 `site-settings` ⇄ `SiteSettings` in content/schema.ts. Admin only (BRD 9.3). */
export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: { ar: 'إعدادات الموقع', en: 'Site settings' },
  admin: {
    group: { ar: 'الإعدادات', en: 'Settings' },
    hidden: hiddenUnlessAdmin,
    description: {
      ar: 'اسم الموقع، بيانات التواصل، الحسابات الاجتماعية والعرض الترحيبي.',
      en: 'Site name, contact details, social accounts and the welcome offer.',
    },
  },
  access: { read: () => true, update: isAdmin },
  hooks: { afterChange: [revalidateGlobal] },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'brandName',
          type: 'text',
          required: true,
          localized: true,
          label: { ar: 'اسم العلامة', en: 'Brand name' },
        },
        {
          name: 'brandNameLatin',
          type: 'text',
          required: true,
          label: { ar: 'الاسم اللاتيني', en: 'Latin name' },
        },
      ],
    },
    {
      name: 'tagline',
      type: 'text',
      required: true,
      localized: true,
      label: { ar: 'الشعار النصي', en: 'Tagline' },
    },
    {
      name: 'contact',
      type: 'group',
      label: { ar: 'التواصل', en: 'Contact' },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'phone',
              type: 'text',
              required: true,
              label: { ar: 'الهاتف (محلي)', en: 'Phone (local)' },
            },
            {
              name: 'phoneIntl',
              type: 'text',
              required: true,
              label: { ar: 'الهاتف (دولي)', en: 'Phone (intl)' },
            },
            {
              name: 'whatsapp',
              type: 'text',
              required: true,
              label: { ar: 'واتساب (أرقام فقط)', en: 'WhatsApp digits' },
            },
          ],
        },
        {
          name: 'email',
          type: 'email',
          required: true,
          label: { ar: 'البريد الإلكتروني', en: 'Email' },
        },
      ],
    },
    {
      name: 'social',
      type: 'group',
      label: { ar: 'الحسابات', en: 'Social' },
      fields: [
        { name: 'x', type: 'text', required: true, label: 'X' },
        { name: 'instagram', type: 'text', required: true, label: 'Instagram' },
        { name: 'tiktok', type: 'text', required: true, label: 'TikTok' },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'welcomeCredit',
          type: 'number',
          required: true,
          min: 0,
          label: { ar: 'الرصيد الترحيبي (ريال)', en: 'Welcome credit (SAR)' },
          admin: { description: APP_HELP, step: 1 },
        },
        {
          name: 'deliveryMaxDays',
          type: 'number',
          required: true,
          min: 1,
          label: { ar: 'أقصى مدة توصيل (أيام)', en: 'Max delivery days' },
          admin: { description: APP_HELP, step: 1 },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'deliveryOrigin',
          type: 'text',
          required: true,
          localized: true,
          label: { ar: 'مدينة الإنتاج', en: 'Origin city' },
        },
        {
          name: 'deliveryRegion',
          type: 'text',
          required: true,
          localized: true,
          label: { ar: 'المنطقة (للبيانات المنظمة)', en: 'Region (structured data)' },
        },
      ],
    },
    {
      name: 'bookingUrl',
      type: 'text',
      label: { ar: 'رابط حجز الاستشارة (Cal.com)', en: 'Booking URL' },
      admin: {
        description: { ar: 'اتركه فارغاً لاستخدام واتساب', en: 'Leave empty to use WhatsApp' },
      },
    },
    {
      name: 'appUrls',
      type: 'group',
      label: { ar: 'روابط التطبيق', en: 'App URLs' },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'register',
              type: 'text',
              required: true,
              label: { ar: 'التسجيل', en: 'Register' },
            },
            {
              name: 'login',
              type: 'text',
              required: true,
              label: { ar: 'تسجيل الدخول', en: 'Login' },
            },
          ],
        },
      ],
    },
    {
      name: 'legalEntity',
      type: 'text',
      required: true,
      label: { ar: 'الكيان القانوني', en: 'Legal entity' },
    },
  ],
};
