import { describe, expect, it } from 'vitest';
import { DATE_LOCALES } from '@/lib/riyadh';
import {
  appleCalendarUrl,
  compactUtc,
  googleCalendarUrl,
  outlookCalendarUrl,
  riyadhIso,
} from '@/modules/bookings/booker/calendar-links';
import {
  daysInMonth,
  firstOpen,
  keyStep,
  lastOpen,
  monthBoundsOf,
  monthCells,
  monthLabel,
  monthRows,
  moveFocus,
  shiftMonth,
  weekdayNames,
} from '@/modules/bookings/booker/month';
import { landedOutside, reduceSplit, SPLIT_IDLE } from '@/modules/bookings/booker/split';
import { skeletonRows } from '@/modules/bookings/booker/times-pane';

/** Sunday 2026-09-20 at 09:00 Riyadh (06:00 UTC), as the other booking tests count. */
const NOW = new Date('2026-09-20T06:00:00Z');

describe('the month grid arithmetic (ADR-063)', () => {
  it('lays a month out Sunday first in six rows of seven, blanks before the first and after the last', () => {
    // September 2026 starts on a Tuesday: two blanks, then 1..30, then the rest blank.
    const cells = monthCells('2026-09');
    expect(cells).toHaveLength(42);
    expect(cells.slice(0, 3)).toEqual([null, null, { key: '2026-09-01', day: 1 }]);
    expect(cells[31]).toEqual({ key: '2026-09-30', day: 30 });
    expect(cells.slice(32).every((c) => c === null)).toBe(true);
    const rows = monthRows('2026-09');
    expect(rows).toHaveLength(6);
    expect(rows.every((r) => r.length === 7)).toBe(true);
    // November 2026 starts on a Sunday: no blank before the 1st.
    expect(monthCells('2026-11')[0]).toEqual({ key: '2026-11-01', day: 1 });
    // A 31-day month starting late fills the sixth row: August 2026 starts on a Saturday.
    const august = monthCells('2026-08');
    expect(august[6]).toEqual({ key: '2026-08-01', day: 1 });
    expect(august[36]).toEqual({ key: '2026-08-31', day: 31 });
  });

  it('counts the days of a month and steps across a year end', () => {
    expect(daysInMonth('2026-02')).toBe(28);
    expect(daysInMonth('2028-02')).toBe(29);
    expect(daysInMonth('2026-12')).toBe(31);
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(shiftMonth('2027-01', -1)).toBe('2026-12');
    expect(shiftMonth('2026-09', 3)).toBe('2026-12');
    expect(shiftMonth('2026-09', -9)).toBe('2025-12');
  });

  it("bounds the pages by Riyadh's today and the horizon, so 21:30 UTC on the 30th is already next month", () => {
    expect(monthBoundsOf(30, NOW)).toEqual({ first: '2026-09', last: '2026-10' });
    expect(monthBoundsOf(30, new Date('2026-09-30T21:30:00Z'))).toEqual({
      first: '2026-10',
      last: '2026-10',
    });
    expect(monthBoundsOf(90, NOW)).toEqual({ first: '2026-09', last: '2026-12' });
  });

  it('names the weekdays by their initials in each language, Sunday first, and the month with its year', () => {
    expect(weekdayNames(DATE_LOCALES.ar).map((d) => d.initial)).toEqual([
      'ح',
      'ن',
      'ث',
      'ر',
      'خ',
      'ج',
      'س',
    ]);
    expect(weekdayNames(DATE_LOCALES.ar)[1]?.long).toBe('الاثنين');
    expect(weekdayNames(DATE_LOCALES.en).map((d) => d.initial)).toEqual([
      'S',
      'M',
      'T',
      'W',
      'T',
      'F',
      'S',
    ]);
    expect(weekdayNames(DATE_LOCALES.en)[5]?.long).toBe('Friday');
    expect(monthLabel('2026-09', DATE_LOCALES.ar)).toBe('سبتمبر 2026');
    expect(monthLabel('2026-09', DATE_LOCALES.en)).toBe('September 2026');
  });

  it('moves by reading direction: the arrow toward the end of the line is next', () => {
    expect(keyStep('ArrowRight', 'ltr')).toBe(1);
    expect(keyStep('ArrowLeft', 'ltr')).toBe(-1);
    expect(keyStep('ArrowLeft', 'rtl')).toBe(1);
    expect(keyStep('ArrowRight', 'rtl')).toBe(-1);
    expect(keyStep('ArrowDown', 'rtl')).toBe(7);
    expect(keyStep('ArrowUp', 'ltr')).toBe(-7);
    expect(keyStep('Home', 'rtl')).toBe('home');
    expect(keyStep('End', 'ltr')).toBe('end');
    expect(keyStep('Enter', 'ltr')).toBeNull();
    expect(keyStep('Tab', 'rtl')).toBeNull();
  });

  it('skips closed days, turns the page at the month edge, and Home and End walk the row', () => {
    // The seed's week: Sunday to Thursday open; the 22nd (Tuesday) closed by hand.
    const open = new Set(['21', '23', '24', '27', '28', '29', '30'].map((d) => `2026-09-${d}`));
    expect(moveFocus('2026-09-21', 1, open)).toBe('2026-09-23');
    expect(moveFocus('2026-09-24', 1, open)).toBe('2026-09-27');
    expect(moveFocus('2026-09-23', -1, open)).toBe('2026-09-21');
    expect(moveFocus('2026-09-21', 7, open)).toBe('2026-09-28');
    expect(moveFocus('2026-09-30', 1, open)).toBe('next');
    expect(moveFocus('2026-09-21', -1, open)).toBe('previous');
    expect(moveFocus('2026-09-28', 7, open)).toBe('next');
    expect(moveFocus('2026-09-23', 'home', open)).toBe('2026-09-21');
    expect(moveFocus('2026-09-21', 'end', open)).toBe('2026-09-24');
    expect(moveFocus('2026-09-21', 'home', open)).toBeNull();
    expect(moveFocus('2026-09-21', 1, new Set())).toBe('next');
  });

  it('finds the first and the last open day of a month, or none', () => {
    const days = { '2026-09-20': 0, '2026-09-21': 12, '2026-09-22': 0, '2026-09-23': 3 };
    expect(firstOpen(days)).toBe('2026-09-21');
    expect(lastOpen(days)).toBe('2026-09-23');
    expect(firstOpen({ '2026-09-25': 0 })).toBeNull();
    expect(firstOpen(undefined)).toBeNull();
    expect(lastOpen(undefined)).toBeNull();
  });
});

describe('the split confirm (ADR-063)', () => {
  it('arms on a press, moves on another, closes on the same press again', () => {
    const armed = reduceSplit(SPLIT_IDLE, { type: 'press', slot: 'a' });
    expect(armed).toEqual({ armed: 'a' });
    expect(reduceSplit(armed, { type: 'press', slot: 'b' })).toEqual({ armed: 'b' });
    expect(reduceSplit(armed, { type: 'press', slot: 'a' })).toBe(SPLIT_IDLE);
  });

  it('collapses on a pointer elsewhere, a day change and a refresh, and stays idle otherwise', () => {
    const armed = { armed: 'a' };
    expect(reduceSplit(armed, { type: 'pointerOutside' })).toBe(SPLIT_IDLE);
    expect(reduceSplit(armed, { type: 'dayChanged' })).toBe(SPLIT_IDLE);
    expect(reduceSplit(armed, { type: 'refreshed' })).toBe(SPLIT_IDLE);
    expect(reduceSplit(SPLIT_IDLE, { type: 'pointerOutside' })).toBe(SPLIT_IDLE);
  });

  it('reads a pointer as outside unless it landed inside the armed row', () => {
    const row = document.createElement('li');
    const inside = document.createElement('button');
    row.append(inside);
    const elsewhere = document.createElement('div');
    expect(landedOutside(row, inside)).toBe(false);
    expect(landedOutside(row, row)).toBe(false);
    expect(landedOutside(row, elsewhere)).toBe(true);
    expect(landedOutside(null, inside)).toBe(true);
    expect(landedOutside(row, null)).toBe(true);
  });

  it('draws as many loading rows as the day has free starts, six when unknown, three to eight', () => {
    expect(skeletonRows(undefined)).toBe(6);
    expect(skeletonRows(12)).toBe(8);
    expect(skeletonRows(1)).toBe(3);
    expect(skeletonRows(5)).toBe(5);
  });
});

describe('the add-to-calendar links (ADR-063)', () => {
  const event = {
    title: 'استشارة مجانية، 30 دقيقة',
    start: new Date('2026-09-22T07:00:00Z'),
    end: new Date('2026-09-22T07:30:00Z'),
    details: 'https://meet.google.com/abc-defg-hij',
    location: 'https://meet.google.com/abc-defg-hij',
  };

  it('writes the instants compact for Google and on the Riyadh clock with its offset for Outlook', () => {
    expect(compactUtc(event.start)).toBe('20260922T070000Z');
    expect(riyadhIso(event.start)).toBe('2026-09-22T10:00:00+03:00');
    expect(riyadhIso(new Date('2026-09-22T21:30:00Z'))).toBe('2026-09-23T00:30:00+03:00');
  });

  it('the Google link opens the event editor with the encoded title, the span and the Riyadh zone', () => {
    const url = new URL(googleCalendarUrl(event));
    expect(url.origin + url.pathname).toBe('https://calendar.google.com/calendar/r/eventedit');
    expect(url.searchParams.get('text')).toBe(event.title);
    expect(url.searchParams.get('dates')).toBe('20260922T070000Z/20260922T073000Z');
    expect(url.searchParams.get('details')).toBe(event.details);
    expect(url.searchParams.get('location')).toBe(event.location);
    expect(url.searchParams.get('ctz')).toBe('Asia/Riyadh');
    expect(url.href).toContain('text=%D8%A7%D8%B3%D8%AA%D8%B4%D8%A7%D8%B1%D8%A9');
  });

  it('the Outlook deep link composes the event with the Riyadh wall clock, the plus sign encoded', () => {
    const href = outlookCalendarUrl(event);
    const url = new URL(href);
    expect(url.origin + url.pathname).toBe('https://outlook.live.com/calendar/0/deeplink/compose');
    expect(url.searchParams.get('path')).toBe('/calendar/action/compose');
    expect(url.searchParams.get('rru')).toBe('addevent');
    expect(url.searchParams.get('subject')).toBe(event.title);
    expect(url.searchParams.get('startdt')).toBe('2026-09-22T10:00:00+03:00');
    expect(url.searchParams.get('enddt')).toBe('2026-09-22T10:30:00+03:00');
    expect(href).toContain('startdt=2026-09-22T10%3A00%3A00%2B03%3A00');
    expect(url.searchParams.get('body')).toBe(event.details);
  });

  it("the Apple entry is the site's own calendar file by the encoded token", () => {
    expect(appleCalendarUrl('12.ab+c/d')).toBe('/api/bookings/ics?token=12.ab%2Bc%2Fd');
  });
});
