import { describe, expect, it } from 'vitest';
import {
  formatDate,
  formatLocale,
  formatNumber,
  formatSlot,
  formatTime,
  relativeTime,
} from '@/modules/cms/admin/format';

const now = new Date('2026-09-13T12:00:00Z');
const at = (ms: number) => new Date(now.getTime() - ms);
const EASTERN_DIGITS = /[٠-٩]/;

/**
 * The panel's one formatter (ADR-056, design system §5): the UI language decides the words
 * and the separators, the digits stay Western in both.
 */
describe('numbers and dates in the panel (admin/format)', () => {
  it('formats a number in the UI language with Western digits: 1,234 in Arabic too', () => {
    expect(formatNumber(1234, 'en')).toBe('1,234');
    expect(formatNumber(1234, 'ar')).toBe('1,234');
    expect(formatNumber(1234567, 'ar')).not.toMatch(EASTERN_DIGITS);
    expect(formatNumber(0, 'ar')).toBe('0');
  });

  it('pins the numbering system on the locale it hands Intl', () => {
    expect(formatLocale('ar')).toBe('ar-u-nu-latn');
    expect(formatLocale('en')).toBe('en-GB-u-nu-latn');
    expect(formatLocale('fr')).toBe('en-GB-u-nu-latn');
  });

  it('formats a date as dd/MM/yyyy in both languages, digits Western, no bidi marks', () => {
    const date = new Date('2026-09-03T09:00:00Z');
    expect(formatDate(date, 'en')).toBe('03/09/2026');
    expect(formatDate(date, 'ar')).toBe('03/09/2026');
    expect(formatDate(date, 'ar')).not.toMatch(/[\u200E\u200F]/);
  });

  it('reads the day in Riyadh, not the process zone: 22:00 UTC is already the next day', () => {
    const lateUtc = new Date('2026-09-03T22:00:00Z');
    expect(formatDate(lateUtc, 'en')).toBe('04/09/2026');
    expect(formatDate(lateUtc, 'ar')).toBe('04/09/2026');
    // The week-old fall-through of relativeTime inherits the same zone.
    expect(relativeTime(lateUtc, 'en', new Date('2026-09-20T12:00:00Z'))).toBe('04/09/2026');
  });
});

describe('relative time (dashboard, widgets)', () => {
  it('reads as minutes, hours and days ago in English, singular when one', () => {
    expect(relativeTime(at(10_000), 'en', now)).toBe('just now');
    expect(relativeTime(at(60_000), 'en', now)).toBe('1 minute ago');
    expect(relativeTime(at(5 * 60_000), 'en', now)).toBe('5 minutes ago');
    expect(relativeTime(at(3_600_000), 'en', now)).toBe('1 hour ago');
    expect(relativeTime(at(11 * 3_600_000), 'en', now)).toBe('11 hours ago');
    expect(relativeTime(at(24 * 3_600_000), 'en', now)).toBe('1 day ago');
    expect(relativeTime(at(3 * 24 * 3_600_000), 'en', now)).toBe('3 days ago');
  });

  it('reads in Arabic with the Arabic plurals and Western digits', () => {
    expect(relativeTime(at(10_000), 'ar', now)).toBe('الآن');
    expect(relativeTime(at(60_000), 'ar', now)).toBe('قبل دقيقة واحدة');
    expect(relativeTime(at(2 * 60_000), 'ar', now)).toBe('قبل دقيقتين');
    expect(relativeTime(at(5 * 60_000), 'ar', now)).toBe('قبل 5 دقائق');
    expect(relativeTime(at(11 * 60_000), 'ar', now)).toBe('قبل 11 دقيقة');
    expect(relativeTime(at(3 * 3_600_000), 'ar', now)).toBe('قبل 3 ساعات');
    expect(relativeTime(at(3 * 24 * 3_600_000), 'ar', now)).toBe('قبل 3 أيام');
    expect(relativeTime(at(11 * 60_000), 'ar', now)).not.toMatch(EASTERN_DIGITS);
  });

  it('falls back to the date after a week, and to nothing for garbage', () => {
    const old = at(8 * 24 * 3_600_000);
    expect(relativeTime(old, 'en', now)).toBe(formatDate(old, 'en'));
    expect(relativeTime(old, 'ar', now)).toBe(formatDate(old, 'ar'));
    expect(relativeTime('not-a-date', 'en', now)).toBe('');
  });
});

describe("a moment ahead (formatSlot, the dashboard's next runs)", () => {
  // 10:00 Riyadh on the 13th is 07:00 UTC.
  const riyadhNow = new Date('2026-09-13T07:00:00Z');

  it('reads the hour on the Riyadh clock, 24 hours, Western digits', () => {
    expect(formatTime(new Date('2026-09-13T04:00:00Z'), 'en')).toBe('07:00');
    expect(formatTime(new Date('2026-09-13T04:00:00Z'), 'ar')).toBe('07:00');
    expect(formatTime(new Date('2026-09-13T21:30:00Z'), 'ar')).toBe('00:30');
  });

  it('says today, tomorrow, then the date, in both languages', () => {
    expect(formatSlot(new Date('2026-09-13T09:00:00Z'), 'en', riyadhNow)).toBe('today 12:00');
    expect(formatSlot(new Date('2026-09-14T04:00:00Z'), 'en', riyadhNow)).toBe('tomorrow 07:00');
    expect(formatSlot(new Date('2026-09-16T03:00:00Z'), 'en', riyadhNow)).toBe('16/09/2026 06:00');
    expect(formatSlot(new Date('2026-09-14T04:00:00Z'), 'ar', riyadhNow)).toBe('غداً الساعة 07:00');
    expect(formatSlot(new Date('2026-09-16T03:00:00Z'), 'ar', riyadhNow)).toBe(
      '16/09/2026 الساعة 06:00',
    );
    expect(formatSlot(new Date('2026-09-16T03:00:00Z'), 'ar', riyadhNow)).not.toMatch(
      EASTERN_DIGITS,
    );
  });

  it('counts the day in Riyadh: 22:00 UTC tonight is already tomorrow', () => {
    expect(formatSlot(new Date('2026-09-13T22:00:00Z'), 'en', riyadhNow)).toBe('tomorrow 01:00');
  });
});
