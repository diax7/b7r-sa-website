import { describe, expect, it } from 'vitest';
import { booking as seed } from '@/content/seed/booking';
import {
  daysOfMonth,
  MONTH_KEY,
  monthBounds,
  monthDays,
  withinMonths,
} from '@/modules/bookings/days-of-month';
import { daysQuerySchema } from '@/modules/bookings/schema';
import { daysFor } from '@/modules/bookings/service';
import { minuteOf, riyadhInstant, type SlotRules } from '@/modules/bookings/slots';
import { recordedCalendar, testPorts } from './helpers/booking-store';

/** The seed's rules: Sunday to Thursday 10:00 to 18:00, 30 + 10, a day's notice, 30 days, 4 a day. */
const RULES: SlotRules = { ...seed, closedDates: [] };
/** Sunday 2026-09-20 at 09:00 Riyadh (06:00 UTC), as the other booking tests count. */
const NOW = new Date('2026-09-20T06:00:00Z');
const at = (clock: string, day: string) => riyadhInstant(day, minuteOf(clock));
const slot = (clock: string, day: string) => ({ start: at(clock, day), end: at(clock, day) });

describe('the month helpers (ADR-063)', () => {
  it('lists the days of a month, February in a leap year and December included', () => {
    expect(daysOfMonth('2026-09')).toHaveLength(30);
    expect(daysOfMonth('2026-09')[0]).toBe('2026-09-01');
    expect(daysOfMonth('2026-09').at(-1)).toBe('2026-09-30');
    expect(daysOfMonth('2028-02')).toHaveLength(29);
    expect(daysOfMonth('2026-02')).toHaveLength(28);
    expect(daysOfMonth('2026-12').at(-1)).toBe('2026-12-31');
  });

  it('bounds the months by Riyadh today and the horizon, so 21:30 UTC on the 30th is already October', () => {
    expect(monthBounds(RULES, NOW)).toEqual({ first: '2026-09', last: '2026-10' });
    expect(monthBounds(RULES, new Date('2026-09-30T21:30:00Z'))).toEqual({
      first: '2026-10',
      last: '2026-10',
    });
    expect(monthBounds({ horizonDays: 90 }, NOW)).toEqual({ first: '2026-09', last: '2026-12' });
    expect(withinMonths('2026-09', RULES, NOW)).toBe(true);
    expect(withinMonths('2026-10', RULES, NOW)).toBe(true);
    expect(withinMonths('2026-11', RULES, NOW)).toBe(false);
    expect(withinMonths('2026-08', RULES, NOW)).toBe(false);
  });

  it('the query is a month key', () => {
    for (const month of ['2026-09', '2026-12', '2027-01']) {
      expect(MONTH_KEY.test(month), month).toBe(true);
      expect(daysQuerySchema.safeParse({ month }).success, month).toBe(true);
    }
    for (const month of ['2026-13', '2026-00', '2026-9', '2026-09-01', 'nope', '']) {
      expect(MONTH_KEY.test(month), month).toBe(false);
      expect(daysQuerySchema.safeParse({ month }).success, month).toBe(false);
    }
  });
});

describe('monthDays: the free count per day, from the rules and the bookings alone', () => {
  it('counts the grid on an open weekday, 0 on a Friday or a Saturday, and omits the days before today', () => {
    const days = monthDays({ month: '2026-09', rules: RULES, bookings: [], now: NOW });
    expect(days['2026-09-19']).toBeUndefined();
    expect(days['2026-09-22']).toBe(12);
    expect(days['2026-09-25']).toBe(0);
    expect(days['2026-09-26']).toBe(0);
    expect(Object.keys(days)[0]).toBe('2026-09-20');
    expect(Object.keys(days).at(-1)).toBe('2026-09-30');
  });

  it("hides today's slots behind a day's notice, and shows them with no notice", () => {
    expect(
      monthDays({ month: '2026-09', rules: RULES, bookings: [], now: NOW })['2026-09-20'],
    ).toBe(0);
    expect(
      monthDays({ month: '2026-09', rules: RULES, bookings: [], now: NOW })['2026-09-21'],
    ).toBe(12);
    const noNotice = { ...RULES, noticeHours: 0 };
    expect(
      monthDays({ month: '2026-09', rules: noNotice, bookings: [], now: NOW })['2026-09-20'],
    ).toBe(12);
  });

  it('answers 0 on a closed date and on a day that holds the cap', () => {
    const closed = { ...RULES, closedDates: ['2026-09-23'] };
    expect(
      monthDays({ month: '2026-09', rules: closed, bookings: [], now: NOW })['2026-09-23'],
    ).toBe(0);
    const full = ['10:00', '11:20', '12:40', '14:00'].map((clock) => slot(clock, '2026-09-22'));
    const days = monthDays({ month: '2026-09', rules: RULES, bookings: full, now: NOW });
    expect(days['2026-09-22']).toBe(0);
    const three = full.slice(0, 3);
    expect(
      monthDays({ month: '2026-09', rules: RULES, bookings: three, now: NOW })['2026-09-22'],
    ).toBe(12 - 3);
  });

  it('a month straddling the horizon lists the days up to it and none beyond', () => {
    const days = monthDays({ month: '2026-10', rules: RULES, bookings: [], now: NOW });
    expect(Object.keys(days)[0]).toBe('2026-10-01');
    expect(Object.keys(days).at(-1)).toBe('2026-10-20');
    expect(days['2026-10-20']).toBe(12);
    expect(days['2026-10-21']).toBeUndefined();
    expect(Object.keys(days)).toHaveLength(20);
  });

  it('a month wholly outside the horizon has no days', () => {
    expect(monthDays({ month: '2026-08', rules: RULES, bookings: [], now: NOW })).toEqual({});
    expect(monthDays({ month: '2026-12', rules: RULES, bookings: [], now: NOW })).toEqual({});
  });
});

describe('GET /api/bookings/days: the service', () => {
  it('answers the month with its counts, reads the bookings once and never asks the calendar', async () => {
    const calendar = recordedCalendar({
      busy: [{ start: at('10:00', '2026-09-22'), end: at('18:00', '2026-09-22') }],
    });
    const ports = testPorts({ calendar });
    await ports.store.create({
      name: 'ضياء',
      email: 'm@example.com',
      phone: '966501699572',
      locale: 'ar',
      start: at('10:00', '2026-09-22'),
      end: at('10:30', '2026-09-22'),
      calendar: 'off',
      meetRequestId: 'r',
      page: '/book',
      utm: {},
      notes: '',
    });
    const result = await daysFor(ports, '2026-09', 'ar');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // A day busy all day on the calendar still opens here: Google decides on the day click.
    expect(result.days['2026-09-22']).toBe(11);
    expect(result.days['2026-09-21']).toBe(12);
    expect(result.days['2026-09-20']).toBe(0);
    expect(calendar.calls).toEqual([]);
  });

  it('refuses a month before today or beyond the horizon, and the switch off', async () => {
    const ports = testPorts();
    expect(await daysFor(ports, '2026-08', 'ar')).toEqual({ ok: false, reason: 'out_of_range' });
    expect(await daysFor(ports, '2026-11', 'ar')).toEqual({ ok: false, reason: 'out_of_range' });
    const october = await daysFor(ports, '2026-10', 'ar');
    expect(october.ok && Object.keys(october.days)).toHaveLength(20);
    const off = testPorts({ settings: { enabled: false } });
    expect(await daysFor(off, '2026-09', 'ar')).toEqual({ ok: false, reason: 'disabled' });
  });
});
