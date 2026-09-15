import type { GlobalConfig } from 'payload';
import { adminField, hiddenUnlessAdmin, isAdmin } from '@/modules/cms/access';
import { revalidateGlobal } from '@/modules/cms/hooks/revalidate';
import { savedByField, stampSavedByGlobal } from '@/modules/cms/fields/saved-by';
import { globalComponents } from '@/modules/cms/admin/document/config';
import { adminGroup } from '@/modules/cms/admin/icons';
import { SEO_DEFAULTS_DESCRIPTIONS } from '@/modules/cms/admin/descriptions/site';
import { describeFields } from '@/modules/cms/admin/descriptions/describe';

/** BRD 9.4 `seo-defaults` ⇄ `content/seo.ts` (per-route titles/descriptions, BRD 4.16). */
export const SeoDefaults: GlobalConfig = {
  slug: 'seo-defaults',
  label: { ar: 'إعدادات البحث', en: 'Search defaults' },
  admin: {
    components: globalComponents('seo-defaults', { localized: true }),
    group: adminGroup('visibility'),
    custom: {
      shows: {
        ar: 'عنوان التبويب ونتيجة Google وبطاقة المشاركة للصفحات الثابتة',
        en: 'the browser tab, the Google result and the share card of the fixed pages',
      },
    },
    hidden: hiddenUnlessAdmin,
    description: {
      ar: 'عناوين ووصف محركات البحث للصفحات الثابتة، وصورة المشاركة الافتراضية.',
      en: 'Search titles and descriptions for the fixed pages, and the default share image.',
    },
  },
  access: { read: () => true, update: isAdmin },
  hooks: { beforeChange: [stampSavedByGlobal], afterChange: [revalidateGlobal] },
  fields: describeFields(
    [
      {
        name: 'titleTemplate',
        type: 'text',
        required: true,
        localized: true,
        label: { ar: 'قالب العنوان', en: 'Title template' },
        admin: { description: { ar: '%s يُستبدل بعنوان الصفحة', en: '%s is the page title' } },
      },
      {
        name: 'routes',
        type: 'array',
        required: true,
        label: { ar: 'الصفحات', en: 'Routes' },
        labels: { singular: { ar: 'صفحة', en: 'Route' }, plural: { ar: 'الصفحات', en: 'Routes' } },
        admin: {
          description: {
            ar: 'العنوان والوصف لكل صفحة ثابتة (BRD 4.16)',
            en: 'Title and description per static route',
          },
        },
        fields: [
          {
            type: 'row',
            fields: [
              {
                name: 'route',
                type: 'text',
                required: true,
                label: { ar: 'المسار', en: 'Route' },
                validate: (value: unknown) =>
                  typeof value === 'string' && value.startsWith('/') ? true : 'المسار يبدأ بـ /',
              },
              {
                name: 'updatedAt',
                type: 'date',
                required: true,
                label: { ar: 'آخر تحديث للمحتوى', en: 'Content updated' },
                admin: {
                  date: { pickerAppearance: 'dayOnly' },
                  description: { ar: 'يظهر في خريطة الموقع', en: 'Used for the sitemap' },
                },
              },
            ],
          },
          {
            name: 'title',
            type: 'text',
            required: true,
            localized: true,
            label: { ar: 'العنوان', en: 'Title' },
            maxLength: 70,
          },
          {
            name: 'description',
            type: 'textarea',
            required: true,
            localized: true,
            label: { ar: 'الوصف', en: 'Description' },
            maxLength: 160,
            admin: {
              description: { ar: '155 حرفاً كحد أقصى للأفضل', en: 'Aim for ≤ 155 characters' },
            },
          },
          {
            name: 'ogImage',
            type: 'text',
            label: { ar: 'صورة المشاركة (اختياري)', en: 'OG image (optional)' },
          },
        ],
      },
      {
        name: 'verification',
        type: 'group',
        label: { ar: 'رموز التحقق (للمدير فقط)', en: 'Verification tokens (admin only)' },
        access: { read: adminField, update: adminField },
        admin: {
          description: {
            ar: 'اختياري: تُقرأ من متغيرات البيئة عند تركها فارغة.',
            en: 'Optional: env variables are used when empty.',
          },
        },
        fields: [
          { name: 'google', type: 'text', label: 'Google Search Console' },
          { name: 'bing', type: 'text', label: 'Bing Webmaster Tools' },
        ],
      },
      savedByField,
    ],
    SEO_DEFAULTS_DESCRIPTIONS,
  ),
};
