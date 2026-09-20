import { riyadh } from '@/lib/riyadh';
import {
  addRiyadhDays,
  daySlots,
  type Interval,
  type SlotRules,
  withinHorizon,
} from '@/modules/bookings/slots';

/**
 * The month's open days (ADR-063), pure: for each day of a Riyadh month that lies within
 * today..the horizon, how many starts the rules leave free once the day's bookings, the
 * notice and the cap are subtracted. The host calendar is never asked here: Google decides
 * the exact slots when the day is picked, so a day can open in the grid and then show the
 * empty state when the host is busy all day. A count, not a boolean: the grid mutes a full
 * day, and the times pane's skeleton draws the right number of rows.
 */
export const MONTH_KEY = /^\d{4}-(0[1-9]|1[0-2])$/;

/** The days of a month as Riyadh day keys, `YYYY-MM-01` to its last day. */
export function daysOfMonth(month: string): string[] {
  const [year, monthNumber] = month.split('-').map(Number);
  const count = new Date(Date.UTC(year ?? 0, monthNumber ?? 1, 0)).getUTCDate();
  return Array.from({ length: count }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`);
}

/** The first and the last month the booker may show: today's and the horizon's, in Riyadh. */
export function monthBounds(
  rules: Pick<SlotRules, 'horizonDays'>,
  now: Date,
): { first: string; last: string } {
  const today = riyadh(now).dateKey;
  return { first: today.slice(0, 7), last: addRiyadhDays(today, rules.horizonDays).slice(0, 7) };
}

/** A month the route answers: today's up to the horizon's, inclusive. */
export function withinMonths(month: string, rules: Pick<SlotRules, 'horizonDays'>, now: Date) {
  const { first, last } = monthBounds(rules, now);
  return month >= first && month <= last;
}

export interface MonthDaysInput {
  /** `YYYY-MM` in Riyadh. */
  month: string;
  rules: SlotRules;
  /** The active bookings that touch the month (any status but cancelled). */
  bookings: ReadonlyArray<Interval>;
  now: Date;
}

/**
 * Each day of the month within the horizon with its free count; a day outside the horizon
 * is absent, a closed, full or notice-hidden day answers 0.
 */
export function monthDays({ month, rules, bookings, now }: MonthDaysInput): Record<string, number> {
  const days: Record<string, number> = {};
  for (const day of daysOfMonth(month)) {
    if (!withinHorizon(day, rules, now)) continue;
    days[day] = daySlots({ day, rules, bookings, busy: [], now }).length;
  }
  return days;
}
