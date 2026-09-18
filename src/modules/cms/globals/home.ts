import type { Field, GlobalConfig, PayloadRequest } from 'payload';
import { isEditorOrAdmin } from '@/modules/cms/access';
import { revalidateGlobal } from '@/modules/cms/hooks/revalidate';
import { inLanguage } from '@/modules/cms/fields/message';
import { applyGlobalTranslations } from '@/modules/cms/hooks/translations';
import { savedByField, stampSavedByGlobal } from '@/modules/cms/fields/saved-by';
import { previewUrl } from '@/lib/preview-token';
import { HERO_CHIPS_MAX, HERO_OVERLAY_DEFAULT, HEX_COLOR } from '@/content/schema';
import { globalComponents } from '@/modules/cms/admin/document/config';
import { adminGroup, iconOptions } from '@/modules/cms/admin/icons';
import { HOME_DESCRIPTIONS } from '@/modules/cms/admin/descriptions/site';
import { describeFields } from '@/modules/cms/admin/descriptions/describe';

/** The three why-us icons the section knows how to draw (BRD 6.4.6). */
export const WHY_US_ICONS = ['ShieldCheck', 'Workflow', 'Zap'] as const;

/** Exactly this many products sit in the strip (BRD 6.4.2). */
export const STRIP_SIZE = 5;

const PHOTO_PER_LANGUAGE = {
  ar: 'لكل لغة صورتها (الموقع الإنجليزي لا يعود إلى العربية). الإنجليزية: تركيب معكوس، المساحة الهادئة تحت النص.',
  en: 'Per language (the English site has no fallback). English: the mirrored composition, calm area under the copy.',
};

const text = (name: string, label: { ar: string; en: string }, extra: Partial<Field> = {}): Field =>
  ({ name, type: 'text', required: true, localized: true, label, ...extra }) as Field;

/** The section switch (ADR-039): its description names what the switch removes from the site. */
const enabled = (section: { ar: string; en: string }): Field => ({
  name: 'enabled',
  type: 'checkbox',
  defaultValue: true,
  label: { ar: 'يظهر في الصفحة', en: 'Shown on the page' },
  admin: {
    description: {
      ar: `عند الإيقاف يختفي قسم «${section.ar}» من الصفحة الرئيسية.`,
      en: `Off hides the “${section.en}” section from the home page.`,
    },
    components: { Field: '@/modules/cms/admin/fields/enabled-switch#EnabledSwitch' },
  },
});

const header = (withEyebrow = true, withLead = true): Field[] => [
  ...(withEyebrow
    ? [text('eyebrow', { ar: 'العنوان الصغير', en: 'Small line above the title' })]
    : []),
  text('title', { ar: 'العنوان', en: 'Title' }),
  ...(withLead ? [text('lead', { ar: 'السطر تحت العنوان', en: 'Line under the title' })] : []),
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
  admin: {
    hideAPIURL: true,
    components: globalComponents('home', { localized: true }),
    group: adminGroup('site'),
    custom: {
      shows: {
        ar: 'الصفحة الرئيسية بلغتيها، قسماً قسماً',
        en: 'the home page, b7r.sa and b7r.sa/en, section by section',
      },
    },
    preview: (_doc, { req }) => previewUrl(req.payload.config.serverURL, '/', req.payload.secret),
    description: {
      ar: 'أقسام الصفحة الرئيسية بالترتيب. احفظ مسودة بحرّية؛ النشر يظهر في الموقع خلال ثوانٍ.',
      en: 'The home page, section by section. Drafts are free; publishing is live within seconds.',
    },
  },
  versions: { drafts: { autosave: { interval: 1500 }, schedulePublish: true }, max: 50 },
  // Drafts sit next to the published copy: the REST read is for signed-in staff; the site
  // reads through the Local API with `draft: false`.
  access: { read: isEditorOrAdmin, update: isEditorOrAdmin },
  hooks: {
    beforeChange: [stampSavedByGlobal],
    afterChange: [revalidateGlobal, applyGlobalTranslations],
  },
  fields: describeFields(
    [
      // One tab per section of the home page, in site order (ADR-046). A named tab stores
      // under the same path and the same columns as the group it replaced: no migration.
      {
        type: 'tabs',
        tabs: [
          {
            name: 'hero',
            label: { ar: 'الشرائح الافتتاحية', en: 'Opening slides' },
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
                  text('subline', { ar: 'السطر تحت العنوان', en: 'Line under the headline' }),
                  {
                    type: 'row',
                    // Per language (ADR-044): the English document mirrors the layout, so its photo
                    // is a mirrored composition; the site reads without locale fallback, so both
                    // languages need their own.
                    fields: [
                      {
                        name: 'imageDesktop',
                        type: 'upload',
                        relationTo: 'media',
                        required: true,
                        localized: true,
                        label: { ar: 'الصورة (سطح المكتب 16:9)', en: 'Image (desktop 16:9)' },
                        admin: { description: PHOTO_PER_LANGUAGE },
                      },
                      {
                        name: 'imageMobile',
                        type: 'upload',
                        relationTo: 'media',
                        required: true,
                        localized: true,
                        label: { ar: 'الصورة (الجوال 4:5)', en: 'Image (mobile 4:5)' },
                        admin: { description: PHOTO_PER_LANGUAGE },
                      },
                    ],
                  },
                ],
              },
              {
                name: 'overlay',
                type: 'group',
                label: { ar: 'التدرّج فوق الصورة', en: 'Fade over the photo' },
                admin: {
                  description: {
                    ar: 'طبقة شفافة من لون واحد تبدأ من جهة النص وتتلاشى فوق الصورة؛ تُقرأ العناوين فوق أي صورة.',
                    en: 'A one-colour fade from the copy side over the photo, so the headline reads on any photo.',
                  },
                },
                fields: [
                  {
                    name: 'enabled',
                    type: 'checkbox',
                    defaultValue: true,
                    label: { ar: 'يظهر فوق الصورة', en: 'Shown over the photo' },
                    admin: {
                      description: {
                        ar: 'عند الإيقاف تظهر الصورة كما هي خلف النص، بلا تدرّج.',
                        en: 'Off shows the photo as it is behind the copy, with no fade.',
                      },
                      components: {
                        Field: '@/modules/cms/admin/fields/enabled-switch#EnabledSwitch',
                      },
                    },
                  },
                  {
                    name: 'color',
                    type: 'text',
                    required: true,
                    defaultValue: HERO_OVERLAY_DEFAULT,
                    label: { ar: 'اللون', en: 'Colour' },
                    admin: {
                      description: {
                        ar: 'لون التدرّج؛ الأبيض هو الأصل. يُكتب بصيغة #rrggbb.',
                        en: 'The fade colour; white is the default. Written as #rrggbb.',
                      },
                      components: { Field: '@/modules/cms/admin/fields/color-field#ColorField' },
                    },
                    validate: (value: unknown, { req }: { req: PayloadRequest }) =>
                      typeof value === 'string' && HEX_COLOR.test(value)
                        ? true
                        : inLanguage(req, {
                            ar: 'اكتب لوناً بصيغة #rrggbb',
                            en: 'A colour written as #rrggbb',
                          }),
                  },
                ],
              },
              {
                type: 'row',
                fields: [
                  text('primaryCta', { ar: 'الزر الرئيسي', en: 'Main button' }),
                  text('secondaryCta', { ar: 'الرابط بجانب الزر', en: 'Link beside the button' }),
                ],
              },
              text('microcopy', { ar: 'سطر الرصيد الترحيبي', en: 'Welcome credit line' }),
              {
                name: 'chips',
                type: 'array',
                minRows: 0,
                maxRows: HERO_CHIPS_MAX,
                label: { ar: 'الشارات تحت الأزرار', en: 'Small badges under the buttons' },
                labels: {
                  singular: { ar: 'شارة', en: 'Chip' },
                  plural: { ar: 'الشارات', en: 'Chips' },
                },
                admin: {
                  description: {
                    ar: `من صفر إلى ${HERO_CHIPS_MAX}؛ بلا شارات يختفي الصف. الصفوف مشتركة بين اللغتين والنص لكل لغة: صف بلا نص إنجليزي لا يظهر في الموقع الإنجليزي.`,
                    en: `Zero to ${HERO_CHIPS_MAX}; none hides the row. The rows are shared by both languages, the text is per language: a row without an English text does not show on the English site.`,
                  },
                },
                fields: [text('text', { ar: 'النص', en: 'Text' })],
              },
            ],
          },
          {
            name: 'productStrip',
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
                validate: (value: unknown, { req }: { req: PayloadRequest }) => {
                  const ids = Array.isArray(value)
                    ? value.map((v) =>
                        typeof v === 'object' && v ? (v as { id?: unknown }).id : v,
                      )
                    : [];
                  if (ids.length !== STRIP_SIZE) {
                    return inLanguage(req, {
                      ar: `اختر ${STRIP_SIZE} منتجات بالضبط`,
                      en: `Pick exactly ${STRIP_SIZE} products`,
                    });
                  }
                  if (new Set(ids.map(String)).size !== STRIP_SIZE) {
                    return inLanguage(req, { ar: 'كل منتج مرة واحدة', en: 'Each product once' });
                  }
                  return true;
                },
              },
            ],
          },
          {
            name: 'designer',
            label: { ar: 'المصمّم', en: 'Designer' },
            description: {
              ar: 'قسم المصمّم والحاسبة: يجرّب الزائر تصميماً على منتج ويرى ربحه قبل أن يسجّل.',
              en: 'The designer and calculator section: a visitor tries a design on a product and sees the profit before signing up.',
            },
            fields: [...header(), text('cta', { ar: 'الزر', en: 'Button' })],
          },
          {
            name: 'steps',
            label: { ar: 'الخطوات الثلاث', en: 'Three steps' },
            fields: [
              enabled({ ar: 'الخطوات الثلاث', en: 'Three steps' }),
              ...header(true, false),
              text('link', { ar: 'رابط «اعرف أكثر»', en: 'Learn-more link' }),
              {
                name: 'items',
                type: 'array',
                required: true,
                minRows: 3,
                maxRows: 3,
                label: { ar: 'الخطوات', en: 'Steps' },
                labels: {
                  singular: { ar: 'خطوة', en: 'Step' },
                  plural: { ar: 'الخطوات', en: 'Steps' },
                },
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
            label: { ar: 'الفيديو', en: 'Video' },
            description: {
              ar: 'المقطع نفسه ملف ثابت في الموقع؛ هنا العنوان والوصف فقط.',
              en: 'The loop itself ships with the site; only the copy lives here.',
            },
            fields: [enabled({ ar: 'الفيديو', en: 'Video' }), ...header(false)],
          },
          {
            name: 'whyUs',
            label: { ar: 'لماذا بحر', en: 'Why us' },
            fields: [
              enabled({ ar: 'لماذا بحر', en: 'Why us' }),
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
                    options: iconOptions(WHY_US_ICONS),
                    label: { ar: 'الأيقونة', en: 'Icon' },
                    admin: {
                      components: { Field: '@/modules/cms/admin/fields/icon-select#IconSelect' },
                    },
                  },
                  text('title', { ar: 'العنوان', en: 'Title' }),
                  text('text', { ar: 'النص', en: 'Text' }),
                ],
              },
            ],
          },
          {
            name: 'testimonials',
            label: { ar: 'آراء التجار', en: 'Testimonials' },
            description: {
              ar: 'الآراء نفسها في «آراء التجار»؛ هنا عنوان القسم.',
              en: 'The entries live in Testimonials; the section title lives here.',
            },
            fields: [enabled({ ar: 'آراء التجار', en: 'Testimonials' }), ...header(true, false)],
          },
          {
            name: 'integrations',
            label: { ar: 'المتاجر المتصلة', en: 'Connected stores' },
            fields: [enabled({ ar: 'المتاجر المتصلة', en: 'Connected stores' }), ...header(false)],
          },
          {
            name: 'faq',
            label: { ar: 'الأسئلة الشائعة', en: 'FAQ' },
            description: {
              ar: 'الأسئلة نفسها في «الأسئلة الشائعة» (المعلَّمة «يظهر في الرئيسية»).',
              en: 'The entries flagged «show on home» in the FAQ collection.',
            },
            fields: [
              enabled({ ar: 'الأسئلة الشائعة', en: 'FAQ' }),
              ...header(false, false),
              text('link', { ar: 'رابط «كل الأسئلة»', en: 'All-questions link' }),
            ],
          },
          {
            name: 'ribbon',
            label: { ar: 'شريط الدعوة', en: 'Bottom banner' },
            description: {
              ar: 'شريط الدعوة أسفل كل صفحة من الموقع، فوق التذييل؛ يُحرَّر هنا مرة واحدة.',
              en: 'The CTA ribbon at the bottom of every page of the site, above the footer; edited here once.',
            },
            fields: [...header(false), text('button', { ar: 'الزر', en: 'Button' })],
          },
        ],
      },
      savedByField,
    ],
    HOME_DESCRIPTIONS,
  ),
};
