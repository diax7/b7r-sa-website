import { describe, expect, it } from 'vitest';
import { booking as seed } from '@/content/seed/booking';
import {
  addRiyadhDays,
  daySlots,
  dayOffset,
  gridStarts,
  isOnGrid,
  minuteOf,
  openWeekdays,
  overlaps,
  riyadhInstant,
  riyadhWeekday,
  slotEnd,
  type SlotRules,
  withinHorizon,
} from '@/modules/bookings/slots';

/** The seed's rules: Sunday to Thursday 10:00 to 18:00, 30 + 10, a day's notice, 30 days, 4 a day. */
const RULES: SlotRules = { ...seed, closedDates: [] };

/** Tuesday 2026-09-22 in Riyadh; `now` is the Sunday before at 09:00 Riyadh (06:00 UTC). */
const DAY = '2026-09-22';
const NOW = new Date('2026-09-20T06:00:00Z');
const at = (clock: string, day = DAY) => riyadhInstant(day, minuteOf(clock));
const clock = (d: Date) =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Riyadh',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(d);

describe('the Riyadh clock helpers', () => {
  it('reads a day key as an instant at UTC+3, no daylight saving, and back', () => {
    expect(riyadhInstant('2026-09-22').toISOString()).toBe('2026-09-21T21:00:00.000Z');
    expect(riyadhInstant('2026-09-22', 630).toISOString()).toBe('2026-09-22T07:30:00.000Z');
    expect(riyadhInstant('2026-01-15', 600).toISOString()).toBe('2026-01-15T07:00:00.000Z');
    expect(minuteOf('10:30')).toBe(630);
    expect(minuteOf('00:00')).toBe(0);
    expect(minuteOf('23:59')).toBe(1439);
  });

  it('knows the weekday and moves by whole days across a month end', () => {
    expect(riyadhWeekday('2026-09-20')).toBe(0);
    expect(riyadhWeekday('2026-09-22')).toBe(2);
    expect(riyadhWeekday('2026-09-25')).toBe(5);
    expect(addRiyadhDays('2026-09-30', 1)).toBe('2026-10-01');
    expect(addRiyadhDays('2026-10-01', -1)).toBe('2026-09-30');
    expect(addRiyadhDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('counts days from Riyadh today, so 22:30 UTC on the 19th is already the 20th', () => {
    const lateUtc = new Date('2026-09-19T22:30:00Z');
    expect(dayOffset('2026-09-20', lateUtc)).toBe(0);
    expect(dayOffset('2026-09-19', lateUtc)).toBe(-1);
    expect(dayOffset('2026-09-21', lateUtc)).toBe(1);
    expect(dayOffset(DAY, NOW)).toBe(2);
  });

  it('keeps the horizon inclusive of its last day and refuses the past', () => {
    expect(withinHorizon('2026-09-20', RULES, NOW)).toBe(true);
    expect(withinHorizon('2026-10-20', RULES, NOW)).toBe(true);
    expect(withinHorizon('2026-10-21', RULES, NOW)).toBe(false);
    expect(withinHorizon('2026-09-19', RULES, NOW)).toBe(false);
  });

  it('overlap is strict at the edges: a slot ending when another starts is free', () => {
    const a = { start: at('10:00'), end: at('10:30') };
    expect(overlaps(a, { start: at('10:30'), end: at('11:00') })).toBe(false);
    expect(overlaps(a, { start: at('10:29'), end: at('11:00') })).toBe(true);
    expect(overlaps(a, { start: at('09:00'), end: at('10:01') })).toBe(true);
    expect(overlaps(a, { start: at('09:00'), end: at('12:00') })).toBe(true);
    expect(slotEnd(at('10:00'), RULES).toISOString()).toBe(at('10:30').toISOString());
  });
});

describe('the grid (ADR-062): from plus multiples of duration + gap', () => {
  it('lays 12 slots over 10:00 to 18:00 at 30 + 10, the last one ending by 18:00', () => {
    const starts = gridStarts(DAY, RULES).map(clock);
    expect(starts).toEqual([
      '10:00',
      '10:40',
      '11:20',
      '12:00',
      '12:40',
      '13:20',
      '14:00',
      '14:40',
      '15:20',
      '16:00',
      '16:40',
      '17:20',
    ]);
  });

  it('drops a slot that would end after `to`, and reads a day without hours as empty', () => {
    const tight: SlotRules = { ...RULES, hours: [{ day: 2, from: '10:00', to: '11:00' }] };
    expect(gridStarts(DAY, tight).map(clock)).toEqual(['10:00']);
    const exact: SlotRules = { ...RULES, hours: [{ day: 2, from: '10:00', to: '11:10' }] };
    expect(gridStarts(DAY, exact).map(clock)).toEqual(['10:00', '10:40']);
    expect(gridStarts('2026-09-25', RULES)).toEqual([]);
    expect(openWeekdays(RULES)).toEqual([0, 1, 2, 3, 4]);
  });

  it('merges two rows of one day, sorted, a duplicate start once', () => {
    const split: SlotRules = {
      ...RULES,
      hours: [
        { day: 2, from: '16:00', to: '17:00' },
        { day: 2, from: '10:00', to: '11:20' },
        { day: 2, from: '10:00', to: '10:30' },
      ],
    };
    expect(gridStarts(DAY, split).map(clock)).toEqual(['10:00', '10:40', '16:00']);
  });

  it('isOnGrid accepts a grid start on its own day and refuses anything else', () => {
    expect(isOnGrid(at('10:40'), RULES)).toBe(true);
    expect(isOnGrid(at('17:20'), RULES)).toBe(true);
    expect(isOnGrid(at('10:30'), RULES)).toBe(false);
    expect(isOnGrid(at('18:00'), RULES)).toBe(false);
    expect(isOnGrid(new Date(at('10:40').getTime() + 1000), RULES)).toBe(false);
    // A Friday has no row: nothing is on its grid.
    expect(isOnGrid(at('10:00', '2026-09-25'), RULES)).toBe(false);
  });
});

describe('daySlots: the free starts of a day', () => {
  it('is the whole grid on an open day with nothing booked and the notice already past', () => {
    expect(daySlots({ day: DAY, rules: RULES, bookings: [], busy: [], now: NOW })).toHaveLength(12);
  });

  it('hides the slots inside the notice: 24 hours from now, to the minute', () => {
    // Now: Monday 21st 11:00 Riyadh; Tuesday's 10:00 and 10:40 are inside 24 h, 11:20 is out.
    const now = new Date('2026-09-21T08:00:00Z');
    const free = daySlots({ day: DAY, rules: RULES, bookings: [], busy: [], now }).map(clock);
    expect(free[0]).toBe('11:20');
    expect(free).toHaveLength(10);
    // No notice: today's remaining slots show.
    const today = daySlots({
      day: '2026-09-21',
      rules: { ...RULES, noticeHours: 0 },
      bookings: [],
      busy: [],
      now,
    }).map(clock);
    expect(today[0]).toBe('11:20');
  });

  it('answers nothing outside the horizon, on a closed date, and on a day without hours', () => {
    expect(daySlots({ day: '2026-10-21', rules: RULES, bookings: [], busy: [], now: NOW })).toEqual(
      [],
    );
    expect(daySlots({ day: '2026-09-19', rules: RULES, bookings: [], busy: [], now: NOW })).toEqual(
      [],
    );
    const closed: SlotRules = { ...RULES, closedDates: [DAY] };
    expect(daySlots({ day: DAY, rules: closed, bookings: [], busy: [], now: NOW })).toEqual([]);
    expect(daySlots({ day: '2026-09-25', rules: RULES, bookings: [], busy: [], now: NOW })).toEqual(
      [],
    );
  });

  it('subtracts a booking widened by the gap: at 10 minutes the neighbours stay, at 20 they go', () => {
    const bookings = [{ start: at('12:00'), end: at('12:30') }];
    const free = daySlots({ day: DAY, rules: RULES, bookings, busy: [], now: NOW }).map(clock);
    expect(free).not.toContain('12:00');
    // 11:20 to 11:50 touches the widened block 11:50 to 12:40 at no point: 11:50 is its end.
    expect(free).toContain('11:20');
    expect(free).toContain('12:40');
    expect(free).toHaveLength(11);
    // A wider gap reaches the neighbours.
    const wide: SlotRules = { ...RULES, bufferMinutes: 20 };
    const withWide = daySlots({ day: DAY, rules: wide, bookings, busy: [], now: NOW }).map(clock);
    expect(withWide).toEqual([
      '10:00',
      '10:50',
      '13:20',
      '14:10',
      '15:00',
      '15:50',
      '16:40',
      '17:30',
    ]);
  });

  it('subtracts the host calendar busy blocks as they are, edges free', () => {
    const busy = [{ start: at('13:00'), end: at('14:00') }];
    const free = daySlots({ day: DAY, rules: RULES, bookings: [], busy, now: NOW }).map(clock);
    // 12:40 runs to 13:10, into the block; 13:20 sits inside it; 14:00 starts as it ends.
    expect(free).not.toContain('12:40');
    expect(free).not.toContain('13:20');
    expect(free).toContain('12:00');
    expect(free).toContain('14:00');
    expect(free).toHaveLength(10);
  });

  it('closes the day at maxPerDay bookings, counting the ones that start on the day only', () => {
    const four = ['10:00', '10:40', '11:20', '12:00'].map((c) => ({
      start: at(c),
      end: slotEnd(at(c), RULES),
    }));
    expect(daySlots({ day: DAY, rules: RULES, bookings: four, busy: [], now: NOW })).toEqual([]);
    expect(
      daySlots({ day: DAY, rules: RULES, bookings: four.slice(0, 3), busy: [], now: NOW }),
    ).toHaveLength(9);
    // A booking of the day before does not count against the day, only against its own.
    const yesterday = { start: at('17:20', '2026-09-21'), end: at('17:50', '2026-09-21') };
    expect(
      daySlots({
        day: DAY,
        rules: RULES,
        bookings: [...four.slice(0, 3), yesterday],
        busy: [],
        now: NOW,
      }),
    ).toHaveLength(9);
  });

  it('reads the day boundary in Riyadh: a slot at 10:00 sits on the 22nd, not the UTC 21st', () => {
    const start = at('10:00');
    expect(start.toISOString()).toBe('2026-09-22T07:00:00.000Z');
    const midnightRules: SlotRules = {
      ...RULES,
      noticeHours: 0,
      hours: [{ day: 2, from: '00:00', to: '01:00' }],
    };
    // 00:00 Riyadh on the 22nd is 21:00 UTC on the 21st; the grid still belongs to the 22nd.
    const free = daySlots({
      day: DAY,
      rules: midnightRules,
      bookings: [],
      busy: [],
      now: new Date('2026-09-20T12:00:00Z'),
    });
    expect(free.map((d) => d.toISOString())).toEqual(['2026-09-21T21:00:00.000Z']);
    expect(isOnGrid(free[0]!, midnightRules)).toBe(true);
  });

  it('answers in order and never the same instant twice', () => {
    const free = daySlots({ day: DAY, rules: RULES, bookings: [], busy: [], now: NOW });
    const times = free.map((d) => d.getTime());
    expect(times).toEqual([...times].toSorted((a, b) => a - b));
    expect(new Set(times).size).toBe(times.length);
  });
});
