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

/** Riyadh's day as two instants, `[start, next start)`: today's bookings, the calendar Test. */
export function riyadhDayWindow(now: Date): [Date, Date] {
  const start = riyadhDayStart(now);
  return [start, new Date(start.getTime() + 86_400_000)];
}

export function riyadhMonthStart(now: Date): Date {
  const { monthKey } = riyadh(now);
  return new Date(`${monthKey}-01T00:00:00+03:00`);
}

/** The Arabic patterns wrap their separators in bidi marks (U+200E, U+200F); the digits are the whole message. */
const BIDI_MARKS = /[‎‏]/g;

/**
 * The banks' `Intl` tags (BRD 3.9): Gregorian, Western digits in both languages. The copy
 * banks read their `dateLocale` from here, and a client that knows only the content locale
 * (the picker island, the panel's reminder) picks the tag by it without a bank of its own.
 */
export const DATE_LOCALES = { ar: 'ar-u-nu-latn-ca-gregory', en: 'en-GB' } as const;
export type DateLocaleKey = keyof typeof DATE_LOCALES;

/**
 * A moment on the Riyadh clock as the site says it (ADR-062: the booking page, the e-mails),
 * Western digits in both languages: the caller passes the bank's `dateLocale` tag
 * (`ar-u-nu-latn-ca-gregory`, `en-GB`), so a client island needs no bank of its own.
 */
export function riyadhDayLabel(date: Date, dateLocale: string): string {
  return new Intl.DateTimeFormat(dateLocale, {
    timeZone: RIYADH,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
    .format(date)
    .replaceAll(BIDI_MARKS, '');
}

/** «10:00 ص» / "10:00 am", on the Riyadh clock. */
export function riyadhTimeLabel(date: Date, dateLocale: string): string {
  return new Intl.DateTimeFormat(dateLocale, {
    timeZone: RIYADH,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
    .format(date)
    .replaceAll(BIDI_MARKS, '');
}

/**
 * A booking's span as the merchant reads it, in the merchant's language: «الثلاثاء، 22 سبتمبر
 * 2026، 10:00 ص إلى 10:30 ص» / "Tuesday, 22 September 2026, 10:00 am to 10:30 am". The
 * e-mails and the panel's reminder add the clock's name after it.
 */
export function riyadhSpanLabel(start: Date, end: Date, locale: DateLocaleKey): string {
  const tag = DATE_LOCALES[locale];
  const comma = locale === 'ar' ? '،' : ',';
  const joiner = locale === 'ar' ? ' إلى ' : ' to ';
  return `${riyadhDayLabel(start, tag)}${comma} ${riyadhTimeLabel(start, tag)}${joiner}${riyadhTimeLabel(end, tag)}`;
}

/** The month a day of the picker's strip belongs to: «سبتمبر 2026» / "September 2026". */
export function riyadhMonthLabel(date: Date, dateLocale: string): string {
  return new Intl.DateTimeFormat(dateLocale, { timeZone: RIYADH, month: 'long', year: 'numeric' })
    .format(date)
    .replaceAll(BIDI_MARKS, '');
}

/** The strip's chip: the short weekday and the day of the month, on the Riyadh clock. */
export function riyadhChipLabel(date: Date, dateLocale: string): { weekday: string; day: string } {
  const pieces = new Intl.DateTimeFormat(dateLocale, {
    timeZone: RIYADH,
    weekday: 'short',
    day: 'numeric',
  }).formatToParts(date);
  const piece = (type: string) =>
    pieces.find((p) => p.type === type)?.value.replaceAll(BIDI_MARKS, '') ?? '';
  return { weekday: piece('weekday'), day: piece('day') };
}
