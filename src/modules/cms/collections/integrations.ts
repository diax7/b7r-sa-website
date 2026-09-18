import type { CollectionConfig } from 'payload';
import { INTEGRATION_PLATFORMS } from '@/content/schema';
import { isAdmin, isEditorOrAdmin } from '@/modules/cms/access';
import { revalidateRoutes } from '@/modules/cms/hooks/revalidate';
import type { Bilingual } from '@/modules/cms/fields/message';
import { savedByField, stampSavedBy } from '@/modules/cms/fields/saved-by';
import { collectionComponents } from '@/modules/cms/admin/document/config';
import { adminGroup } from '@/modules/cms/admin/icons';
import { INTEGRATION_DESCRIPTIONS } from '@/modules/cms/admin/descriptions/catalogue';
import { describeFields } from '@/modules/cms/admin/descriptions/describe';

/** The platforms as a visitor reads them; the value picks the brand SVG that ships with the site. */
export const PLATFORM_LABELS: Record<(typeof INTEGRATION_PLATFORMS)[number], Bilingual> = {
  salla: { ar: 'سلة', en: 'Salla' },
  zid: { ar: 'زد', en: 'Zid' },
  shopify: { ar: 'شوبيفاي', en: 'Shopify' },
};

/**
 * The connected stores (BRD 4.4, 6.4.8): one document per platform. The logo is a brand SVG
 * kept in the code (the image library refuses SVG on purpose), so the platform is a fixed
 * choice and a new platform is a deploy; the name and order are content.
 */
export const Integrations: CollectionConfig = {
  slug: 'integrations',
  labels: {
    singular: { ar: 'منصة متاجر', en: 'Store platform' },
    plural: { ar: 'المتاجر المتصلة', en: 'Connected stores' },
  },
  admin: {
    hideAPIURL: true,
    components: collectionComponents('integrations', { localized: true }),
    useAsTitle: 'name',
    defaultColumns: ['name', 'platform', 'order'],
    listSearchableFields: ['name'],
    group: adminGroup('catalogue'),
    custom: {
      shows: {
        ar: 'قسم المتاجر المتصلة في الصفحة الرئيسية',
        en: 'the connected-stores section of the home page',
      },
    },
    description: {
      ar: 'المنصات المتصلة (سلة، زد، شوبيفاي) وترتيبها في قسم المتاجر المتصلة.',
      en: 'The connected platforms (Salla, Zid, Shopify) and their order in the connected-stores section.',
    },
  },
  defaultSort: 'order',
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
  fields: describeFields(
    [
      {
        type: 'row',
        fields: [
          {
            name: 'platform',
            type: 'select',
            required: true,
            unique: true,
            options: INTEGRATION_PLATFORMS.map((p) => ({ label: PLATFORM_LABELS[p], value: p })),
            label: { ar: 'المنصة', en: 'Platform' },
            admin: {
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
    INTEGRATION_DESCRIPTIONS,
  ),
};
