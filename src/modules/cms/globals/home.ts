import type { Field, GlobalConfig, PayloadRequest, Tab, UploadField } from 'payload';
import { backgroundField } from '@/modules/brand/background-field';
import { isEditorOrAdmin } from '@/modules/cms/access';
import { revalidateGlobal } from '@/modules/cms/hooks/revalidate';
import { twinField } from '@/modules/cms/fields/bilingual';
import { inLanguage } from '@/modules/cms/fields/message';
import { applyGlobalTranslations } from '@/modules/cms/hooks/translations';
import { savedByField, stampSavedByGlobal } from '@/modules/cms/fields/saved-by';
import { populateGlobalTwins } from '@/modules/cms/fields/twins';
import { previewUrl } from '@/lib/preview-token';
import {
  HERO_CHIPS_MAX,
  HERO_OVERLAY_DEFAULT,
  HEX_COLOR,
  HOME_BACKGROUND_SECTIONS,
} from '@/content/schema';
import { globalComponents } from '@/modules/cms/admin/document/config';
import { adminGroup, iconOptions, sectionIcon } from '@/modules/cms/admin/icons';
import { HOME_DESCRIPTIONS } from '@/modules/cms/admin/descriptions/site';
import { describeFields } from '@/modules/cms/admin/descriptions/describe';

/** The background picker, last in each tab of a section that may take a set (spec 010). */
function withBackgrounds(tabs: Tab[]): Tab[] {
  const sections: readonly string[] = HOME_BACKGROUND_SECTIONS;
  return tabs.map((tab) =>
    'name' in tab && tab.name && sections.includes(tab.name)
      ? { ...tab, fields: [...tab.fields, backgroundField()] }
      : tab,
  );
}

/** The three why-us icons the section knows how to draw (BRD 6.4.6). */
export const WHY_US_ICONS = ['ShieldCheck', 'Workflow', 'Zap'] as const;

/** Exactly this many products sit in the strip (BRD 6.4.2). */
export const STRIP_SIZE = 5;

/**
 * A slide's photo, per language (ADR-044): the English document mirrors the layout, so its
 * photo is a mirrored composition; the site reads without locale fallback, so both languages
 * need their own. The English is picked in the twin right under the Arabic (ADR-057, PR B);
 * the map's sentence under each says so.
 */
const slidePhoto = (name: string, label: { ar: string; en: string }): UploadField => ({
  name,
  type: 'upload',
  relationTo: 'media',
  required: true,
  localized: true,
  label,
});
const imageDesktop = slidePhoto('imageDesktop', {
  ar: 'الصورة (الحاسوب 16:9)',
  en: 'Image (desktop 16:9)',
});
const imageMobile = slidePhoto('imageMobile', {
  ar: 'الصورة (الجوال 4:5)',
  en: 'Image (mobile 4:5)',
});

const text = (name: string, label: { ar: string; en: string }, extra: Partial<Field> = {}): Field =>
  ({ name, type: 'text', required: true, localized: true, label, ...extra }) as Field;

/** The section switch (ADR-039): the map's sentence names what the switch removes from the site. */
const enabled = (): Field => ({
  name: 'enabled',
  type: 'checkbox',
  defaultValue: true,
  label: { ar: 'يظهر في الصفحة', en: 'Shown on the page' },
  admin: { components: { Field: '@/modules/cms/admin/fields/enabled-switch#EnabledSwitch' } },
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
    components: globalComponents('home'),
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
    beforeRead: [populateGlobalTwins],
    beforeChange: [stampSavedByGlobal],
    afterChange: [revalidateGlobal, applyGlobalTranslations],
  },
  fields: describeFields(
    [
      // One tab per section of the home page, in site order (ADR-046). A named tab stores
      // under the same path and the same columns as the group it replaced: no migration.
      {
        type: 'tabs',
        tabs: withBackgrounds([
          {
            name: 'hero',
            label: { ar: 'الشرائح الافتتاحية', en: 'Opening slides' },
            admin: sectionIcon('slides'),
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
                  // Each photo full width with its English under it: no row (a row is transparent
                  // in storage, so the columns are unchanged).
                  imageDesktop,
                  twinField(imageDesktop),
                  imageMobile,
                  twinField(imageMobile),
                ],
              },
              {
                name: 'overlay',
                type: 'group',
                label: { ar: 'التدرّج فوق الصورة', en: 'Fade over the photo' },
                admin: sectionIcon('fade'),
                fields: [
                  {
                    name: 'enabled',
                    type: 'checkbox',
                    defaultValue: true,
                    label: { ar: 'يظهر فوق الصورة', en: 'Shown over the photo' },
                    admin: {
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
                fields: [text('text', { ar: 'النص', en: 'Text' })],
              },
            ],
          },
          {
            name: 'productStrip',
            label: { ar: 'شريط المنتجات', en: 'Product strip' },
            admin: sectionIcon('strip'),
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
            admin: sectionIcon('designer'),
            description: {
              ar: 'يجرّب الزائر تصميماً على منتج ويرى ربحه قبل أن يسجّل.',
              en: 'A visitor tries a design on a product and sees the profit before signing up.',
            },
            fields: [...header(), text('cta', { ar: 'الزر', en: 'Button' })],
          },
          {
            name: 'steps',
            label: { ar: 'الخطوات الثلاث', en: 'Three steps' },
            admin: sectionIcon('steps'),
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
            admin: sectionIcon('video'),
            description: {
              ar: 'المقطع نفسه ملف ثابت في الموقع؛ هنا العنوان والوصف فقط.',
              en: 'The loop itself ships with the site; only the copy lives here.',
            },
            fields: [enabled(), ...header(false)],
          },
          {
            name: 'whyUs',
            label: { ar: 'لماذا بحر', en: 'Why us' },
            admin: sectionIcon('why'),
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
            admin: sectionIcon('testimonials'),
            description: {
              ar: 'هنا عنوان القسم فقط؛ الآراء نفسها في «آراء التجار».',
              en: 'The entries live in Testimonials; the section title lives here.',
            },
            fields: [enabled(), ...header(true, false)],
          },
          {
            name: 'integrations',
            label: { ar: 'المتاجر المتصلة', en: 'Connected stores' },
            admin: sectionIcon('stores'),
            fields: [enabled(), ...header(false)],
          },
          {
            name: 'faq',
            label: { ar: 'الأسئلة الشائعة', en: 'FAQ' },
            admin: sectionIcon('faq'),
            description: {
              ar: 'ما عُلِّم «يظهر في الرئيسية» في الأسئلة الشائعة.',
              en: 'The entries flagged "show on the home page" in the FAQ.',
            },
            fields: [
              enabled(),
              ...header(false, false),
              text('link', { ar: 'رابط «كل الأسئلة»', en: 'All-questions link' }),
            ],
          },
          {
            name: 'ribbon',
            label: { ar: 'شريط الدعوة', en: 'Bottom banner' },
            admin: sectionIcon('banner'),
            description: {
              ar: 'أسفل كل صفحة، فوق التذييل؛ يُحرَّر هنا مرة واحدة.',
              en: 'At the bottom of every page, above the footer; edited here once.',
            },
            fields: [...header(false), text('button', { ar: 'الزر', en: 'Button' })],
          },
        ]),
      },
      savedByField,
    ],
    HOME_DESCRIPTIONS,
  ),
};
