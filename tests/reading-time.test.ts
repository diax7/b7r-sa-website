import { describe, expect, it } from 'vitest';
import { formatArabicDate } from '@/lib/dates';
import { readingLabel, readingMinutes, WORDS_PER_MINUTE } from '@/lib/reading-time';

describe('readingMinutes', () => {
  it('never reports less than a minute and rounds to whole minutes', () => {
    expect(readingMinutes('')).toBe(1);
    expect(readingMinutes('كلمة '.repeat(WORDS_PER_MINUTE * 2.4))).toBe(2);
    expect(readingMinutes('كلمة '.repeat(WORDS_PER_MINUTE * 2.6))).toBe(3);
  });

  it('agrees the noun with the count', () => {
    expect(readingLabel(1)).toBe('دقيقة قراءة');
    expect(readingLabel(2)).toBe('دقيقتا قراءة');
    expect(readingLabel(4)).toBe('4 دقائق قراءة');
    expect(readingLabel(12)).toBe('12 دقيقة قراءة');
  });

  it('ignores punctuation-only tokens', () => {
    expect(readingMinutes('## - — ، .')).toBe(1);
  });
});

describe('formatArabicDate', () => {
  it('renders Gregorian months with Western digits', () => {
    expect(formatArabicDate('2026-09-13')).toBe('13 سبتمبر 2026');
    expect(formatArabicDate('2026-01-05')).toBe('5 يناير 2026');
  });
});
