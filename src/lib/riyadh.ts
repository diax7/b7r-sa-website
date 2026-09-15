/**
 * The site's clock (BRD 10.2.4): the engine's publish hour, the day a run counts against and
 * the month a connection's spend is summed over are all read in Riyadh, which is UTC+3 all
 * year (no daylight saving).
 */
export const RIYADH = 'Asia/Riyadh';

export interface RiyadhTime {
  hour: number;
  /** `YYYY-MM-DD` in Riyadh. */
  dateKey: string;
  /** `YYYY-MM` in Riyadh. */
  monthKey: string;
}

const parts = new Intl.DateTimeFormat('en-CA', {
  timeZone: RIYADH,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  hour12: false,
});

export function riyadh(now: Date): RiyadhTime {
  const map = Object.fromEntries(parts.formatToParts(now).map((p) => [p.type, p.value]));
  const dateKey = `${map['year']}-${map['month']}-${map['day']}`;
  return { hour: Number(map['hour']) % 24, dateKey, monthKey: dateKey.slice(0, 7) };
}

/** The UTC instant Riyadh's day began, for "runs started today" queries. */
export function riyadhDayStart(now: Date): Date {
  const { dateKey } = riyadh(now);
  // Riyadh is UTC+3 all year (no daylight saving).
  return new Date(`${dateKey}T00:00:00+03:00`);
}

export function riyadhMonthStart(now: Date): Date {
  const { monthKey } = riyadh(now);
  return new Date(`${monthKey}-01T00:00:00+03:00`);
}
