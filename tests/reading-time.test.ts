import { describe, expect, it } from 'vitest';
import { copyFor } from '@/content/copy';
import { formatDate } from '@/lib/dates';
import { readingLabel, readingMinutes, WORDS_PER_MINUTE } from '@/lib/reading-time';

const ar = copyFor('ar').readingTime;
const en = copyFor('en').readingTime;

describe('readingMinutes', () => {
  it('never reports less than a minute and rounds to whole minutes', () => {
    expect(readingMinutes('')).toBe(1);
    expect(readingMinutes('كلمة '.repeat(WORDS_PER_MINUTE.ar * 2.4))).toBe(2);
    expect(readingMinutes('كلمة '.repeat(WORDS_PER_MINUTE.ar * 2.6))).toBe(3);
  });

  it('reads English at its own pace (ADR-043)', () => {
    expect(WORDS_PER_MINUTE.en).toBeGreaterThan(WORDS_PER_MINUTE.ar);
    expect(readingMinutes('word '.repeat(WORDS_PER_MINUTE.en * 2.4), 'en')).toBe(2);
  });

  it('agrees the noun with the count in Arabic and uses one form in English', () => {
    expect(readingLabel(ar, 1)).toBe('دقيقة قراءة');
    expect(readingLabel(ar, 2)).toBe('دقيقتا قراءة');
    expect(readingLabel(ar, 4)).toBe('4 دقائق قراءة');
    expect(readingLabel(ar, 12)).toBe('12 دقيقة قراءة');
    expect(readingLabel(en, 1)).toBe('1 min read');
    expect(readingLabel(en, 4)).toBe('4 min read');
    expect(readingLabel(en, 12)).toBe('12 min read');
  });

  it('ignores punctuation-only tokens', () => {
    expect(readingMinutes('## -، ، .')).toBe(1);
  });
});

describe('formatDate', () => {
  it('renders Gregorian months with Western digits in both languages', () => {
    expect(formatDate('ar', '2026-09-13')).toBe('13 سبتمبر 2026');
    expect(formatDate('ar', '2026-01-05')).toBe('5 يناير 2026');
    expect(formatDate('en', '2026-09-13')).toBe('13 September 2026');
    expect(formatDate('en', '2026-01-05T09:00:00.000Z')).toBe('5 January 2026');
  });
});
