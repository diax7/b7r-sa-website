import type { CollectionConfig } from 'payload';
import { canDeleteVersioned, isEditorOrAdmin, publishedOrStaff } from '@/modules/cms/access';
import { revalidateProducts } from '@/modules/cms/hooks/revalidate';

const PRICE_HELP = {
  ar: 'يجب أن يطابق السعر في التطبيق (لا مزامنة آلية).',
  en: 'Must match the app; there is no automatic sync.',
};

/**
 * Products (BRD 9.4, Appendix A): one document per product, fields 1:1 with the Level 1
 * `Product` contract, drafts with autosave, published-only public reads.
 */
export const Products: CollectionConfig = {
  slug: 'products',
  labels: { singular: { ar: 'منتج', en: 'Product' }, plural: { ar: 'المنتجات', en: 'Products' } },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'baseCost', 'suggestedPrice', 'sortOrder', '_status'],
    group: { ar: 'المحتوى', en: 'Content' },
  },
  versions: { drafts: { autosave: { interval: 1500 } }, maxPerDoc: 25 },
  access: {
    read: publishedOrStaff,
    create: isEditorOrAdmin,
    update: isEditorOrAdmin,
    delete: canDeleteVersioned,
  },
  hooks: {
    afterChange: [revalidateProducts],
    afterDelete: [revalidateProducts],
  },
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
          label: { ar: 'المعرّف في الرابط', en: 'Slug' },
          admin: {
            description: { ar: 'حروف لاتينية صغيرة وشرطات فقط', en: 'lowercase-hyphenated' },
          },
          validate: (value: unknown) =>
            typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
              ? true
              : 'حروف لاتينية صغيرة وأرقام وشرطات فقط',
        },
      ],
    },
    {
      name: 'shortDescription',
      type: 'textarea',
      required: true,
      localized: true,
      label: { ar: 'الوصف المختصر', en: 'Short description' },
      admin: {
        description: { ar: 'سطر واحد للبطاقات ووصف الصفحة', en: 'One line for cards and meta' },
      },
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
          admin: { description: PRICE_HELP, step: 1 },
        },
        {
          name: 'suggestedPrice',
          type: 'number',
          required: true,
          min: 1,
          label: { ar: 'سعر البيع المقترح (ريال)', en: 'Suggested price (SAR)' },
          admin: { description: PRICE_HELP, step: 1 },
          validate: (value: unknown, { siblingData }: { siblingData: Record<string, unknown> }) => {
            const base = siblingData['baseCost'];
            if (typeof value === 'number' && typeof base === 'number' && value < base) {
              return 'سعر البيع المقترح يجب ألا يقل عن التكلفة الأساسية';
            }
            return true;
          },
        },
        {
          name: 'sortOrder',
          type: 'number',
          required: true,
          defaultValue: 1,
          label: { ar: 'الترتيب', en: 'Order' },
        },
      ],
    },
    {
      name: 'colors',
      type: 'array',
      required: true,
      minRows: 1,
      label: { ar: 'الألوان', en: 'Colours' },
      labels: { singular: { ar: 'لون', en: 'Colour' }, plural: { ar: 'الألوان', en: 'Colours' } },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'slug', type: 'text', required: true, label: { ar: 'المعرّف', en: 'Slug' } },
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
              validate: (value: unknown) =>
                typeof value === 'string' && /^#[0-9A-Fa-f]{6}$/.test(value)
                  ? true
                  : 'مثال: #FFFFFF',
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
    {
      name: 'sizes',
      type: 'array',
      required: true,
      minRows: 1,
      label: { ar: 'المقاسات', en: 'Sizes' },
      labels: { singular: { ar: 'مقاس', en: 'Size' }, plural: { ar: 'المقاسات', en: 'Sizes' } },
      fields: [
        { name: 'label', type: 'text', required: true, label: { ar: 'المقاس', en: 'Label' } },
        {
          type: 'row',
          fields: [
            { name: 'length', type: 'number', label: { ar: 'الطول (سم)', en: 'Length (cm)' } },
            { name: 'chest', type: 'number', label: { ar: 'عرض الصدر (سم)', en: 'Chest (cm)' } },
            { name: 'sleeve', type: 'number', label: { ar: 'طول الكم (سم)', en: 'Sleeve (cm)' } },
          ],
        },
      ],
    },
    {
      name: 'sizesSummary',
      type: 'text',
      required: true,
      label: { ar: 'ملخص المقاسات', en: 'Sizes summary' },
      admin: { description: { ar: 'مثال: S – 2XL', en: 'e.g. S – 2XL' } },
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
          defaultValue: 'الواجهة الأمامية، 28 × 38 سم',
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
              label: { ar: 'العرض (سم)', en: 'Width (cm)' },
              admin: { readOnly: true },
            },
            {
              name: 'heightCm',
              type: 'number',
              required: true,
              defaultValue: 38,
              label: { ar: 'الارتفاع (سم)', en: 'Height (cm)' },
              admin: { readOnly: true },
            },
          ],
        },
        {
          name: 'canvas',
          type: 'group',
          label: { ar: 'موضع الطباعة على الصورة (نِسَب 0–1)', en: 'Canvas fractions (0–1)' },
          admin: {
            description: {
              ar: 'يحدد أين تظهر منطقة الطباعة فوق صورة المنتج في المصمّم التفاعلي.',
              en: 'Where the print area sits over the product photo in the designer.',
            },
          },
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'x', type: 'number', required: true, min: 0, max: 1, label: 'x' },
                { name: 'y', type: 'number', required: true, min: 0, max: 1, label: 'y' },
                { name: 'w', type: 'number', required: true, min: 0, max: 1, label: 'w' },
                { name: 'h', type: 'number', required: true, min: 0, max: 1, label: 'h' },
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
      defaultValue: 'طباعة رقمية عالية الجودة',
      label: { ar: 'طريقة الطباعة', en: 'Print method' },
    },
  ],
};
