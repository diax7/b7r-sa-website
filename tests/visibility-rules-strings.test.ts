import { describe, expect, it } from 'vitest';
import { ARABIC, LATIN_ONLY, RULES } from './helpers/arabic-rules';
import { ruleSentences, SNAPSHOTS } from './helpers/visibility-sentences';

/**
 * The rules' own sentences in both languages (ADR-049, ADR-056; the Phase 2 text review):
 * every title, guide, fact and listed document has an English and an Arabic text, the
 * Arabic keeps the ux-araby rules, and no guide names an environment variable, a code path
 * or an arrow (audit 2.19 and 6.3): an owner reads "Admin, Connections". The corpus is
 * `tests/helpers/visibility-sentences.ts`, shared with the glossary test.
 */

const all = ruleSentences();
const guides = all.filter((s) => s.where.endsWith(' guide'));

/** The numbers a sentence carries (not the 7 of B7R, which Arabic writes as بحر برنت), so a threshold quoted in English is quoted in Arabic. */
const digits = (text: string) => (text.match(/(?<![A-Za-z])\d+(?![A-Za-z])/g) ?? []).toSorted();
const placeholders = (text: string) => (text.match(/\{[a-z]+\}/gi) ?? []).toSorted();

describe('the visibility rules speak both languages', () => {
  it('walks every rule, every branch of its guide, and its listed documents', () => {
    const keys = new Set(all.map((s) => s.where.split(': ')[1]?.split(' ')[0]));
    expect(keys.size).toBeGreaterThanOrEqual(24);
    expect(all.filter((s) => s.where.includes(' item ')).length).toBeGreaterThan(10);
    expect(guides.length).toBe(24 * SNAPSHOTS.length);
  });

  it('has a non-empty English and Arabic text for every sentence', () => {
    for (const { where, text } of all) {
      expect(typeof text.en, where).toBe('string');
      expect(typeof text.ar, where).toBe('string');
      expect(text.en.trim(), `empty English: ${where}`).not.toBe('');
      expect(text.ar.trim(), `empty Arabic: ${where}`).not.toBe('');
    }
  });

  it('quotes the same numbers and placeholders in both languages', () => {
    for (const { where, text } of all) {
      expect(digits(text.ar), where).toEqual(digits(text.en));
      expect(placeholders(text.ar), where).toEqual(placeholders(text.en));
    }
  });

  it('writes the Arabic in Arabic unless it is a name, a file or a code', () => {
    for (const { where, text } of all) {
      if (!LATIN_ONLY.test(text.ar)) expect(text.ar, where).toMatch(ARABIC);
    }
    // The titles and the guides always carry words.
    for (const { where, text } of all.filter((s) => /title|guide|fact/.test(s.where))) {
      expect(text.ar, where).toMatch(ARABIC);
      expect(text.en, where).toMatch(/[A-Za-z]/);
    }
  });

  for (const rule of RULES) {
    it(`the Arabic keeps the rule: ${rule.name}`, () => {
      const offenders = all
        .filter(({ text }) => rule.bad.test(text.ar))
        .map(({ where, text }) => `${where}: ${text.ar}`);
      expect(offenders).toEqual([]);
    });
  }

  it('names no arrow, no environment variable and no code path in either language (audit 2.19, 6.3)', () => {
    const banned = [
      { name: 'an arrow', bad: /→|←|->/ },
      { name: 'B7R_RUNTIME', bad: /B7R_RUNTIME/ },
      { name: 'an environment variable', bad: /\b[A-Z][A-Z0-9]*_[A-Z0-9_]+\b/ },
      { name: 'an admin path', bad: /admin\// },
      { name: 'an em dash', bad: new RegExp(String.fromCharCode(0x2014)) },
    ];
    for (const { name, bad } of banned) {
      const offenders = all.flatMap(({ where, text }) =>
        (['en', 'ar'] as const)
          .filter((language) => bad.test(text[language]))
          .map((language) => `${where} (${language}, ${name}): ${text[language]}`),
      );
      expect(offenders).toEqual([]);
    }
  });
});
