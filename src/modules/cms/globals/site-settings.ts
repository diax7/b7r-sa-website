import type { Field, GlobalConfig, NamedTab } from 'payload';
import { hiddenUnlessAdmin, isAdmin } from '@/modules/cms/access';
import { revalidateGlobal } from '@/modules/cms/hooks/revalidate';
import { applyGlobalTranslations } from '@/modules/cms/hooks/translations';
import { umamiSrcAllowed } from '@/lib/security-headers';
import { savedByField, stampSavedByGlobal } from '@/modules/cms/fields/saved-by';
import { globalComponents } from '@/modules/cms/admin/document/config';
import { adminGroup } from '@/modules/cms/admin/icons';
import { SITE_SETTINGS_DESCRIPTIONS } from '@/modules/cms/admin/descriptions/site';
import { describeFields } from '@/modules/cms/admin/descriptions/describe';

const APP_HELP = {
  ar: 'يجب أن يطابق التطبيق (لا مزامنة آلية).',
  en: 'Must match the app; no automatic sync.',
};

/** One link of the header or the footer: its label per language, its path, and what counts as active. */
const navItem: Field[] = [
  {
    type: 'row',
    fields: [
      {
        name: 'label',
        type: 'text',
        required: true,
        localized: true,
        label: { ar: 'النص', en: 'Label' },
      },
      {
        name: 'href',
        type: 'text',
        required: true,
        label: { ar: 'الرابط', en: 'Link' },
        validate: (value: unknown) =>
          typeof value === 'string' && value.startsWith('/') ? true : 'الرابط يبدأ بـ /',
      },
      {
        name: 'matchPrefix',
        type: 'text',
        label: { ar: 'يُعدّ نشطاً لكل ما يبدأ بـ', en: 'Active prefix' },
        admin: {
          description: {
            ar: 'يبقى الرابط مُعلَّماً في الترويسة لكل صفحة يبدأ مسارها بهذا. مثال: /products',
            en: 'The link stays marked as the current one on every page whose path starts with this. Example: /products',
          },
        },
      },
    ],
  },
];

/**
 * The menus (the former Navigation global, folded in by ADR-046) as a named tab: the header
 * links, the footer's policy links, the CTA and the three menu labels Dhia keeps editable.
 * A named tab stores under `menu.*` like the group it replaced.
 */
const menu: NamedTab = {
  name: 'menu',
  label: { ar: 'القوائم والتذييل', en: 'Menus & footer' },
  description: {
    ar: 'روابط الترويسة والتذييل وتسميات القائمة، في كل صفحة من الموقع.',
    en: 'The header and footer links and the menu labels, on every page of the site.',
  },
  fields: [
    {
      name: 'primary',
      type: 'array',
      required: true,
      minRows: 6,
      maxRows: 6,
      label: { ar: 'القائمة الرئيسية (6)', en: 'Primary (6)' },
      admin: {
        description: {
          ar: 'روابط الترويسة بترتيبها، وقائمة الجوال، وعمود «روابط» في التذييل.',
          en: 'The header links in order, the phone menu, and the "Links" column of the footer.',
        },
      },
      fields: navItem,
    },
    {
      name: 'policies',
      type: 'array',
      required: true,
      minRows: 4,
      maxRows: 4,
      label: { ar: 'روابط السياسات (4)', en: 'Policies (4)' },
      admin: {
        description: {
          ar: 'عمود «السياسات» في التذييل: الشروط، الشحن، الخصوصية، الأسئلة الشائعة.',
          en: 'The "Policies" column of the footer: terms, shipping, privacy, FAQ.',
        },
      },
      fields: navItem,
    },
    {
      name: 'ctaLabel',
      type: 'text',
      required: true,
      localized: true,
      label: { ar: 'زر الدعوة', en: 'CTA label' },
      admin: {
        description: {
          ar: 'نص الزر الأزرق في الترويسة وفي قائمة الجوال.',
          en: 'The blue button in the header and in the phone menu.',
        },
      },
    },

    {
      type: 'row',
      fields: [
        {
          name: 'skipLinkLabel',
          type: 'text',
          required: true,
          localized: true,
          label: { ar: 'رابط التخطي', en: 'Skip link' },
          admin: {
            description: {
              ar: 'رابط يظهر عند الضغط على Tab أول مرة، يقفز إلى المحتوى.',
              en: 'The link a keyboard user sees on the first Tab, jumping past the header to the content.',
            },
          },
        },
        {
          name: 'menuOpenLabel',
          type: 'text',
          required: true,
          localized: true,
          label: { ar: 'فتح القائمة', en: 'Menu open' },
          admin: {
            description: {
              ar: 'الاسم الذي يقرؤه قارئ الشاشة لزر القائمة في الجوال وهي مغلقة.',
              en: "What a screen reader calls the phone menu's burger while the menu is closed.",
            },
          },
        },
        {
          name: 'menuCloseLabel',
          type: 'text',
          required: true,
          localized: true,
          label: { ar: 'إغلاق القائمة', en: 'Menu close' },
          admin: {
            description: {
              ar: 'الاسم الذي يقرؤه قارئ الشاشة لزر القائمة في الجوال وهي مفتوحة.',
              en: "What a screen reader calls the phone menu's button while the menu is open.",
            },
          },
        },
      ],
    },
  ],
};

/** BRD 9.4 `site-settings` ⇄ `SiteSettings` in content/schema.ts. Admin only (BRD 9.3). */
export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: { ar: 'إعدادات الموقع', en: 'Site settings' },
  admin: {
    components: globalComponents('site-settings', { localized: true }),
    group: adminGroup('site'),
    custom: {
      shows: {
        ar: 'كل الصفحات: الترويسة وروابطها، التذييل، روابط التواصل، والأرقام التي يعرضها الموقع',
        en: 'every page: the header and its links, the footer, the contact links and the numbers the site quotes',
      },
    },
    hidden: hiddenUnlessAdmin,
    description: {
      ar: 'اسم الموقع، بيانات التواصل، الحسابات الاجتماعية، القوائم والعرض الترحيبي.',
      en: 'Site name, contact details, social accounts, the menus and the welcome offer.',
    },
  },
  access: { read: () => true, update: isAdmin },
  hooks: {
    beforeChange: [stampSavedByGlobal],
    afterChange: [revalidateGlobal, applyGlobalTranslations],
  },
  fields: describeFields(
    [
      // Five tabs (ADR-046): the menus are a named tab storing under `menu.*`.
      {
        type: 'tabs',
        tabs: [
          {
            label: { ar: 'العلامة', en: 'Brand' },
            fields: [
              {
                type: 'row',
                fields: [
                  {
                    name: 'brandName',
                    type: 'text',
                    required: true,
                    localized: true,
                    label: { ar: 'اسم العلامة', en: 'Brand name' },
                  },
                  {
                    name: 'brandNameLatin',
                    type: 'text',
                    required: true,
                    label: { ar: 'الاسم اللاتيني', en: 'Latin name' },
                  },
                ],
              },
              {
                name: 'tagline',
                type: 'text',
                required: true,
                localized: true,
                label: { ar: 'الشعار النصي', en: 'Tagline' },
              },
              {
                name: 'ctaShiny',
                type: 'checkbox',
                defaultValue: false,
                label: { ar: 'أزرار لامعة', en: 'Shiny buttons' },
              },
            ],
          },
          {
            label: { ar: 'التواصل والحسابات', en: 'Contact & social' },
            fields: [
              {
                name: 'contact',
                type: 'group',
                label: { ar: 'التواصل', en: 'Contact' },
                fields: [
                  {
                    type: 'row',
                    fields: [
                      {
                        name: 'phone',
                        type: 'text',
                        required: true,
                        label: { ar: 'الهاتف (محلي)', en: 'Phone (local)' },
                      },
                      {
                        name: 'phoneIntl',
                        type: 'text',
                        required: true,
                        label: { ar: 'الهاتف (دولي)', en: 'Phone (intl)' },
                      },
                      {
                        name: 'whatsapp',
                        type: 'text',
                        required: true,
                        label: { ar: 'واتساب (أرقام فقط)', en: 'WhatsApp digits' },
                      },
                    ],
                  },
                  {
                    name: 'email',
                    type: 'email',
                    required: true,
                    label: { ar: 'البريد الإلكتروني', en: 'Email' },
                  },
                ],
              },
              {
                name: 'social',
                type: 'group',
                label: { ar: 'الحسابات', en: 'Social' },
                fields: [
                  { name: 'x', type: 'text', required: true, label: 'X' },
                  { name: 'instagram', type: 'text', required: true, label: 'Instagram' },
                  { name: 'tiktok', type: 'text', required: true, label: 'TikTok' },
                ],
              },
            ],
          },
          menu,
          {
            label: { ar: 'الأرقام والكيان', en: 'Numbers & legal' },
            fields: [
              {
                type: 'row',
                fields: [
                  {
                    name: 'welcomeCredit',
                    type: 'number',
                    required: true,
                    min: 0,
                    label: { ar: 'الرصيد الترحيبي (ريال)', en: 'Welcome credit (SAR)' },
                    admin: { description: APP_HELP, step: 1 },
                  },
                  {
                    name: 'deliveryMaxDays',
                    type: 'number',
                    required: true,
                    min: 1,
                    label: { ar: 'أقصى مدة توصيل (أيام)', en: 'Max delivery days' },
                    admin: { description: APP_HELP, step: 1 },
                  },
                ],
              },
              {
                type: 'row',
                fields: [
                  {
                    name: 'deliveryOrigin',
                    type: 'text',
                    required: true,
                    localized: true,
                    label: { ar: 'مدينة الإنتاج', en: 'Origin city' },
                  },
                  {
                    name: 'deliveryRegion',
                    type: 'text',
                    required: true,
                    localized: true,
                    label: { ar: 'المنطقة (للبيانات المنظمة)', en: 'Region (structured data)' },
                  },
                ],
              },
              {
                name: 'bookingUrl',
                type: 'text',
                label: { ar: 'رابط حجز الاستشارة (Cal.com)', en: 'Booking URL' },
                admin: {
                  description: {
                    ar: 'اتركه فارغاً لاستخدام واتساب',
                    en: 'Leave empty to use WhatsApp',
                  },
                },
              },
              {
                name: 'legalEntity',
                type: 'text',
                required: true,
                label: { ar: 'الكيان القانوني', en: 'Legal entity' },
              },
            ],
          },
          {
            label: { ar: 'التحليلات', en: 'Analytics' },
            fields: [
              {
                name: 'analytics',
                type: 'group',
                label: { ar: 'التحليلات', en: 'Analytics' },
                fields: [
                  {
                    name: 'gaId',
                    type: 'text',
                    label: { ar: 'معرّف القياس في Google Analytics', en: 'GA4 measurement id' },
                    validate: (value: unknown) =>
                      !value || /^G-[A-Z0-9]{4,}$/.test(String(value)) || 'G-XXXXXXXXXX',
                  },
                  {
                    type: 'row',
                    fields: [
                      {
                        name: 'umamiSrc',
                        type: 'text',
                        label: { ar: 'رابط سكربت Umami', en: 'Umami script URL' },
                        validate: (value: unknown) =>
                          !value ||
                          umamiSrcAllowed(String(value)) ||
                          'https://cloud.umami.is/script.js or https://umami.b7r.app/script.js',
                      },
                      {
                        name: 'umamiId',
                        type: 'text',
                        label: { ar: 'معرّف الموقع في Umami', en: 'Umami website id' },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      savedByField,
    ],
    SITE_SETTINGS_DESCRIPTIONS,
  ),
};
