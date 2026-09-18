import type { GlobalConfig, PayloadRequest } from 'payload';
import { adminField, hiddenUnlessAdmin, isAdmin } from '@/modules/cms/access';
import { revalidateGlobal } from '@/modules/cms/hooks/revalidate';
import { inLanguage } from '@/modules/cms/fields/message';
import { applyGlobalTranslations } from '@/modules/cms/hooks/translations';
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
    hideAPIURL: true,
    components: globalComponents('seo-defaults'),
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
  hooks: {
    beforeChange: [stampSavedByGlobal],
    afterChange: [revalidateGlobal, applyGlobalTranslations],
  },
  fields: describeFields(
    [
      {
        name: 'titleTemplate',
        type: 'text',
        required: true,
        localized: true,
        label: { ar: 'قالب العنوان', en: 'Title template' },
      },
      {
        name: 'routes',
        type: 'array',
        required: true,
        label: { ar: 'الصفحات الثابتة', en: 'Fixed pages' },
        labels: {
          singular: { ar: 'صفحة', en: 'Page' },
          plural: { ar: 'الصفحات الثابتة', en: 'Fixed pages' },
        },
        fields: [
          {
            type: 'row',
            fields: [
              {
                name: 'route',
                type: 'text',
                required: true,
                label: { ar: 'المسار', en: 'Path' },
                validate: (value: unknown, { req }: { req: PayloadRequest }) =>
                  typeof value === 'string' && value.startsWith('/')
                    ? true
                    : inLanguage(req, { ar: 'المسار يبدأ بـ /', en: 'The path starts with /' }),
              },
              {
                name: 'updatedAt',
                type: 'date',
                required: true,
                label: { ar: 'آخر تحديث للمحتوى', en: 'Content updated' },
                admin: { date: { pickerAppearance: 'dayOnly' } },
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
          },
          {
            name: 'ogImage',
            type: 'text',
            label: { ar: 'صورة المشاركة (اختياري)', en: 'Share image (optional)' },
          },
        ],
      },
      {
        name: 'verification',
        type: 'group',
        label: { ar: 'رموز التحقق', en: 'Verification tokens' },
        access: { read: adminField, update: adminField },
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
