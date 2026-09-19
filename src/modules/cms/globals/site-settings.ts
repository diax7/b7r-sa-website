import type { Field, GlobalConfig, NamedTab, PayloadRequest } from 'payload';
import { hiddenUnlessAdmin, isAdmin } from '@/modules/cms/access';
import { revalidateGlobal } from '@/modules/cms/hooks/revalidate';
import { applyGlobalTranslations } from '@/modules/cms/hooks/translations';
import { umamiSrcAllowed } from '@/lib/security-headers';
import { inLanguage } from '@/modules/cms/fields/message';
import { savedByField, stampSavedByGlobal } from '@/modules/cms/fields/saved-by';
import { globalComponents } from '@/modules/cms/admin/document/config';
import { adminGroup, sectionIcon } from '@/modules/cms/admin/icons';
import { SITE_SETTINGS_DESCRIPTIONS } from '@/modules/cms/admin/descriptions/site';
import { describeFields } from '@/modules/cms/admin/descriptions/describe';

type Validation = { req: PayloadRequest };

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
        validate: (value: unknown, { req }: Validation) =>
          typeof value === 'string' && value.startsWith('/')
            ? true
            : inLanguage(req, { ar: 'الرابط يبدأ بـ /', en: 'The link starts with /' }),
      },
      {
        name: 'matchPrefix',
        type: 'text',
        label: { ar: 'يبقى مُعلَّماً للمسارات التي تبدأ بـ', en: 'Highlight on paths starting with' },
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
  admin: sectionIcon('menus'),
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
      label: { ar: 'روابط الترويسة (6)', en: 'Header links (6)' },
      fields: navItem,
    },
    {
      name: 'policies',
      type: 'array',
      required: true,
      minRows: 4,
      maxRows: 4,
      label: { ar: 'روابط السياسات في التذييل (4)', en: 'Footer policy links (4)' },
      fields: navItem,
    },
    {
      name: 'ctaLabel',
      type: 'text',
      required: true,
      localized: true,
      label: { ar: 'زر الترويسة', en: 'Header button' },
    },

    // Three strings an editor rarely touches (audit 2026-09-18, 2.15, 3.8): a collapsed
    // group at the foot of the tab, still editable (Dhia's exception to ADR-031).
    {
      type: 'collapsible',
      label: { ar: 'متقدّم', en: 'Advanced' },
      admin: {
        ...sectionIcon('advanced'),
        initCollapsed: true,
        description: {
          ar: 'ثلاث عبارات يقرؤها قارئ الشاشة ولوحة المفاتيح؛ نادراً ما تتغيّر.',
          en: 'Three strings a screen reader and the keyboard use; they rarely change.',
        },
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'skipLinkLabel',
              type: 'text',
              required: true,
              localized: true,
              label: { ar: 'رابط التخطي', en: 'Skip link' },
            },
            {
              name: 'menuOpenLabel',
              type: 'text',
              required: true,
              localized: true,
              label: { ar: 'فتح القائمة', en: 'Menu open' },
            },
            {
              name: 'menuCloseLabel',
              type: 'text',
              required: true,
              localized: true,
              label: { ar: 'إغلاق القائمة', en: 'Menu close' },
            },
          ],
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
    hideAPIURL: true,
    components: globalComponents('site-settings'),
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
            admin: sectionIcon('brand'),
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
                label: { ar: 'الجملة التعريفية', en: 'Tagline' },
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
            admin: sectionIcon('contact'),
            fields: [
              {
                name: 'contact',
                type: 'group',
                label: { ar: 'التواصل', en: 'Contact' },
                admin: sectionIcon('phone'),
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
                        label: { ar: 'الهاتف (دولي)', en: 'Phone (international)' },
                      },
                      {
                        name: 'whatsapp',
                        type: 'text',
                        required: true,
                        label: { ar: 'WhatsApp (أرقام فقط)', en: 'WhatsApp digits' },
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
                admin: sectionIcon('social'),
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
            label: { ar: 'الأرقام والتوصيل', en: 'Numbers and delivery' },
            admin: sectionIcon('delivery'),
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
                    admin: { step: 1 },
                  },
                  {
                    name: 'deliveryMaxDays',
                    type: 'number',
                    required: true,
                    min: 1,
                    label: { ar: 'أقصى مدة توصيل (أيام)', en: 'Max delivery days' },
                    admin: { step: 1 },
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
                    label: { ar: 'مدينة الشحن', en: 'Shipping city' },
                  },
                  {
                    name: 'deliveryRegion',
                    type: 'text',
                    required: true,
                    localized: true,
                    label: { ar: 'المنطقة (لمحركات البحث)', en: 'Region (for search engines)' },
                  },
                ],
              },
              {
                name: 'bookingUrl',
                type: 'text',
                label: {
                  ar: 'رابط حجز الاستشارة (Cal.com)',
                  en: 'Consultation booking link (Cal.com)',
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
            admin: sectionIcon('analytics'),
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
                    validate: (value: unknown, { req }: Validation) =>
                      !value ||
                      /^G-[A-Z0-9]{4,}$/.test(String(value)) ||
                      inLanguage(req, {
                        ar: 'بصيغة G-XXXXXXXXXX',
                        en: 'In the form G-XXXXXXXXXX',
                      }),
                  },
                  {
                    type: 'row',
                    fields: [
                      {
                        name: 'umamiSrc',
                        type: 'text',
                        label: { ar: 'رابط سكربت Umami', en: 'Umami script URL' },
                        validate: (value: unknown, { req }: Validation) =>
                          !value ||
                          umamiSrcAllowed(String(value)) ||
                          inLanguage(req, {
                            ar: 'https://cloud.umami.is/script.js أو https://umami.b7r.app/script.js',
                            en: 'https://cloud.umami.is/script.js or https://umami.b7r.app/script.js',
                          }),
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
