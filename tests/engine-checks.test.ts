import { describe, expect, it } from 'vitest';
import { riyadh, riyadhDayStart } from '@/lib/riyadh';
import { capDecision, envAllows } from '@/modules/ai-content/caps';
import {
  bannedPhrasesIn,
  checkDraft,
  deterministicScore,
  statedNumbers,
  unknownNumbers,
} from '@/modules/ai-content/checks';
import { addUsage, estimateCostUsd } from '@/modules/ai-content/cost';
import { duplicateReason, titleOverlap } from '@/modules/ai-content/dedupe';
import { sanitizeLinks } from '@/modules/ai-content/pipeline/links';
import { nextStoredValue, readValue } from '@/modules/cms/fields/secret-field';
import { parseTopicsCsv } from '@/modules/ai-content/topics-import';
import { slugFor, transliterate } from '@/modules/ai-content/transliterate';
import { FACTS, settings } from './helpers/engine-store';

describe('facts sheet (BRD 10.2.1)', () => {
  it('carries every number the prompts may state, with its unit', () => {
    expect(FACTS.text).toContain('45 ريالاً');
    expect(FACTS.text).toContain('خلال 5 أيام');
    expect(FACTS.numbers).toContainEqual({ value: 30, unit: 'sar', label: 'الرصيد الترحيبي' });
    expect(FACTS.numbers).toContainEqual({
      value: 44,
      unit: 'sar',
      label: 'الربح التقديري لـتيشيرت أساسي',
    });
    expect(FACTS.links).toContain('/products/tee-essential');
  });
});

describe('deterministic checks (BRD 10.2.4 step 5)', () => {
  const options = { bannedPhrases: ['قم بـ', 'تم '], minWords: 5, maxWords: 2000 };

  it('extracts numbers with their unit words', () => {
    // The facts sheet spells grams «جم»; a draft's «غرام» or «غراماً» is the same number.
    expect(statedNumbers('وزن 180 جم')).toEqual([{ value: 180, unit: 'g', raw: '180 جم' }]);
    expect(unknownNumbers('وزن 180 غرام', [{ value: 180, unit: 'g', label: 'weight' }])).toEqual(
      [],
    );
    expect(statedNumbers('التكلفة 45 ريالاً والتوصيل خلال 5 أيام ووزن 180 غراماً')).toEqual([
      { value: 45, unit: 'sar', raw: '45 ريالاً' },
      { value: 5, unit: 'days', raw: '5 أيام' },
      { value: 180, unit: 'g', raw: '180 غراماً' },
    ]);
  });

  it('flags a number the sheet does not carry, in the right unit', () => {
    expect(unknownNumbers('التوصيل خلال 5 أيام', FACTS.numbers)).toEqual([]);
    expect(unknownNumbers('التوصيل خلال 3 أيام', FACTS.numbers).map((n) => n.raw)).toEqual([
      '3 أيام',
    ]);
    // 45 is a SAR fact, not a days fact.
    expect(unknownNumbers('خلال 45 يوماً', FACTS.numbers)).toHaveLength(1);
  });

  it('deducts for unknown numbers, banned phrases and Latin paragraphs; refuses dashes and AI', () => {
    const dash = String.fromCharCode(0x2014);
    const text = [
      'التكلفة 45 ريالاً والسعر 120 ريالاً.',
      'قم بـ التسجيل الآن.',
      'This whole paragraph is written in English for no reason.',
      `عبارة ${dash} بشرطة. كتبه الذكاء الاصطناعي.`,
    ].join('\n\n');
    const result = checkDraft(text, FACTS.numbers, options);
    expect(result.deductions.map((d) => d.rule)).toEqual(['numbers', 'bannedPhrase', 'script']);
    expect(result.refused).toEqual(['An em dash in the text', 'A mention of AI in the text']);
    expect(deterministicScore(result)).toBe(100 - 10 - 5 - 10);
  });

  it('reads English units, the English banned phrases and Arabic paragraphs for an English draft (ADR-043)', () => {
    expect(statedNumbers('It costs SAR 45, ships in 5 days and weighs 180 g.', 'en')).toEqual([
      { value: 45, unit: 'sar', raw: 'SAR 45' },
      { value: 5, unit: 'days', raw: '5 days' },
      { value: 180, unit: 'g', raw: '180 g' },
    ]);
    expect(statedNumbers('A profit of 44 riyals on 5 products.', 'en').map((n) => n.unit)).toEqual([
      'sar',
      'count',
    ]);
    expect(unknownNumbers('Delivery in 3 days.', FACTS.numbers, 'en').map((n) => n.raw)).toEqual([
      '3 days',
    ]);
    const text = [
      'The cost is SAR 45 and the price is SAR 120.',
      'Leverage this to unlock growth; we guarantee sales.',
      'هذه فقرة كاملة مكتوبة بالعربية داخل مقال إنجليزي للاختبار.',
    ].join('\n\n');
    const result = checkDraft(text, FACTS.numbers, {
      ...options,
      locale: 'en',
      bannedPhrases: ['leverage', 'unlock'],
    });
    expect(result.deductions.map((d) => d.rule)).toEqual([
      'numbers',
      'bannedPhrase',
      'script',
      'firstPerson',
    ]);
    expect(result.deductions.find((d) => d.rule === 'script')?.detail).toBe(
      '1 paragraph(s) in Arabic script',
    );
    expect(result.deductions.find((d) => d.rule === 'numbers')?.detail).toContain('SAR 120');
  });

  it('matches banned phrases as whole words, and «هناك» at a sentence start only', () => {
    const phrases = ['تم', 'هناك', 'قم بـ'];
    expect(bannedPhrasesIn('تمام، كل شيء موجود هناك.', phrases)).toEqual([]);
    expect(bannedPhrasesIn('تم الحفظ. هناك خطأ.', phrases)).toEqual(['تم', 'هناك']);
    expect(bannedPhrasesIn('قم بـالتسجيل', phrases)).toEqual(['قم بـ']);
  });

  it('deducts for length outside the window', () => {
    const result = checkDraft('قصير جداً', FACTS.numbers, { ...options, minWords: 800 });
    expect(result.deductions.map((d) => d.rule)).toEqual(['length']);
  });
});

describe('dedupe (BRD 10.2.5)', () => {
  it('measures title overlap on meaningful tokens', () => {
    expect(
      titleOverlap('كيف تبدأ براند ملابس في السعودية', 'كيف تبدأ براند ملابس بدون مخزون'),
    ).toBeGreaterThanOrEqual(0.6);
    expect(titleOverlap('تسعير التيشيرت المطبوع', 'ربط متجر سلة بالطباعة')).toBe(0);
  });

  it('rejects a keyword published within twelve months, not an older one', () => {
    const topic = { title: 'دليل تسعير التيشيرت', primaryKeyword: 'تسعير التيشيرت المطبوع' };
    const now = new Date('2026-09-14T00:00:00Z');
    expect(
      duplicateReason(
        topic,
        [
          {
            title: 'x',
            primaryKeyword: 'تسعير التيشيرت المطبوع',
            publishedAt: '2026-01-01T00:00:00Z',
          },
        ],
        now,
      ),
    ).toMatch(/keyword/);
    expect(
      duplicateReason(
        topic,
        [
          {
            title: 'x',
            primaryKeyword: 'تسعير التيشيرت المطبوع',
            publishedAt: '2024-01-01T00:00:00Z',
          },
        ],
        now,
      ),
    ).toBeNull();
    expect(
      duplicateReason(
        topic,
        [
          {
            title: 'دليل: تسعير التيشيرت المطبوع في السعودية',
            publishedAt: '2026-09-01T00:00:00Z',
          },
        ],
        now,
      ),
    ).toMatch(/carries/);
  });
});

describe('caps and the Riyadh clock (BRD 10.2.4, 10.2.5)', () => {
  const base = settings();
  const counts = { runsToday: 0, runsThisMonth: 0, costTodayUsd: 0, connectionSpentMonthUsd: 0 };

  it('reads the hour and the day in Riyadh (UTC+3)', () => {
    expect(riyadh(new Date('2026-09-14T05:30:00Z'))).toEqual({
      hour: 8,
      dateKey: '2026-09-14',
      monthKey: '2026-09',
    });
    expect(riyadh(new Date('2026-09-14T22:30:00Z')).dateKey).toBe('2026-09-15');
    expect(riyadhDayStart(new Date('2026-09-14T22:30:00Z')).toISOString()).toBe(
      '2026-09-14T21:00:00.000Z',
    );
  });

  it('waits for the publish hour, then allows one run a day', () => {
    const early = new Date('2026-09-14T05:30:00Z');
    const late = new Date('2026-09-14T07:30:00Z');
    expect(capDecision({ settings: base, counts, now: early, env: {} })).toMatchObject({
      allowed: false,
      reason: /publish hour/,
    });
    expect(capDecision({ settings: base, counts, now: late, env: {} })).toEqual({
      allowed: true,
      reason: null,
    });
    expect(
      capDecision({ settings: base, counts: { ...counts, runsToday: 1 }, now: late, env: {} }),
    ).toMatchObject({ reason: /today/ });
    expect(capDecision({ settings: base, counts, now: early, manual: true, env: {} })).toEqual({
      allowed: true,
      reason: null,
    });
  });

  it('honours the switch, the env override, the monthly cap and the cost cap', () => {
    const late = new Date('2026-09-14T07:30:00Z');
    expect(
      capDecision({ settings: { ...base, enabled: false }, counts, now: late, env: {} }),
    ).toMatchObject({ reason: /switched off/ });
    expect(
      capDecision({ settings: base, counts, now: late, env: { AI_CONTENT_ENABLED: 'false' } }),
    ).toMatchObject({ reason: /AI_CONTENT_ENABLED/ });
    expect(
      capDecision({ settings: base, counts: { ...counts, runsThisMonth: 31 }, now: late, env: {} }),
    ).toMatchObject({ reason: /month/ });
    expect(
      capDecision({ settings: base, counts: { ...counts, costTodayUsd: 5 }, now: late, env: {} }),
    ).toMatchObject({ reason: /cost/ });
    expect(envAllows({})).toBe(true);
    expect(envAllows({ AI_CONTENT_ENABLED: '0' })).toBe(false);
  });
});

describe('cost estimate', () => {
  it('prices tokens per million and adds usage', () => {
    expect(
      estimateCostUsd(
        { inputTokens: 500_000, outputTokens: 100_000 },
        { inputPerMillionUsd: 2, outputPerMillionUsd: 8 },
      ),
    ).toBe(1.8);
    expect(addUsage({ inputTokens: 1, outputTokens: 2 }, { outputTokens: 3 })).toEqual({
      inputTokens: 1,
      outputTokens: 5,
    });
  });
});

describe('slugs from Arabic', () => {
  it('transliterates and cuts on a word boundary', () => {
    expect(transliterate('تسعير التيشيرت المطبوع')).toBe('tsayr-altyshyrt-almtbwa');
    expect(transliterate('بيع تيشيرتات بدون رأس مال في السعودية 2026').length).toBeLessThanOrEqual(
      40,
    );
    expect(slugFor('Pricing-Printed-Tees', 'x')).toBe('pricing-printed-tees');
    expect(slugFor('bad slug!', 'تسعير')).toBe('tsayr');
  });
});

describe('links in a draft (BRD 10.2.5)', () => {
  it('keeps allowed internal and official external links, drops the rest', () => {
    const md =
      'اقرأ [كيف تعمل](/how-it-works) و[سلة](https://salla.sa) و[الهيئة](https://zatca.gov.sa/x) و[غريب](/nowhere).';
    const out = sanitizeLinks(md, ['/how-it-works', '/faq']);
    expect(out.markdown).toBe(
      'اقرأ [كيف تعمل](/how-it-works) وسلة و[الهيئة](https://zatca.gov.sa/x) وغريب.',
    );
    expect(out.internal).toBe(1);
    expect(out.dropped).toEqual(['https://salla.sa', '/nowhere']);
  });
});

const encrypt = (p: string) => `enc(${p})`;
const decrypt = (h: string) => h.slice(4, -1);

describe('the secret field (ADR-042)', () => {
  it('keeps, clears, encrypts, and leaves an untouched field alone', () => {
    expect(nextStoredValue({ incoming: '••••abcd', previous: 'enc(sk-abcd)', encrypt })).toBe(
      'enc(sk-abcd)',
    );
    expect(nextStoredValue({ incoming: '', previous: 'enc(sk-abcd)', encrypt })).toBeNull();
    expect(nextStoredValue({ incoming: 'sk-new1', previous: 'enc(sk-abcd)', encrypt })).toBe(
      'enc(sk-new1)',
    );
    expect(nextStoredValue({ incoming: undefined, previous: 'enc(sk-abcd)', encrypt })).toBe(
      'enc(sk-abcd)',
    );
  });

  it('masks on read unless the pipeline asks', () => {
    expect(readValue({ stored: 'enc(sk-abcd)', reveal: false, decrypt })).toBe('••••abcd');
    expect(readValue({ stored: 'enc(sk-abcd)', reveal: true, decrypt })).toBe('sk-abcd');
    expect(readValue({ stored: null, reveal: true, decrypt })).toBeNull();
    expect(
      readValue({
        stored: 'garbage',
        reveal: false,
        decrypt: () => {
          throw new Error('bad');
        },
      }),
    ).toBe('••••????');
  });
});

describe('topics CSV', () => {
  it('parses a header row, quoted fields and secondary keywords', () => {
    const csv =
      'title,hub,primaryKeyword,secondaryKeywords,intent,priority\n"عنوان, بفاصلة",design,كلمة,"أ;ب",commercial,4\nبلا قسم,,كلمة\nx,seasons,y,,weird,1';
    const { rows, errors } = parseTopicsCsv(csv);
    expect(rows).toEqual([
      {
        title: 'عنوان, بفاصلة',
        hub: 'design',
        primaryKeyword: 'كلمة',
        secondaryKeywords: ['أ', 'ب'],
        intent: 'commercial',
        priority: 4,
        language: 'ar',
      },
    ]);
    expect(errors).toEqual([
      'line 3: title, hub and primaryKeyword are required',
      'line 4: intent must be informational, commercial or seasonal',
    ]);
  });

  it('takes the language from a `language` column, Arabic by default, and refuses others (ADR-043)', () => {
    const { rows, errors } = parseTopicsCsv(
      'title,hub,primaryKeyword,secondaryKeywords,intent,priority,language\nEnglish topic,design,keyword,,informational,3,en\nعربي,design,كلمة,,informational,3\nOdd,design,k,,informational,3,fr',
    );
    expect(rows.map((r) => r.language)).toEqual(['en', 'ar']);
    expect(errors).toEqual(['line 4: language must be ar or en']);
  });
});
