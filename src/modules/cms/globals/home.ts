import type { Field, GlobalConfig } from 'payload';
import { isEditorOrAdmin } from '@/modules/cms/access';
import { revalidateGlobal } from '@/modules/cms/hooks/revalidate';

/** The three why-us icons the section knows how to draw (BRD 6.4.6). */
export const WHY_US_ICONS = ['ShieldCheck', 'Workflow', 'Zap'] as const;

/** Exactly this many products sit in the strip (BRD 6.4.2). */
export const STRIP_SIZE = 5;

const text = (name: string, label: { ar: string; en: string }, extra: Partial<Field> = {}): Field =>
  ({ name, type: 'text', required: true, localized: true, label, ...extra }) as Field;

const enabled = (): Field => ({
  name: 'enabled',
  type: 'checkbox',
  defaultValue: true,
  label: { ar: 'يظهر في الصفحة', en: 'Shown on the page' },
});

const header = (withEyebrow = true, withLead = true): Field[] => [
  ...(withEyebrow ? [text('eyebrow', { ar: 'العنوان الصغير', en: 'Eyebrow' })] : []),
  text('title', { ar: 'العنوان', en: 'Title' }),
  ...(withLead ? [text('lead', { ar: 'الوصف', en: 'Lead' })] : []),
];

/**
 * The home page (BRD 4.4, 6.4) as one global: the sections in page order, each a group with
 * its copy and an «enabled» switch on every section except the hero, the strip, the
 * designer and the ribbon (BRD 9.5). Interface strings (aria,
 * hints, input labels, validation) stay in `src/messages/ar.json` (ADR-031). Drafts with
 * autosave; the public site reads the published version.
 */
export const Home: GlobalConfig = {
  slug: 'home',
  label: { ar: 'الصفحة الرئيسية', en: 'Home page' },
  admin: { group: { ar: 'المحتوى', en: 'Content' } },
  versions: { drafts: { autosave: { interval: 1500 }, schedulePublish: true }, max: 25 },
  // Drafts sit next to the published copy: the REST read is for signed-in staff; the site
  // reads through the Local API with `draft: false`.
  access: { read: isEditorOrAdmin, update: isEditorOrAdmin },
  hooks: { afterChange: [revalidateGlobal] },
  fields: [
    {
      name: 'hero',
      type: 'group',
      label: { ar: 'الواجهة (Hero)', en: 'Hero' },
      fields: [
        {
          name: 'slides',
          type: 'array',
          required: true,
          minRows: 4,
          maxRows: 4,
          label: { ar: 'الشرائح', en: 'Slides' },
          labels: {
            singular: { ar: 'شريحة', en: 'Slide' },
            plural: { ar: 'الشرائح', en: 'Slides' },
          },
          fields: [
            text('headline', { ar: 'العنوان الرئيسي', en: 'Headline' }),
            text('subline', { ar: 'السطر الثاني', en: 'Subline' }),
            {
              type: 'row',
              fields: [
                {
                  name: 'imageDesktop',
                  type: 'upload',
                  relationTo: 'media',
                  required: true,
                  label: { ar: 'الصورة (سطح المكتب 16:9)', en: 'Image (desktop 16:9)' },
                },
                {
                  name: 'imageMobile',
                  type: 'upload',
                  relationTo: 'media',
                  required: true,
                  label: { ar: 'الصورة (الجوال 4:5)', en: 'Image (mobile 4:5)' },
                },
              ],
            },
          ],
        },
        {
          type: 'row',
          fields: [
            text('primaryCta', { ar: 'الزر الرئيسي', en: 'Primary CTA' }),
            text('secondaryCta', { ar: 'الرابط الثانوي', en: 'Secondary link' }),
          ],
        },
        text('microcopy', {
          ar: 'سطر الرصيد الترحيبي (شريط الحقائق في «من نحن»)',
          en: 'Welcome-credit line (the About facts band)',
        }),
        {
          name: 'chips',
          type: 'array',
          required: true,
          minRows: 3,
          maxRows: 3,
          label: { ar: 'شارات الإثبات', en: 'Proof chips' },
          labels: { singular: { ar: 'شارة', en: 'Chip' }, plural: { ar: 'الشارات', en: 'Chips' } },
          fields: [text('text', { ar: 'النص', en: 'Text' })],
        },
      ],
    },
    {
      name: 'productStrip',
      type: 'group',
      label: { ar: 'شريط المنتجات', en: 'Product strip' },
      fields: [
        ...header(),
        {
          type: 'row',
          fields: [
            text('pricePrefix', { ar: 'قبل السعر', en: 'Price prefix' }),
            text('button', { ar: 'الزر', en: 'Button' }),
          ],
        },
        {
          name: 'products',
          type: 'relationship',
          relationTo: 'products',
          hasMany: true,
          required: true,
          minRows: STRIP_SIZE,
          maxRows: STRIP_SIZE,
          // Drafts never reach the strip: the picker lists published products only.
          filterOptions: { _status: { equals: 'published' } },
          label: { ar: 'المنتجات الخمسة بالترتيب', en: 'The five products, in order' },
          admin: {
            description: {
              ar: 'منتجات منشورة فقط؛ منتج يُلغى نشره لاحقاً يسقط من الشريط حتى يُنشر من جديد.',
              en: 'Published products only; one unpublished later drops out of the strip until it is published again.',
            },
          },
          validate: (value: unknown) => {
            const ids = Array.isArray(value)
              ? value.map((v) => (typeof v === 'object' && v ? (v as { id?: unknown }).id : v))
              : [];
            if (ids.length !== STRIP_SIZE) return `اختر ${STRIP_SIZE} منتجات بالضبط`;
            if (new Set(ids.map(String)).size !== STRIP_SIZE) return 'كل منتج مرة واحدة';
            return true;
          },
        },
      ],
    },
    {
      name: 'designer',
      type: 'group',
      label: { ar: 'المصمّم والحاسبة', en: 'Designer and calculator' },
      fields: [...header(), text('cta', { ar: 'الزر', en: 'CTA' })],
    },
    {
      name: 'steps',
      type: 'group',
      label: { ar: 'الخطوات الثلاث', en: 'Three steps' },
      fields: [
        enabled(),
        ...header(true, false),
        text('link', { ar: 'رابط «اعرف أكثر»', en: 'Learn-more link' }),
        {
          name: 'items',
          type: 'array',
          required: true,
          minRows: 3,
          maxRows: 3,
          label: { ar: 'الخطوات', en: 'Steps' },
          labels: { singular: { ar: 'خطوة', en: 'Step' }, plural: { ar: 'الخطوات', en: 'Steps' } },
          fields: [
            text('title', { ar: 'العنوان', en: 'Title' }),
            text('text', { ar: 'النص', en: 'Text' }),
            {
              name: 'icon',
              type: 'upload',
              relationTo: 'media',
              required: true,
              label: { ar: 'الأيقونة المجسّمة', en: '3D icon' },
            },
          ],
        },
      ],
    },
    {
      name: 'video',
      type: 'group',
      label: { ar: 'الفيديو', en: 'Video' },
      admin: {
        description: {
          ar: 'المقطع نفسه ملف ثابت في الموقع؛ هنا العنوان والوصف فقط.',
          en: 'The loop itself ships with the site; only the copy lives here.',
        },
      },
      fields: [enabled(), ...header(false)],
    },
    {
      name: 'whyUs',
      type: 'group',
      label: { ar: 'لماذا بحر', en: 'Why us' },
      fields: [
        enabled(),
        ...header(true, false),
        {
          name: 'items',
          type: 'array',
          required: true,
          minRows: 3,
          maxRows: 3,
          label: { ar: 'البطاقات', en: 'Cards' },
          labels: {
            singular: { ar: 'بطاقة', en: 'Card' },
            plural: { ar: 'البطاقات', en: 'Cards' },
          },
          fields: [
            {
              name: 'icon',
              type: 'select',
              required: true,
              options: WHY_US_ICONS.map((i) => ({ label: i, value: i })),
              label: { ar: 'الأيقونة', en: 'Icon' },
            },
            text('title', { ar: 'العنوان', en: 'Title' }),
            text('text', { ar: 'النص', en: 'Text' }),
          ],
        },
      ],
    },
    {
      name: 'testimonials',
      type: 'group',
      label: { ar: 'آراء التجار', en: 'Testimonials' },
      admin: {
        description: {
          ar: 'الآراء نفسها في «آراء التجار»؛ هنا عنوان القسم.',
          en: 'The entries live in Testimonials; the section title lives here.',
        },
      },
      fields: [enabled(), ...header(true, false)],
    },
    {
      name: 'integrations',
      type: 'group',
      label: { ar: 'المتاجر المتصلة', en: 'Integrations' },
      fields: [enabled(), ...header(false)],
    },
    {
      name: 'faq',
      type: 'group',
      label: { ar: 'الأسئلة الشائعة', en: 'FAQ' },
      admin: {
        description: {
          ar: 'الأسئلة نفسها في «الأسئلة الشائعة» (المعلَّمة «يظهر في الرئيسية»).',
          en: 'The entries flagged «show on home» in the FAQ collection.',
        },
      },
      fields: [
        enabled(),
        ...header(false, false),
        text('link', { ar: 'رابط «كل الأسئلة»', en: 'All-questions link' }),
      ],
    },
    {
      name: 'ribbon',
      type: 'group',
      label: { ar: 'شريط الدعوة (كل الصفحات)', en: 'CTA ribbon (every page)' },
      fields: [...header(false), text('button', { ar: 'الزر', en: 'Button' })],
    },
  ],
};
