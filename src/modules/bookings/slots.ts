import { riyadh } from '@/lib/riyadh';

/**
 * The slot arithmetic (ADR-062), pure: from the settings' weekly hours, the closed dates,
 * the notice and the horizon, minus the day's bookings (each with the gap on both sides)
 * and the host calendar's busy blocks, capped by the day's maximum. Everything is read on
 * the Riyadh clock (UTC+3, no daylight saving); the instants in and out are UTC dates.
 *
 * The grid rule that makes the database's partial unique index on `start` sufficient: a
 * slot is `from` plus a multiple of `duration + gap`, so two bookings that overlap have the
 * same `start`, and the index refuses the second.
 */
export interface SlotRules {
  durationMinutes: number;
  bufferMinutes: number;
  noticeHours: number;
  horizonDays: number;
  maxPerDay: number;
  /** `day` 0 is Sunday; `from` and `to` as `HH:MM` in Riyadh. */
  hours: ReadonlyArray<{ day: number; from: string; to: string }>;
  /** `YYYY-MM-DD` in Riyadh. */
  closedDates: ReadonlyArray<string>;
}

export interface Interval {
  start: Date;
  end: Date;
}

export const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;
const MINUTE_MS = 60_000;
const DAY_MS = 86_400_000;
const RIYADH_OFFSET = '+03:00';

/** The UTC instant a Riyadh day reads `minuteOfDay` minutes past midnight. */
export function riyadhInstant(day: string, minuteOfDay = 0): Date {
  return new Date(new Date(`${day}T00:00:00${RIYADH_OFFSET}`).getTime() + minuteOfDay * MINUTE_MS);
}

/** 0 is Sunday, read on the Riyadh clock. */
export function riyadhWeekday(day: string): number {
  return riyadhInstant(day, 12 * 60).getUTCDay();
}

/** A Riyadh day key moved by whole days. */
export function addRiyadhDays(day: string, n: number): string {
  return riyadh(new Date(riyadhInstant(day, 12 * 60).getTime() + n * DAY_MS)).dateKey;
}

/** `10:30` → 630. */
export function minuteOf(clock: string): number {
  const [h, m] = clock.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** Whole days from Riyadh's today to `day`: 0 today, 1 tomorrow, negative in the past. */
export function dayOffset(day: string, now: Date): number {
  const today = riyadhInstant(riyadh(now).dateKey, 12 * 60).getTime();
  return Math.round((riyadhInstant(day, 12 * 60).getTime() - today) / DAY_MS);
}

/** A day the picker may show: today up to `horizonDays` ahead, inclusive. */
export function withinHorizon(day: string, rules: SlotRules, now: Date): boolean {
  const offset = dayOffset(day, now);
  return offset >= 0 && offset <= rules.horizonDays;
}

export function isClosed(day: string, rules: SlotRules): boolean {
  return rules.closedDates.includes(day);
}

/** The Riyadh weekdays that have at least one hours row, for the picker's strip. */
export function openWeekdays(rules: SlotRules): number[] {
  return [...new Set(rules.hours.map((row) => row.day))].toSorted((a, b) => a - b);
}

export function overlaps(a: Interval, b: Interval): boolean {
  return a.start < b.end && b.start < a.end;
}

export function slotEnd(start: Date, rules: SlotRules): Date {
  return new Date(start.getTime() + rules.durationMinutes * MINUTE_MS);
}

/**
 * The day's grid before anything is subtracted: for each hours row of the weekday, `from`
 * plus multiples of `duration + gap` while the slot ends by `to`; two rows for one day are
 * merged and sorted, a duplicate start counted once.
 */
export function gridStarts(day: string, rules: SlotRules): Date[] {
  const weekday = riyadhWeekday(day);
  const step = rules.durationMinutes + rules.bufferMinutes;
  const starts = new Set<number>();
  for (const row of rules.hours) {
    if (row.day !== weekday) continue;
    const from = minuteOf(row.from);
    const to = minuteOf(row.to);
    for (let minute = from; minute + rules.durationMinutes <= to; minute += step) {
      starts.add(riyadhInstant(day, minute).getTime());
    }
  }
  return [...starts].toSorted((a, b) => a - b).map((t) => new Date(t));
}

/** Whether `start` is one of the grid's starts on its Riyadh day (the route's 400 rule). */
export function isOnGrid(start: Date, rules: SlotRules): boolean {
  const day = riyadh(start).dateKey;
  return gridStarts(day, rules).some((s) => s.getTime() === start.getTime());
}

export interface DaySlotsInput {
  /** `YYYY-MM-DD` in Riyadh. */
  day: string;
  rules: SlotRules;
  /** The active bookings that touch the day (any status but cancelled). */
  bookings: ReadonlyArray<Interval>;
  /** The host calendar's busy blocks over the day. */
  busy: ReadonlyArray<Interval>;
  now: Date;
}

/**
 * The free starts of a day, in order: the grid, minus what the notice hides, minus the
 * slots that touch a booking widened by the gap on both sides or a busy block; none when
 * the day is closed, outside the horizon, or already holds `maxPerDay` bookings.
 */
export function daySlots({ day, rules, bookings, busy, now }: DaySlotsInput): Date[] {
  if (!withinHorizon(day, rules, now) || isClosed(day, rules)) return [];
  const dayStart = riyadhInstant(day);
  const dayEnd = riyadhInstant(day, 24 * 60);
  const onDay = bookings.filter((b) => b.start >= dayStart && b.start < dayEnd);
  if (onDay.length >= rules.maxPerDay) return [];
  const earliest = now.getTime() + rules.noticeHours * 60 * MINUTE_MS;
  const gap = rules.bufferMinutes * MINUTE_MS;
  const taken: Interval[] = [
    ...bookings.map((b) => ({
      start: new Date(b.start.getTime() - gap),
      end: new Date(b.end.getTime() + gap),
    })),
    ...busy,
  ];
  return gridStarts(day, rules).filter((start) => {
    if (start.getTime() < earliest) return false;
    const slot = { start, end: slotEnd(start, rules) };
    return !taken.some((t) => overlaps(slot, t));
  });
}
