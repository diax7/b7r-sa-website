import type { CollectionConfig, PayloadRequest } from 'payload';
import { canDeleteVersioned, isEditorOrAdmin, publishedOrStaff } from '@/modules/cms/access';
import { revalidateProducts } from '@/modules/cms/hooks/revalidate';
import { inLanguage } from '@/modules/cms/fields/message';
import { applyTranslations } from '@/modules/cms/hooks/translations';
import { savedByField, stampSavedBy } from '@/modules/cms/fields/saved-by';
import { PRINT_AREA_LABEL_EN, PRINT_METHOD_EN } from '@/content/seed/en/products';
import { PRINT_AREA_LABEL, PRINT_METHOD } from '@/content/seed/products';
import { localePath, requestLocale } from '@/lib/i18n';
import { previewUrl } from '@/lib/preview-token';
import { collectionComponents } from '@/modules/cms/admin/document/config';
import { adminGroup, sectionIcon } from '@/modules/cms/admin/icons';
import { PRODUCT_DESCRIPTIONS } from '@/modules/cms/admin/descriptions/catalogue';
import { describeFields } from '@/modules/cms/admin/descriptions/describe';

type Validation = { req: PayloadRequest; siblingData: Record<string, unknown> };

/**
 * Products (BRD 9.4, Appendix A): one document per product, fields 1:1 with the Level 1
 * `Product` contract, drafts with autosave, published-only public reads.
 */
export const Products: CollectionConfig = {
  slug: 'products',
  labels: { singular: { ar: 'منتج', en: 'Product' }, plural: { ar: 'المنتجات', en: 'Products' } },
  admin: {
    hideAPIURL: true,
    components: collectionComponents('products'),
    useAsTitle: 'name',
    preview: (doc, { req, locale }) =>
      typeof doc['slug'] === 'string' && doc['slug']
        ? previewUrl(
            req.payload.config.serverURL,
            localePath(requestLocale(locale), `/products/${doc['slug']}`),
            req.payload.secret,
          )
        : null,
    defaultColumns: ['name', 'slug', 'baseCost', 'suggestedPrice', 'sortOrder', '_status'],
    listSearchableFields: ['name', 'slug'],
    group: adminGroup('catalogue'),
    custom: {
      shows: {
        ar: 'صفحة المنتجات، وصفحة كل منتج، والمصمّم، والحاسبة، وملف llms.txt',
        en: "b7r.sa/products, each product's page, the designer, the calculator and llms.txt",
      },
    },
    description: {
      ar: 'المنتجات المعروضة في الموقع والمصمّم: الأسعار، الصور، المقاسات والألوان.',
      en: 'Products on the site and in the designer: prices, photos, sizes and colours.',
    },
  },
  versions: { drafts: { autosave: { interval: 1500 }, schedulePublish: true }, maxPerDoc: 50 },
  defaultSort: 'sortOrder',
  access: {
    read: publishedOrStaff,
    create: isEditorOrAdmin,
    update: isEditorOrAdmin,
    delete: canDeleteVersioned,
  },
  hooks: {
    beforeChange: [stampSavedBy],
    afterChange: [revalidateProducts, applyTranslations],
    afterDelete: [revalidateProducts],
  },
  fields: describeFields(
    [
      {
        type: 'tabs',
        tabs: [
          {
            label: { ar: 'الصور والألوان', en: 'Photos & colours' },
            admin: sectionIcon('photos'),
            fields: [
              {
                name: 'colors',
                type: 'array',
                required: true,
                minRows: 1,
                label: { ar: 'الألوان', en: 'Colours' },
                labels: {
                  singular: { ar: 'لون', en: 'Colour' },
                  plural: { ar: 'الألوان', en: 'Colours' },
                },
                fields: [
                  {
                    type: 'row',
                    fields: [
                      {
                        name: 'slug',
                        type: 'text',
                        required: true,
                        label: { ar: 'معرّف اللون', en: 'Colour id' },
                      },
                      {
                        name: 'name',
                        type: 'text',
                        required: true,
                        localized: true,
                        label: { ar: 'اسم اللون', en: 'Name' },
                      },
                      {
                        name: 'hex',
                        type: 'text',
                        required: true,
                        label: { ar: 'اللون (hex)', en: 'Hex' },
                        validate: (value: unknown, { req }: Validation) =>
                          typeof value === 'string' && /^#[0-9A-Fa-f]{6}$/.test(value)
                            ? true
                            : inLanguage(req, {
                                ar: 'لون بصيغة #FFFFFF',
                                en: 'A colour written as #FFFFFF',
                              }),
                      },
                    ],
                  },
                  {
                    type: 'row',
                    fields: [
                      {
                        name: 'front',
                        type: 'upload',
                        relationTo: 'media',
                        required: true,
                        label: { ar: 'صورة الواجهة الأمامية', en: 'Front photo' },
                      },
                      {
                        name: 'back',
                        type: 'upload',
                        relationTo: 'media',
                        label: { ar: 'صورة الواجهة الخلفية', en: 'Back photo' },
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            label: { ar: 'الأساسيات', en: 'Basics' },
            admin: sectionIcon('basics'),
            fields: [
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
                    name: 'slug',
                    type: 'text',
                    required: true,
                    unique: true,
                    index: true,
                    label: { ar: 'المعرّف في الرابط (slug)', en: 'Address ending (slug)' },
                    validate: (value: unknown, { req }: Validation) =>
                      typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
                        ? true
                        : inLanguage(req, {
                            ar: 'حروف لاتينية صغيرة وأرقام وشرطات فقط',
                            en: 'Lowercase letters, digits and hyphens only',
                          }),
                  },
                ],
              },
              {
                name: 'shortDescription',
                type: 'textarea',
                required: true,
                localized: true,
                label: { ar: 'الوصف المختصر', en: 'Short description' },
              },
              {
                name: 'description',
                type: 'textarea',
                required: true,
                localized: true,
                label: { ar: 'الوصف الكامل', en: 'Description' },
              },
              {
                type: 'row',
                fields: [
                  {
                    name: 'baseCost',
                    type: 'number',
                    required: true,
                    min: 1,
                    label: { ar: 'التكلفة الأساسية (ريال)', en: 'Base cost (SAR)' },
                    admin: { step: 1 },
                  },
                  {
                    name: 'suggestedPrice',
                    type: 'number',
                    required: true,
                    min: 1,
                    label: { ar: 'سعر البيع المقترح (ريال)', en: 'Suggested price (SAR)' },
                    admin: { step: 1 },
                    validate: (value: unknown, { req, siblingData }: Validation) => {
                      const base = siblingData['baseCost'];
                      if (typeof value === 'number' && typeof base === 'number' && value < base) {
                        return inLanguage(req, {
                          ar: 'سعر البيع المقترح يجب ألا يقل عن التكلفة الأساسية',
                          en: 'The suggested price cannot be below the base cost',
                        });
                      }
                      return true;
                    },
                  },
                ],
              },
            ],
          },
          {
            label: { ar: 'المقاسات', en: 'Sizes' },
            admin: sectionIcon('sizes'),
            fields: [
              {
                name: 'sizes',
                type: 'array',
                required: true,
                minRows: 1,
                label: { ar: 'المقاسات', en: 'Sizes' },
                labels: {
                  singular: { ar: 'مقاس', en: 'Size' },
                  plural: { ar: 'المقاسات', en: 'Sizes' },
                },
                fields: [
                  {
                    name: 'label',
                    type: 'text',
                    required: true,
                    localized: true,
                    label: { ar: 'المقاس', en: 'Label' },
                  },
                  {
                    type: 'row',
                    fields: [
                      {
                        name: 'length',
                        type: 'number',
                        label: { ar: 'الطول (سم)', en: 'Length (cm)' },
                      },
                      {
                        name: 'chest',
                        type: 'number',
                        label: { ar: 'عرض الصدر (سم)', en: 'Chest (cm)' },
                      },
                      {
                        name: 'sleeve',
                        type: 'number',
                        label: { ar: 'طول الكم (سم)', en: 'Sleeve (cm)' },
                      },
                    ],
                  },
                ],
              },
              {
                name: 'sizesSummary',
                type: 'text',
                required: true,
                localized: true,
                label: { ar: 'ملخص المقاسات', en: 'Sizes summary' },
              },
              {
                type: 'row',
                fields: [
                  {
                    name: 'material',
                    type: 'text',
                    required: true,
                    localized: true,
                    label: { ar: 'الخامة', en: 'Material' },
                  },
                  {
                    name: 'weightGrams',
                    type: 'number',
                    required: true,
                    min: 1,
                    label: { ar: 'الوزن (غم)', en: 'Weight (g)' },
                  },
                ],
              },
            ],
          },
          {
            label: { ar: 'منطقة الطباعة', en: 'Print area' },
            admin: sectionIcon('printArea'),
            fields: [
              {
                name: 'printArea',
                type: 'group',
                label: { ar: 'منطقة الطباعة', en: 'Print area' },
                fields: [
                  {
                    name: 'label',
                    type: 'text',
                    required: true,
                    localized: true,
                    // Per language (audit 2026-09-18, 3.7): the English form never shows the Arabic default.
                    defaultValue: ({ locale }) =>
                      requestLocale(locale) === 'en' ? PRINT_AREA_LABEL_EN : PRINT_AREA_LABEL,
                    label: { ar: 'الوصف', en: 'Label' },
                  },
                  {
                    type: 'row',
                    fields: [
                      {
                        name: 'widthCm',
                        type: 'number',
                        required: true,
                        defaultValue: 28,
                        validate: (value: null | number | undefined, { req }: Validation) =>
                          value === 28 ||
                          inLanguage(req, {
                            ar: 'العرض ثابت: 28 سم',
                            en: 'The width is fixed: 28 cm',
                          }),
                        label: { ar: 'العرض (سم)', en: 'Width (cm)' },
                        admin: { readOnly: true },
                      },
                      {
                        name: 'heightCm',
                        type: 'number',
                        required: true,
                        defaultValue: 38,
                        validate: (value: null | number | undefined, { req }: Validation) =>
                          value === 38 ||
                          inLanguage(req, {
                            ar: 'الارتفاع ثابت: 38 سم',
                            en: 'The height is fixed: 38 cm',
                          }),
                        label: { ar: 'الارتفاع (سم)', en: 'Height (cm)' },
                        admin: { readOnly: true },
                      },
                    ],
                  },
                  {
                    name: 'canvas',
                    type: 'group',
                    label: {
                      ar: 'موضع الطباعة على الصورة (0 إلى 1)',
                      en: 'Print area on the photo (0 to 1)',
                    },
                    fields: [
                      {
                        type: 'row',
                        fields: [
                          {
                            name: 'x',
                            type: 'number',
                            required: true,
                            min: 0,
                            max: 1,
                            label: { ar: 'من اليسار', en: 'From the left' },
                          },
                          {
                            name: 'y',
                            type: 'number',
                            required: true,
                            min: 0,
                            max: 1,
                            label: { ar: 'من الأعلى', en: 'From the top' },
                          },
                          {
                            name: 'w',
                            type: 'number',
                            required: true,
                            min: 0,
                            max: 1,
                            label: { ar: 'العرض', en: 'Width' },
                          },
                          {
                            name: 'h',
                            type: 'number',
                            required: true,
                            min: 0,
                            max: 1,
                            label: { ar: 'الارتفاع', en: 'Height' },
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                name: 'printMethodLabel',
                type: 'text',
                required: true,
                localized: true,
                defaultValue: ({ locale }) =>
                  requestLocale(locale) === 'en' ? PRINT_METHOD_EN : PRINT_METHOD,
                label: { ar: 'طريقة الطباعة', en: 'Print method' },
              },
            ],
          },
        ],
      },
      {
        name: 'sortOrder',
        type: 'number',
        required: true,
        defaultValue: 1,
        label: { ar: 'الترتيب', en: 'Order' },
        admin: { position: 'sidebar', step: 1 },
      },
      savedByField,
    ],
    PRODUCT_DESCRIPTIONS,
  ),
};
