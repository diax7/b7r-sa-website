import { describe, expect, it } from 'vitest';
import { CHECKLIST_ITEMS } from '@/modules/visibility/rules/rest';
import { facts, findings } from '@/modules/visibility/score';
import type { Snapshot, Text } from '@/modules/visibility/types';
import { ARABIC, LATIN_ONLY, RULES } from './helpers/arabic-rules';
import { body, filled, paragraph } from './helpers/visibility-snapshot';

/**
 * The rules' own sentences in both languages (ADR-049, ADR-056; the Phase 2 text review):
 * every title, guide, fact and listed document has an English and an Arabic text, the
 * Arabic keeps the ux-araby rules, and no guide names an environment variable, a code path
 * or an arrow (audit 2.19 and 6.3): an owner reads "Admin, Connections".
 */

/** The snapshots that walk every branch of every rule's guide and fact. */
const SNAPSHOTS: Array<{ name: string; snapshot: Snapshot }> = [
  { name: 'filled', snapshot: filled() },
  {
    name: 'services connected, GEO pages present, GA4 off, Arabic only',
    snapshot: filled({
      englishOn: false,
      gaConfigured: false,
      pages: [
        {
          id: 9,
          slug: 'faq',
          title: { ar: 'الأسئلة الشائعة' },
          blocks: [],
          seo: { title: { ar: 'الأسئلة' }, description: { ar: 'كل ما تحتاج معرفته.' } },
        },
        {
          id: 8,
          slug: 'compare-printful',
          title: { ar: 'مقارنة' },
          blocks: [{ type: 'compare', asOf: '2026-01-01' }],
          seo: { title: { ar: 'مقارنة' }, description: { ar: 'مقارنة بين بحر برنت وبرينتفل.' } },
        },
      ],
      pagespeed: [{ date: '2026-09-15', mobilePerformance: { '/': 85 } }],
      searchConsole: { impressions: 3, topQueries: ['بحر برنت'] },
      citedRate: { runs: 20, cited: 3 },
      lastLedgerRunAt: '2026-01-01T00:00:00.000Z',
    }),
  },
  {
    name: 'everything failing: every listed document',
    snapshot: filled({
      isProductionSite: false,
      indexNow: false,
      site: { tagline: { ar: 'x' }, social: { x: 'b7rprint', instagram: '', tiktok: '' } },
      routes: [{ route: '/', title: { ar: 'ع'.repeat(80) }, description: { ar: '' } }],
      pages: [],
      posts: [
        {
          ...filled().posts[0]!,
          title: { ar: 'عنوان' },
          seo: { title: {}, description: {} },
          body: { ar: body(paragraph('قصير')) },
        },
      ],
      authors: [{ id: 4, name: { ar: 'ضياء' }, bio: {}, photo: null, sameAs: 0 }],
      media: [{ id: 7, filename: 'a.jpg', alt: { ar: 'ضياء' }, usedBy: ['ضياء', 'b', 'c'] }],
      faqs: [],
      checklist: {},
      landings30d: 0,
      prompts: [],
    }),
  },
];

interface Sentence {
  where: string;
  text: Text;
}

function sentences(): Sentence[] {
  const out: Sentence[] = [];
  for (const { name, snapshot } of SNAPSHOTS) {
    for (const f of findings(snapshot)) {
      out.push({ where: `${name}: ${f.key} title`, text: f.title });
      out.push({ where: `${name}: ${f.key} guide`, text: f.guide });
      for (const item of f.items ?? []) {
        out.push({ where: `${name}: ${f.key} item ${item.href}`, text: item.label });
      }
    }
    for (const [n, fact] of facts(snapshot).entries()) {
      out.push({ where: `${name}: ${fact.section} fact ${n}`, text: fact.text });
    }
  }
  for (const item of CHECKLIST_ITEMS)
    out.push({ where: `checklist ${item.key}`, text: item.label });
  return out;
}

const all = sentences();
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
