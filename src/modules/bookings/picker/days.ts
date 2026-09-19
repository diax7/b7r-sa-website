import { riyadh, riyadhChipLabel, riyadhMonthLabel } from '@/lib/riyadh';
import { addRiyadhDays, riyadhInstant, riyadhWeekday } from '@/modules/bookings/slots';

/** What the picker knows of the settings without asking the API: enough to draw the strip. */
export interface PickerSettings {
  /** The consultation's name, in the page's language. */
  title: string;
  durationMinutes: number;
  horizonDays: number;
  noticeHours: number;
  /** The Riyadh weekdays with hours, 0 being Sunday. */
  openWeekdays: number[];
  /** The closed dates with their reason in the page's language. */
  closedDates: Array<{ date: string; reason: string }>;
}

export interface StripDay {
  /** `YYYY-MM-DD` in Riyadh. */
  key: string;
  weekday: string;
  day: string;
  /** Closed by the weekly hours (no row) or by a closed date; the reason when it is a date. */
  closed: boolean;
  reason: string | null;
}

export interface StripMonth {
  label: string;
  days: StripDay[];
}

/**
 * The strip's days from today to the horizon, on the Riyadh clock, grouped by month with
 * their labels in the page's language (Western digits through the bank's `dateLocale`);
 * a day without hours or on a closed date is greyed, with the closed date's reason.
 */
export function stripMonths(
  settings: Pick<PickerSettings, 'horizonDays' | 'openWeekdays' | 'closedDates'>,
  dateLocale: string,
  now: Date,
): StripMonth[] {
  const today = riyadh(now).dateKey;
  const closedReason = new Map(settings.closedDates.map((c) => [c.date, c.reason]));
  const months: StripMonth[] = [];
  for (let offset = 0; offset <= settings.horizonDays; offset++) {
    const key = addRiyadhDays(today, offset);
    const instant = riyadhInstant(key, 12 * 60);
    const label = riyadhMonthLabel(instant, dateLocale);
    let month = months.at(-1);
    if (!month || month.label !== label) {
      month = { label, days: [] };
      months.push(month);
    }
    const reason = closedReason.get(key) ?? null;
    const closed = reason !== null || !settings.openWeekdays.includes(riyadhWeekday(key));
    month.days.push({ key, ...riyadhChipLabel(instant, dateLocale), closed, reason });
  }
  return months;
}

/** The first day the strip can select: the first open day, else today. */
export function firstOpenDay(months: StripMonth[]): string | null {
  for (const month of months) {
    const day = month.days.find((d) => !d.closed);
    if (day) return day.key;
  }
  return null;
}
