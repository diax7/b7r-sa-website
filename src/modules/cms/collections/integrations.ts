import type { CollectionConfig } from 'payload';
import { INTEGRATION_PLATFORMS } from '@/content/schema';
import { isAdmin, isEditorOrAdmin } from '@/modules/cms/access';
import { revalidateRoutes } from '@/modules/cms/hooks/revalidate';

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
          admin: { description: { ar: 'يحدد الشعار', en: 'Selects the logo' } },
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
  ],
};
