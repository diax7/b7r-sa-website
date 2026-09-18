import { describe, expect, it } from 'vitest';
import { payloadArabic } from '@/modules/cms/admin/payload-ar';
import {
  adminDirection,
  adminStrings,
  adminStringsAr,
  adminStringsFor,
} from '@/modules/cms/admin/strings';
import { ARABIC, LATIN_ONLY, RULES } from './helpers/arabic-rules';

/**
 * The panel's two languages (ADR-056): every leaf of the English tree has an Arabic
 * counterpart of the same kind, the Arabic keeps the ux-araby rules the design system (§5)
 * lists, and the resolver hands the right tree to a language.
 */
type Leaf = { path: string; value: unknown };

function leaves(tree: unknown, path = ''): Leaf[] {
  if (typeof tree === 'string' || typeof tree === 'function' || Array.isArray(tree)) {
    return [{ path, value: tree }];
  }
  if (typeof tree === 'object' && tree !== null) {
    return Object.entries(tree).flatMap(([key, value]) =>
      leaves(value, path ? `${path}.${key}` : key),
    );
  }
  return [{ path, value: tree }];
}

/** The values a leaf renders, whatever its kind, so the rules read functions and lists too. */
function rendered(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'function') {
    const fn = value as (...args: unknown[]) => string;
    return [fn('X', 1), fn(1, 1), fn(2, 2), fn(7, 3), fn(30, 10)];
  }
  return [];
}

const englishLeaves = leaves(adminStrings);
const arabicLeaves = leaves(adminStringsAr);
const arabicByPath = new Map(arabicLeaves.map((l) => [l.path, l.value]));

describe('adminStrings: both languages, the same tree', () => {
  it('has a leaf in Arabic for every English one, of the same kind, and nothing extra', () => {
    expect(englishLeaves.length).toBeGreaterThan(200);
    for (const { path, value } of englishLeaves) {
      const ar = arabicByPath.get(path);
      expect(ar, `missing Arabic: ${path}`).toBeDefined();
      expect(typeof ar, `kind of ${path}`).toBe(typeof value);
      if (Array.isArray(value)) expect((ar as unknown[]).length, path).toBe(value.length);
    }
    expect(arabicLeaves.map((l) => l.path).toSorted()).toEqual(
      englishLeaves.map((l) => l.path).toSorted(),
    );
  });

  it('writes every Arabic leaf in Arabic unless it is a brand, a code or a placeholder', () => {
    for (const { path, value } of arabicLeaves) {
      for (const text of rendered(value)) {
        expect(text.trim(), `empty: ${path}`).not.toBe('');
        if (!LATIN_ONLY.test(text)) expect(text, `not Arabic: ${path}`).toMatch(ARABIC);
      }
    }
  });

  it('keeps every {placeholder} of the English string in the Arabic one', () => {
    for (const { path, value } of englishLeaves) {
      if (typeof value !== 'string') continue;
      const placeholders = [...value.matchAll(/\{[a-z]+\}/gi)].map((m) => m[0]);
      const ar = arabicByPath.get(path) as string;
      for (const p of placeholders) expect(ar, `${path} lost ${p}`).toContain(p);
    }
  });
});

/** The ux-araby rules a regular expression can read (design system §5): `tests/helpers/arabic-rules.ts`. */
describe('the Arabic strings under the ux-araby rules', () => {
  for (const rule of RULES) {
    it(rule.name, () => {
      const offenders = arabicLeaves.flatMap(({ path, value }) =>
        rendered(value)
          .filter((text) => rule.bad.test(text))
          .map((text) => `${path}: ${text}`),
      );
      expect(offenders).toEqual([]);
    });
  }
});

describe("our Arabic over Payload's pack", () => {
  const overrides = leaves(payloadArabic);
  it('is Arabic and keeps the ux-araby rules', () => {
    expect(overrides.length).toBeGreaterThan(50);
    for (const rule of RULES) {
      const offenders = overrides
        .filter(({ value }) => typeof value === 'string' && rule.bad.test(value))
        .map(({ path, value }) => `${path}: ${String(value)}`);
      expect(offenders, rule.name).toEqual([]);
    }
    for (const { path, value } of overrides) expect(value, path).toMatch(ARABIC);
  });
  it("keeps Payload's {{placeholders}} untranslated", () => {
    for (const { path, value } of overrides) {
      for (const m of String(value).matchAll(/\{\{([^}]+)\}\}/g)) {
        expect(m[1], path).toMatch(/^[A-Za-z]+$/);
      }
    }
  });
  it("replaces the pack's leaked instruction and its untranslated key", () => {
    expect(payloadArabic.general?.restoring).toBe('جارٍ الاستعادة…');
    expect(payloadArabic.fields?.toggleBlock).toMatch(ARABIC);
  });
});

describe('adminStringsFor and adminDirection', () => {
  it('hands Arabic to `ar` and English to anything else', () => {
    expect(adminStringsFor('ar')).toBe(adminStringsAr);
    expect(adminStringsFor('en')).toBe(adminStrings);
    expect(adminStringsFor('fr')).toBe(adminStrings);
    expect(adminStringsFor('')).toBe(adminStrings);
  });
  it('agrees with Payload on the document direction', () => {
    expect(adminDirection('ar')).toBe('rtl');
    expect(adminDirection('en')).toBe('ltr');
    expect(adminDirection('fr')).toBe('ltr');
  });
  it('keeps the content locale and the UI language apart: the note is keyed by locale in each language', () => {
    expect(adminStringsFor('ar').locale.editing['en']).toMatch(ARABIC);
    expect(adminStringsFor('en').locale.editing['ar']).toBe('Editing the Arabic content.');
  });
  it('counts days with the Arabic plurals', () => {
    const { days } = adminStringsAr.traffic.page;
    expect(days(1)).toBe('يوم');
    expect(days(2)).toBe('يومين');
    expect(days(7)).toBe('7 أيام');
    expect(days(30)).toBe('30 يوماً');
    expect(adminStringsAr.visibility.ledger.every(14)).toBe('(كل 14 يوماً)');
  });
});
