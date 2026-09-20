import { riyadh, RIYADH } from '@/lib/riyadh';
import { addRiyadhDays, riyadhInstant, riyadhWeekday } from '@/modules/bookings/slots';

/**
 * The month grid's arithmetic (ADR-063), pure and free of any bank: the cells of a Riyadh
 * month Sunday first, six rows always (the pane keeps its height from month to month), the
 * bounds the ‹ › arrows respect (today's month to the horizon's), the neighbour months, the
 * weekday initials of a locale and the keyboard's moves by reading direction.
 */
export interface MonthCell {
  /** `YYYY-MM-DD` in Riyadh. */
  key: string;
  /** The day of the month, `1` to `31`. */
  day: number;
}

export const WEEK = 7;
export const ROWS = 6;
const DAY_MS = 86_400_000;

/** `2026-09` → `{ year: 2026, month: 9 }`. */
export function monthParts(month: string): { year: number; month: number } {
  const [year, m] = month.split('-').map(Number);
  return { year: year ?? 0, month: m ?? 1 };
}

/** The month a Riyadh day key belongs to. */
export const monthOf = (day: string): string => day.slice(0, 7);

/** The Riyadh month key of an instant. */
export const monthKeyOf = (now: Date): string => riyadh(now).monthKey;

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** The month `n` steps away (`1` next, `-1` previous). */
export function shiftMonth(month: string, n: number): string {
  const { year, month: m } = monthParts(month);
  const index = year * 12 + (m - 1) + n;
  return `${Math.floor(index / 12)}-${pad((index % 12) + 1)}`;
}

/** How many days the month has. */
export function daysInMonth(month: string): number {
  const { year, month: m } = monthParts(month);
  return new Date(Date.UTC(year, m, 0)).getUTCDate();
}

/**
 * The 42 cells of the month, Sunday first: `null` where the row has no day of the month
 * (before the first, after the last), a cell with its key and day number otherwise.
 */
export function monthCells(month: string): Array<MonthCell | null> {
  const lead = riyadhWeekday(`${month}-01`);
  const count = daysInMonth(month);
  const cells: Array<MonthCell | null> = [];
  for (let i = 0; i < WEEK * ROWS; i++) {
    const day = i - lead + 1;
    cells.push(day >= 1 && day <= count ? { key: `${month}-${pad(day)}`, day } : null);
  }
  return cells;
}

/** The grid's rows, each of seven cells. */
export function monthRows(month: string): Array<Array<MonthCell | null>> {
  const cells = monthCells(month);
  return Array.from({ length: ROWS }, (_, r) => cells.slice(r * WEEK, r * WEEK + WEEK));
}

/** The first and the last month the arrows reach: today's and the horizon's, in Riyadh. */
export function monthBoundsOf(horizonDays: number, now: Date): { first: string; last: string } {
  const today = riyadh(now).dateKey;
  return { first: monthOf(today), last: monthOf(addRiyadhDays(today, horizonDays)) };
}

/** The weekday names of a locale, Sunday first: the initial for the header, the long name for the reader. */
export function weekdayNames(dateLocale: string): Array<{ initial: string; long: string }> {
  // 2026-09-20 is a Sunday on every calendar the banks use (Gregorian).
  const sunday = riyadhInstant('2026-09-20', 12 * 60).getTime();
  const narrow = new Intl.DateTimeFormat(dateLocale, { timeZone: RIYADH, weekday: 'narrow' });
  const long = new Intl.DateTimeFormat(dateLocale, { timeZone: RIYADH, weekday: 'long' });
  return Array.from({ length: WEEK }, (_, i) => {
    const date = new Date(sunday + i * DAY_MS);
    return { initial: narrow.format(date), long: long.format(date) };
  });
}

/** The month as its header says it: «سبتمبر 2026» / "September 2026". */
export function monthLabel(month: string, dateLocale: string): string {
  return new Intl.DateTimeFormat(dateLocale, { timeZone: RIYADH, month: 'long', year: 'numeric' })
    .format(riyadhInstant(`${month}-01`, 12 * 60))
    .replaceAll(/[‎‏]/g, '');
}

export type GridKey = 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown' | 'Home' | 'End';

/**
 * How many days a key moves, by reading direction: the arrow toward the end of the line is
 * "next" (Right in English, Left in Arabic), a row is a week, Home and End are the row's
 * ends. Anything else moves nothing.
 */
export function keyStep(key: string, dir: 'ltr' | 'rtl'): number | 'home' | 'end' | null {
  const forward = dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
  const backward = dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
  if (key === forward) return 1;
  if (key === backward) return -1;
  if (key === 'ArrowDown') return WEEK;
  if (key === 'ArrowUp') return -WEEK;
  if (key === 'Home') return 'home';
  if (key === 'End') return 'end';
  return null;
}

/**
 * Where a key moves the focus from `from` among the `open` days of the month, skipping the
 * closed ones: the next open day in that direction inside the month, or `'next'` /
 * `'previous'` when the move leaves the month (the caller turns the page when it may).
 * Home and End go to the first and the last open day of the row.
 */
export function moveFocus(
  from: string,
  step: number | 'home' | 'end',
  open: ReadonlySet<string>,
): string | 'next' | 'previous' | null {
  const month = monthOf(from);
  if (step === 'home' || step === 'end') {
    const weekday = riyadhWeekday(from);
    const start = addRiyadhDays(from, -weekday);
    const row = Array.from({ length: WEEK }, (_, i) => addRiyadhDays(start, i)).filter(
      (key) => monthOf(key) === month && open.has(key),
    );
    const target = step === 'home' ? row[0] : row.at(-1);
    return target && target !== from ? target : null;
  }
  let key = from;
  for (let guard = 0; guard < 62; guard++) {
    key = addRiyadhDays(key, step);
    if (monthOf(key) !== month) return step > 0 ? 'next' : 'previous';
    if (open.has(key)) return key;
  }
  return null;
}

/** The first open day of a month's counts, or none. */
export function firstOpen(days: Record<string, number> | undefined): string | null {
  if (!days) return null;
  for (const key of Object.keys(days).toSorted()) if ((days[key] ?? 0) > 0) return key;
  return null;
}

/** The last open day of a month's counts, or none. */
export function lastOpen(days: Record<string, number> | undefined): string | null {
  if (!days) return null;
  for (const key of Object.keys(days).toSorted().toReversed()) if ((days[key] ?? 0) > 0) return key;
  return null;
}
