import type { ArrayField, Field, PayloadRequest } from 'payload';
import { surfaceRoleVerdict } from '@/modules/brand/admin/refusal';
import {
  BUILT_IN_SURFACES,
  GRAIN_MAX,
  isSurfaceKey,
  MAX_BLOOMS,
  seaMistRow,
  type SurfaceRole,
  toSurfaceSet,
} from '@/modules/brand/surfaces';
import { toHex } from '@/modules/brand/types';
import { adminStringsFor } from '@/modules/cms/admin/strings';

type Validation = {
  req: PayloadRequest;
  data: Partial<Record<string, unknown>>;
  siblingData: Partial<Record<string, unknown>>;
};

const language = (req: PayloadRequest | undefined) => req?.i18n?.language ?? 'en';
const COLOR_FIELD = '@/modules/cms/admin/fields/color-field#ColorField';
const isGradient = (_: unknown, sibling: Partial<Record<string, unknown>> | undefined) =>
  sibling?.['kind'] === 'gradient';

/** A key: a slug, not one of the three built from the brand, and no other row's. */
function validateKey(value: unknown, { req, data }: Validation): true | string {
  const s = adminStringsFor(language(req)).appearance.surfaces.key;
  if (!isSurfaceKey(value)) return s.notSlug;
  if ((BUILT_IN_SURFACES as readonly string[]).includes(value)) return s.builtIn;
  const rows = Array.isArray(data['surfaces'])
    ? (data['surfaces'] as Array<{ key?: unknown }>)
    : [];
  return rows.filter((row) => row.key === value).length > 1 ? s.taken : true;
}

const notAColour = (req: PayloadRequest | undefined) =>
  adminStringsFor(language(req)).appearance.notAColour;

/** A colour of the row: refused when it is not one. */
function colour(name: string, label: { ar: string; en: string }): Field {
  return {
    name,
    type: 'text',
    required: true,
    label,
    admin: { components: { Field: COLOR_FIELD } },
    hooks: { beforeChange: [({ value }) => toHex(value) ?? value] },
    validate: (value: unknown, { req }: Validation) => (toHex(value) ? true : notAColour(req)),
  };
}

/** A text colour of the row: refused unless it reads 4.5:1 at every point of the background. */
function textColour(role: SurfaceRole, label: { ar: string; en: string }): Field {
  return {
    ...colour(role, label),
    validate: (value: unknown, { req, siblingData }: Validation) => {
      if (!toHex(value)) return notAColour(req);
      return surfaceRoleVerdict(
        toSurfaceSet({ ...siblingData, [role]: value }),
        role,
        language(req),
      );
    },
  } as Field;
}

/** A bloom's number: four to a row, each a quarter of it. */
function percent(name: string, label: { ar: string; en: string }, range: [number, number]): Field {
  return {
    name,
    type: 'number',
    required: true,
    min: range[0],
    max: range[1],
    label,
    admin: { width: '25%' },
  };
}

const BLOOMS: ArrayField = {
  name: 'blooms',
  type: 'array',
  maxRows: MAX_BLOOMS,
  label: { ar: 'بقع اللون', en: 'Blooms' },
  labels: {
    singular: { ar: 'بقعة لون', en: 'Bloom' },
    plural: { ar: 'بقع اللون', en: 'Blooms' },
  },
  admin: { condition: isGradient },
  fields: [
    colour('colour', { ar: 'اللون', en: 'Colour' }),
    {
      type: 'row',
      fields: [
        percent('x', { ar: 'الموضع الأفقي (%)', en: 'Across (%)' }, [-50, 150]),
        percent('y', { ar: 'الموضع الرأسي (%)', en: 'Down (%)' }, [-50, 150]),
        percent('width', { ar: 'العرض (%)', en: 'Width (%)' }, [1, 200]),
        percent('height', { ar: 'الارتفاع (%)', en: 'Height (%)' }, [1, 200]),
      ],
    },
  ],
};

/**
 * The library of background sets (spec 010, phase 1c): the sets the brand cannot derive, each
 * with its colour or gradient, its text, secondary text and link colours, and its button. A
 * text colour that does not read at every point of the field, grain counted, is refused on
 * the colour itself. The three sets built from the brand are not rows: they follow the brand
 * colours in `globals.css` and cannot be deleted, so a row may not take their keys.
 */
export const SURFACES_FIELD: ArrayField = {
  name: 'surfaces',
  type: 'array',
  label: { ar: 'خلفيات أخرى', en: 'More backgrounds' },
  labels: {
    singular: { ar: 'خلفية', en: 'Background' },
    plural: { ar: 'خلفيات', en: 'Backgrounds' },
  },
  defaultValue: ({ locale }: { locale?: string }) => [seaMistRow(locale)],
  admin: {
    components: { RowLabel: '@/modules/brand/admin/surface-row-label#SurfaceRowLabel' },
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
          localized: true,
          label: { ar: 'الاسم', en: 'Name' },
        },
        {
          name: 'key',
          type: 'text',
          required: true,
          label: { ar: 'المفتاح', en: 'Key' },
          validate: validateKey,
        },
      ],
    },
    {
      name: 'preview',
      type: 'ui',
      admin: { components: { Field: '@/modules/brand/admin/surface-preview#SurfacePreview' } },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'kind',
          type: 'select',
          required: true,
          defaultValue: 'solid',
          label: { ar: 'النوع', en: 'Kind' },
          options: [
            { value: 'solid', label: { ar: 'لون واحد', en: 'One colour' } },
            { value: 'gradient', label: { ar: 'تدرّج', en: 'Gradient' } },
          ],
        },
        colour('background', { ar: 'لون الخلفية', en: 'Background colour' }),
        {
          name: 'button',
          type: 'select',
          required: true,
          defaultValue: 'primary',
          label: { ar: 'الزر', en: 'Button' },
          options: [
            { value: 'primary', label: { ar: 'الأزرق الأساسي', en: 'Primary blue' } },
            { value: 'inverse', label: { ar: 'الزر الأبيض', en: 'White button' } },
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        textColour('text', { ar: 'لون النص', en: 'Text colour' }),
        textColour('textMuted', { ar: 'لون النص الثانوي', en: 'Secondary text colour' }),
        textColour('link', { ar: 'لون الروابط', en: 'Link colour' }),
      ],
    },
    BLOOMS,
    {
      name: 'grain',
      type: 'number',
      min: 0,
      max: GRAIN_MAX,
      defaultValue: 0,
      label: { ar: 'الحبيبات', en: 'Grain' },
      admin: { condition: isGradient, step: 0.01 },
    },
  ],
};
