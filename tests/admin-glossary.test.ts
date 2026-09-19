import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ar as siteCopy } from '@/content/copy/ar';
import {
  GLOSSARY,
  type GlossaryRow,
  refusedForm,
  renderGlossary,
  stripDiacritics,
} from '@/modules/cms/admin/glossary';
import { payloadArabic } from '@/modules/cms/admin/payload-ar';
import { adminStringsAr } from '@/modules/cms/admin/strings';
import { configTexts } from './helpers/config-texts';
import { ruleSentences } from './helpers/visibility-sentences';

/**
 * The glossary gates the panel's Arabic (ADR-046 "one word per thing", the 2026-09-19 words
 * pass): a Latin-kept term never appears translated, and a concept's settled word never
 * varies, across every Arabic sentence the panel shows. The site's copy is BRD-verbatim
 * and Dhia's own words: the same walk prints a report over it and asserts nothing.
 */
interface Corpus {
  where: string;
  text: string;
}

function leaves(tree: unknown, path = ''): Corpus[] {
  if (typeof tree === 'string') return [{ where: path, text: tree }];
  if (Array.isArray(tree)) return tree.map((t, i) => ({ where: `${path}[${i}]`, text: String(t) }));
  if (typeof tree === 'function') {
    const fn = tree as (...args: unknown[]) => string;
    return [fn('X', 1), fn(1, 1), fn(2, 2), fn(7, 3), fn(30, 10)].map((text, i) => ({
      where: `${path}(${i})`,
      text,
    }));
  }
  if (typeof tree === 'object' && tree !== null) {
    return Object.entries(tree).flatMap(([key, value]) =>
      leaves(value, path ? `${path}.${key}` : key),
    );
  }
  return [];
}

/** Every Arabic sentence the panel shows, with where it lives. */
function panelCorpus(): Corpus[] {
  return [
    ...leaves(adminStringsAr, 'strings'),
    ...leaves(payloadArabic, 'payload-ar'),
    ...configTexts().map(({ where, kind, ar }) => ({ where: `${where} ${kind}`, text: ar })),
    ...ruleSentences().map(({ where, text }) => ({ where: `rules ${where}`, text: text.ar })),
  ];
}

function offenders(corpus: Corpus[], row: GlossaryRow): string[] {
  return row.refused.flatMap((form) => {
    const pattern = refusedForm(form);
    return corpus
      .filter(({ text }) => pattern.test(stripDiacritics(text)))
      .map(({ where, text }) => `${row.en}: «${form}» in ${where}: ${text}`);
  });
}

const panel = panelCorpus();

describe('the glossary (docs/ADMIN-GLOSSARY.md)', () => {
  it('is rendered from the table: the document and the data agree', () => {
    const doc = readFileSync(join(process.cwd(), 'docs', 'ADMIN-GLOSSARY.md'), 'utf8');
    expect(doc.replace(/\r\n/g, '\n')).toBe(renderGlossary());
  });

  it('names every concept once, with an Arabic word or a Latin term, and no refused form twice', () => {
    const seen = new Set<string>();
    for (const row of GLOSSARY) {
      expect(seen.has(row.en), `twice: ${row.en}`).toBe(false);
      seen.add(row.en);
      expect(row.ar.trim(), row.en).not.toBe('');
      if (!row.latin) expect(row.ar, `${row.en}: an Arabic word`).toMatch(/[؀-ۿ]/);
      for (const form of row.refused) {
        expect(form.trim(), `${row.en}: empty form`).not.toBe('');
        expect(
          refusedForm(form).test(stripDiacritics(row.ar)),
          `${row.en} refuses its own word «${form}»`,
        ).toBe(false);
      }
    }
    const forms = GLOSSARY.flatMap((r) => r.refused);
    expect(forms.length).toBe(new Set(forms).size);
  });

  it('reads a whole panel: the string trees, the Payload overrides, every config text, the rules', () => {
    expect(panel.filter((c) => c.where.startsWith('strings.')).length).toBeGreaterThan(250);
    expect(panel.filter((c) => c.where.startsWith('payload-ar.')).length).toBeGreaterThan(150);
    expect(
      panel.filter((c) => / (label|description|option|tab|shows)$/.test(c.where)).length,
    ).toBeGreaterThan(700);
    expect(panel.filter((c) => c.where.startsWith('rules ')).length).toBeGreaterThan(100);
  });

  it('matches a refused form as a whole word, after a clitic or the article, never inside a longer word', () => {
    const cap = refusedForm('سقف');
    expect(cap.test('سقف التكلفة')).toBe(true);
    expect(cap.test('بلا سقف')).toBe(true);
    expect(cap.test('والسقف الشهري')).toBe(true);
    expect(cap.test('للسقف')).toBe(true);
    expect(cap.test('سقفه')).toBe(false);
    expect(cap.test('الأسقف')).toBe(false);
    const ledger = refusedForm('سجل الاستشهاد');
    expect(ledger.test('سجل الاستشهادات')).toBe(false);
    expect(ledger.test('جولة سجل الاستشهاد الصباحية')).toBe(true);
    const on = refusedForm('مشغل');
    expect(on.test(stripDiacritics('المحرّك مُشغَّل'))).toBe(true);
    // The clitic «ب» is allowed before a form, so a short form can trip on a longer word:
    // the table lists forms long enough not to («نية» is not one).
    expect(refusedForm('نية').test('بنية الصفحة')).toBe(true);
  });
});

describe('the panel keeps the glossary', () => {
  for (const row of GLOSSARY.filter((r) => r.latin && r.refused.length > 0)) {
    it(`${row.en} stays Latin: never ${row.refused.map((f) => `«${f}»`).join(', ')}`, () => {
      expect(offenders(panel, row)).toEqual([]);
    });
  }
  for (const row of GLOSSARY.filter((r) => !r.latin && r.refused.length > 0)) {
    it(`${row.en} is «${row.ar}»: never ${row.refused.map((f) => `«${f}»`).join(', ')}`, () => {
      expect(offenders(panel, row)).toEqual([]);
    });
  }
});

describe("the site's Arabic copy, reported and never gated (BRD-verbatim)", () => {
  it('prints where the site copy differs from the panel glossary', () => {
    const site = leaves(siteCopy, 'copy.ar');
    expect(site.length).toBeGreaterThan(100);
    const report = GLOSSARY.flatMap((row) => offenders(site, row));
    const lines = [
      `site copy: ${site.length} strings read, ${report.length} glossary differences (not gated)`,
      ...report.map((line) => `  ${line}`),
    ];
    console.log(lines.join('\n'));
  });
});
