import type { Field, PayloadRequest } from 'payload';
import { describe, expect, it } from 'vitest';
import { SEA_MIST } from '@/modules/brand/surfaces';
import { SURFACES_FIELD } from '@/modules/brand/surfaces-field';
import { adminStrings, adminStringsAr } from '@/modules/cms/admin/strings';

type Validate = (value: unknown, options: Record<string, unknown>) => true | string;
const panel = (language: 'ar' | 'en') => ({ i18n: { language } }) as unknown as PayloadRequest;

/** A named field of the row, through its rows. */
function field(fields: Field[], name: string): Field | undefined {
  for (const f of fields) {
    if ('name' in f && f.name === name) return f;
    if (f.type === 'row') {
      const found = field(f.fields, name);
      if (found) return found;
    }
  }
  return undefined;
}

const validate = (name: string) => {
  const found = field(SURFACES_FIELD.fields, name) as { validate?: Validate } | undefined;
  if (!found?.validate) throw new Error(`no validator on surfaces.${name}`);
  return found.validate;
};

const row = { ...SEA_MIST };

const data = (keys: string[]) => ({ surfaces: keys.map((key) => ({ key })) });

describe('a library row’s key (spec 010, phase 1c)', () => {
  it('accepts a new slug', () => {
    expect(validate('key')('dune', { req: panel('en'), data: data(['sea-mist', 'dune']) })).toBe(
      true,
    );
  });

  it('refuses what is not a slug, in the panel’s language', () => {
    expect(validate('key')('Dune Sand', { req: panel('en'), data: data([]) })).toBe(
      adminStrings.appearance.surfaces.key.notSlug,
    );
    expect(validate('key')('Dune Sand', { req: panel('ar'), data: data([]) })).toBe(
      adminStringsAr.appearance.surfaces.key.notSlug,
    );
  });

  it('refuses a key of a set built from the brand, and a key another row has', () => {
    expect(validate('key')('deep-sea', { req: panel('en'), data: data(['deep-sea']) })).toBe(
      adminStrings.appearance.surfaces.key.builtIn,
    );
    expect(validate('key')('dune', { req: panel('en'), data: data(['dune', 'dune']) })).toBe(
      adminStrings.appearance.surfaces.key.taken,
    );
  });
});

describe('a library row’s text colours read at every point of its background', () => {
  it('accepts Sea mist as shipped', () => {
    for (const role of ['text', 'textMuted', 'link']) {
      expect(validate(role)(row[role as 'text'], { req: panel('en'), siblingData: row })).toBe(
        true,
      );
    }
  });

  it('refuses a faint secondary text on Sea mist, saying which way to move', () => {
    const refusal = validate('textMuted')('#7a8896', { req: panel('en'), siblingData: row });
    expect(refusal).toMatch(
      /^Secondary text reads \d\.\d+:1 where this background is darkest and needs 4\.5:1\. Choose a darker colour, or a lighter background\.$/,
    );
    const ar = validate('textMuted')('#7a8896', { req: panel('ar'), siblingData: row });
    expect(ar).toContain('اختر لوناً أغمق أو خلفية أفتح');
  });

  it('asks for a lighter colour when light text fails on a dark background', () => {
    const night = { ...row, kind: 'solid', background: '#0a2f5e', blooms: [], grain: 0 };
    const refusal = validate('text')('#3a5a80', { req: panel('en'), siblingData: night });
    expect(refusal).toContain('where this background is lightest');
    expect(refusal).toContain('Choose a lighter colour, or a darker background.');
  });

  it('refuses a value that is not a colour', () => {
    expect(validate('link')('blue', { req: panel('en'), siblingData: row })).toBe(
      adminStrings.appearance.notAColour,
    );
  });
});
