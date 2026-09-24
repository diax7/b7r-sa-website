import type { Field, GlobalAfterChangeHook, GlobalConfig, PayloadRequest } from 'payload';
import { fieldVerdict } from '@/modules/brand/admin/refusal';
import { APP_ICON_ROUTES } from '@/modules/brand/app-icons';
import {
  APPEARANCE,
  DERIVED_KEYS,
  readPins,
  type SourceKey,
  toAppearance,
} from '@/modules/brand/appearance';
import { DEFAULT_SOURCES } from '@/modules/brand/defaults';
import { APPEARANCE_DESCRIPTIONS } from '@/modules/brand/descriptions';
import { SURFACES_FIELD } from '@/modules/brand/surfaces-field';
import { toHex } from '@/modules/brand/types';
import { DEFAULT_TYPEFACE, TYPEFACE_KEYS, TYPEFACES } from '@/modules/brand/typefaces';
import { hiddenUnlessAdmin, isAdmin } from '@/modules/cms/access';
import { describeFields } from '@/modules/cms/admin/descriptions/describe';
import { globalComponents } from '@/modules/cms/admin/document/config';
import { adminGroup, sectionIcon } from '@/modules/cms/admin/icons';
import { adminStringsFor } from '@/modules/cms/admin/strings';
import { savedByField, stampSavedByGlobal } from '@/modules/cms/fields/saved-by';
import { applyGlobalTranslations } from '@/modules/cms/hooks/translations';
import {
  BLOG_LISTING_PATTERNS,
  safeRevalidatePath,
  shouldRevalidate,
  STATIC_ROUTES,
  withEnglish,
} from '@/modules/cms/hooks/revalidate';

type Validation = { req: PayloadRequest; data: Partial<Record<string, unknown>> };

const language = (req: PayloadRequest | undefined) => req?.i18n?.language ?? 'en';

/**
 * The document routes every page belongs to, as patterns: every one sets `dynamicParams =
 * true`, so revalidating a pattern is safe (ADR-030's 404 comes only with `false`).
 */
const DOCUMENT_PATTERNS = [
  ...withEnglish(['/products/[slug]', '/[slug]', '/blog/[slug]', '/author/[slug]/page/[n]']),
  ...BLOG_LISTING_PATTERNS,
];

/**
 * A save repaints every page (the colours and the typeface are in the head of all of them)
 * and redraws the app icons and the manifest. No IndexNow ping, since no page's content
 * changed.
 */
const revalidateAppearance: GlobalAfterChangeHook = ({ doc, req }) => {
  if (!shouldRevalidate(req)) return doc;
  for (const path of [...STATIC_ROUTES, ...APP_ICON_ROUTES]) safeRevalidatePath(path);
  for (const pattern of DOCUMENT_PATTERNS) safeRevalidatePath(pattern, console, 'page');
  return doc;
};

/** One of the five brand colours: a picker, refused when it is not a colour or breaks a pair. */
function sourceField(key: SourceKey, label: { ar: string; en: string }): Field {
  return {
    name: key,
    type: 'text',
    required: true,
    defaultValue: DEFAULT_SOURCES[key],
    label,
    admin: { components: { Field: '@/modules/cms/admin/fields/color-field#ColorField' } },
    // Stored as the site reads it: lowercase, trimmed.
    hooks: { beforeChange: [({ value }) => toHex(value) ?? value] },
    validate: (value: unknown, { req, data }: Validation) => {
      if (!toHex(value)) return adminStringsFor(language(req)).appearance.notAColour;
      const { brand } = toAppearance(data).appearance;
      return fieldVerdict(brand, { kind: 'source', key }, language(req));
    },
  };
}

/**
 * The derived colours an editor set by hand, each refused when it breaks a pair. A list the
 * strip did not write (a malformed API write) is refused, never quietly dropped.
 */
function validatePins(value: unknown, { req, data }: Validation): true | string {
  const { problems } = readPins(value);
  if (problems.length > 0) return adminStringsFor(language(req)).appearance.notAColour;
  const { brand } = toAppearance({ ...data, pins: value }).appearance;
  for (const key of DERIVED_KEYS) {
    if (!brand.pinned[key]) continue;
    const verdict = fieldVerdict(brand, { kind: 'pin', key }, language(req));
    if (verdict !== true) return verdict;
  }
  return true;
}

const LOGO_UPLOADS: Array<{ name: string; label: { ar: string; en: string } }> = [
  { name: 'logoPrimary', label: { ar: 'الشعار الملوّن', en: 'Colour logo' } },
  { name: 'logoOnDark', label: { ar: 'الشعار على الداكن', en: 'Logo on dark' } },
];

/**
 * How the site looks (spec 010, ADR-065): the five brand colours and the colours computed
 * from them, the typeface and the logo. Admin only, like the site settings; the site reads it
 * with access overridden through `getAppearance()`, and a never-saved global reads as the
 * shipped brand exactly. Every value an editor sets is refused when it breaks a pair of the
 * contrast check, in their language, naming the pair and the change that fixes it.
 */
export const Appearance: GlobalConfig = {
  slug: APPEARANCE,
  label: { ar: 'المظهر', en: 'Appearance' },
  admin: {
    hideAPIURL: true,
    components: globalComponents(APPEARANCE),
    group: adminGroup('site'),
    custom: {
      shows: {
        ar: 'كل صفحات الموقع، واللوحة لخطها',
        en: 'every page of the site, and the panel for its typeface',
      },
    },
    hidden: hiddenUnlessAdmin,
    description: {
      ar: 'ألوان كل صفحة وخطها وشعارها؛ يتبعها الموقع كله عند الحفظ.',
      en: 'The colours, the typeface and the logo of every page; the whole site follows on save.',
    },
  },
  access: { read: isAdmin, update: isAdmin },
  hooks: {
    beforeChange: [stampSavedByGlobal],
    afterChange: [revalidateAppearance, applyGlobalTranslations],
  },
  fields: describeFields(
    [
      {
        type: 'tabs',
        tabs: [
          {
            label: { ar: 'الألوان', en: 'Colours' },
            admin: sectionIcon('colours'),
            fields: [
              {
                name: 'sources',
                type: 'group',
                label: { ar: 'ألوان العلامة', en: 'Brand colours' },
                admin: sectionIcon('brandColours'),
                fields: [
                  {
                    type: 'row',
                    fields: [
                      sourceField('primary', { ar: 'اللون الأساسي', en: 'Primary' }),
                      sourceField('primaryDark', { ar: 'الأساسي الداكن', en: 'Primary dark' }),
                      sourceField('accent', { ar: 'لون التمييز', en: 'Accent' }),
                    ],
                  },
                  {
                    type: 'row',
                    fields: [
                      sourceField('navy', { ar: 'الكحلي', en: 'Navy' }),
                      sourceField('ink', { ar: 'لون النص', en: 'Ink' }),
                    ],
                  },
                ],
              },
              {
                name: 'pins',
                type: 'json',
                label: { ar: 'الألوان المشتقة', en: 'Derived colours' },
                defaultValue: [],
                validate: validatePins,
                admin: {
                  components: { Field: '@/modules/brand/admin/derived-strip#DerivedStrip' },
                },
              },
              {
                name: 'contrastCheck',
                type: 'ui',
                admin: {
                  components: { Field: '@/modules/brand/admin/contrast-verdict#ContrastVerdict' },
                },
              },
            ],
          },
          {
            label: { ar: 'الخط', en: 'Typeface' },
            admin: sectionIcon('typeface'),
            fields: [
              {
                name: 'typeface',
                type: 'select',
                required: true,
                defaultValue: DEFAULT_TYPEFACE,
                label: { ar: 'الخط', en: 'Typeface' },
                options: TYPEFACE_KEYS.map((key) => ({
                  value: key,
                  label: { ar: TYPEFACES[key].family, en: TYPEFACES[key].family },
                })),
              },
              {
                name: 'typefacePreview',
                type: 'ui',
                admin: {
                  components: { Field: '@/modules/brand/admin/typeface-preview#TypefacePreview' },
                },
              },
            ],
          },
          {
            label: { ar: 'الشعار', en: 'Logo' },
            admin: sectionIcon('logo'),
            fields: LOGO_UPLOADS.map(({ name, label }): Field => ({
              name,
              type: 'upload',
              relationTo: 'media',
              label,
            })),
          },
          {
            label: { ar: 'الخلفيات', en: 'Backgrounds' },
            admin: sectionIcon('backgrounds'),
            fields: [
              {
                name: 'builtInSurfaces',
                type: 'ui',
                admin: {
                  components: { Field: '@/modules/brand/admin/built-in-surfaces#BuiltInSurfaces' },
                },
              },
              SURFACES_FIELD,
            ],
          },
        ],
      },
      {
        name: 'notFollowing',
        type: 'ui',
        admin: {
          position: 'sidebar',
          components: { Field: '@/modules/brand/admin/not-following-panel#NotFollowingPanel' },
        },
      },
      savedByField,
    ],
    APPEARANCE_DESCRIPTIONS,
  ),
};
