import type { CollectionConfig } from 'payload';
import { INTEGRATION_PLATFORMS } from '@/content/schema';
import { isAdmin, isEditorOrAdmin } from '@/modules/cms/access';
import { revalidateRoutes } from '@/modules/cms/hooks/revalidate';
import { savedByField, stampSavedBy } from '@/modules/cms/fields/saved-by';

/**
 * Integration tiles (BRD 4.4, 6.4.8): one document per platform. The logo is a brand SVG
 * kept in the code (the media library refuses SVG on purpose), so the platform is a fixed
 * choice and a new platform is a deploy; the name and order are content.
 */
export const Integrations: CollectionConfig = {
  slug: 'integrations',
  labels: {
    singular: { ar: 'منصة متاجر', en: 'Integration' },
    plural: { ar: 'المتاجر المتصلة', en: 'Integrations' },
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'platform', 'order'],
    listSearchableFields: ['name'],
    group: { ar: 'المحتوى', en: 'Content' },
    description: {
      ar: 'المنصات المتصلة (سلة، زد، شوبيفاي) وترتيبها في شريط التكاملات.',
      en: 'Connected platforms (Salla, Zid, Shopify) and their order in the integrations strip.',
    },
  },
  access: {
    read: () => true,
    create: isAdmin,
    update: isEditorOrAdmin,
    delete: isAdmin,
  },
  hooks: {
    beforeChange: [stampSavedBy],
    afterChange: [revalidateRoutes(['/'])],
    afterDelete: [revalidateRoutes(['/'])],
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'platform',
          type: 'select',
          required: true,
          unique: true,
          options: INTEGRATION_PLATFORMS.map((p) => ({ label: p, value: p })),
          label: { ar: 'المنصة', en: 'Platform' },
          admin: {
            description: {
              ar: 'يحدد الشعار الذي يظهر في الموقع',
              en: 'Selects the logo shown on the site',
            },
            components: { Field: '@/modules/cms/admin/fields/platform-select#PlatformSelect' },
          },
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
      type: 'row',
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
          localized: true,
          label: { ar: 'الاسم', en: 'Name' },
        },
        {
          name: 'nameLatin',
          type: 'text',
          required: true,
          label: { ar: 'الاسم اللاتيني', en: 'Latin name' },
        },
      ],
    },
    savedByField,
  ],
};
