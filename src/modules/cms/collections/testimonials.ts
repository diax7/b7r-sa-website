import type { CollectionConfig } from 'payload';
import { canDeleteVersioned, isEditorOrAdmin, publishedOrStaff } from '@/modules/cms/access';
import { revalidateRoutes } from '@/modules/cms/hooks/revalidate';
import { savedByField, stampSavedBy } from '@/modules/cms/fields/saved-by';
import { collectionComponents } from '@/modules/cms/admin/document/config';
import { adminGroup } from '@/modules/cms/admin/icons';
import { TESTIMONIAL_DESCRIPTIONS } from '@/modules/cms/admin/descriptions/catalogue';
import { describeFields } from '@/modules/cms/admin/descriptions/describe';

/**
 * Merchant testimonials (BRD 4.4, 6.4.7). Drafts so a quote can be prepared before it goes
 * live; `placeholder` keeps the BRD 3.14 rule visible in the admin, while every published
 * entry is a placeholder the production host omits the section (ADR-013, ADR-023).
 */
export const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  labels: {
    singular: { ar: 'رأي تاجر', en: 'Testimonial' },
    plural: { ar: 'آراء التجار', en: 'Testimonials' },
  },
  admin: {
    components: collectionComponents('testimonials', { localized: true }),
    useAsTitle: 'name',
    defaultColumns: ['name', 'store', 'placeholder', 'order', '_status'],
    listSearchableFields: ['name', 'store'],
    group: adminGroup('catalogue'),
    custom: {
      shows: {
        ar: 'قسم آراء التجار في الصفحة الرئيسية',
        en: 'the testimonials section of the home page',
      },
    },
    description: {
      ar: 'آراء التجار في الصفحة الرئيسية. النماذج المؤقتة لا تظهر في الموقع.',
      en: 'Merchant quotes on the home page. Placeholders never show on the site.',
    },
  },
  versions: { drafts: { autosave: { interval: 1500 }, schedulePublish: true }, maxPerDoc: 10 },
  access: {
    read: publishedOrStaff,
    create: isEditorOrAdmin,
    update: isEditorOrAdmin,
    delete: canDeleteVersioned,
  },
  hooks: {
    beforeChange: [stampSavedBy],
    afterChange: [revalidateRoutes(['/'])],
    afterDelete: [revalidateRoutes(['/'])],
  },
  fields: describeFields(
    [
      {
        name: 'quote',
        type: 'textarea',
        required: true,
        localized: true,
        label: { ar: 'الاقتباس', en: 'Quote' },
      },
      {
        type: 'row',
        fields: [
          {
            name: 'name',
            type: 'text',
            required: true,
            localized: true,
            label: { ar: 'اسم التاجر', en: 'Name' },
          },
          {
            name: 'store',
            type: 'text',
            required: true,
            localized: true,
            label: { ar: 'المتجر', en: 'Store' },
          },
        ],
      },
      {
        type: 'row',
        fields: [
          {
            name: 'avatar',
            type: 'upload',
            relationTo: 'media',
            label: { ar: 'الصورة (اختياري)', en: 'Avatar (optional)' },
          },
          {
            name: 'order',
            type: 'number',
            required: true,
            defaultValue: 1,
            label: { ar: 'الترتيب', en: 'Order' },
            admin: { step: 1 },
          },
        ],
      },
      {
        name: 'placeholder',
        type: 'checkbox',
        defaultValue: false,
        label: { ar: 'نموذج (ليس رأي تاجر حقيقي)', en: 'Placeholder (not a real merchant)' },
        admin: {
          description: {
            ar: 'النماذج تظهر بشارة «نموذج» في المعاينة وتُخفى على b7r.sa حتى يُنشر رأي حقيقي.',
            en: 'Placeholders show a «sample» badge on previews and are omitted on b7r.sa until a real entry exists.',
          },
        },
      },
      savedByField,
    ],
    TESTIMONIAL_DESCRIPTIONS,
  ),
};
