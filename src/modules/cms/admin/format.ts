import { RIYADH, riyadh } from '@/lib/riyadh';
import { adminStringsFor } from '@/modules/cms/admin/strings';

/**
 * Numbers, dates and "5 minutes ago" in the panel's UI language (ADR-056), the digits always
 * Western (design system §5): the locale carries `-u-nu-latn`, so Arabic reads "1,234" and
 * "قبل 5 دقائق", never "١٬٢٣٤". Every number or date an admin component prints goes through
 * here; day keys (`YYYY-MM-DD`) are shown as they are, since they sort and match the rows.
 * A date is read in Riyadh (the site's clock, `lib/riyadh.ts`), never the process's zone:
 * the container runs UTC, and a save at 01:00 Riyadh must not read as the day before.
 */
export function formatLocale(language: string): string {
  return `${language === 'ar' ? 'ar' : 'en-GB'}-u-nu-latn`;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** The Arabic patterns wrap their separators in bidi marks (U+200E, U+200F); the digits are the whole message. */
const BIDI_MARKS = /[\u200E\u200F]/g;

export function formatNumber(n: number, language: string): string {
  return new Intl.NumberFormat(formatLocale(language)).format(n);
}

/** `dd/MM/yyyy` in both languages (design system §5), the day as Riyadh counts it. */
export function formatDate(date: Date, language: string): string {
  return new Intl.DateTimeFormat(formatLocale(language), {
    timeZone: RIYADH,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
    .format(date)
    .replaceAll(BIDI_MARKS, '');
}

/** `HH:mm` on the Riyadh clock, 24 hours, in both languages. */
export function formatTime(date: Date, language: string): string {
  return new Intl.DateTimeFormat(formatLocale(language), {
    timeZone: RIYADH,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
    .format(date)
    .replaceAll(BIDI_MARKS, '');
}

/**
 * A moment ahead as the dashboard says it: "today 07:00", "tomorrow 04:00", then the date
 * (`dd/MM/yyyy 06:00`), the day and the hour both read in Riyadh; the caller adds the clock's
 * name (`time.riyadh`). A moment already past reads like any other date.
 */
export function formatSlot(date: Date, language: string, now: Date = new Date()): string {
  const s = adminStringsFor(language).time;
  const day = riyadh(date).dateKey;
  const today = riyadh(now).dateKey;
  const tomorrow = riyadh(new Date(now.getTime() + DAY)).dateKey;
  const word = day === today ? s.today : day === tomorrow ? s.tomorrow : formatDate(date, language);
  return s.dayAt.replace('{day}', word).replace('{time}', formatTime(date, language));
}

/**
 * "5 minutes ago" / «قبل 5 دقائق» for the dashboard and the widgets; under a minute reads as
 * "just now"; beyond a week the date is shown.
 */
export function relativeTime(iso: string | Date, language: string, now: Date = new Date()): string {
  const date = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(date.getTime())) return '';
  const diff = now.getTime() - date.getTime();
  if (diff < MINUTE) return adminStringsFor(language).time.justNow;
  const relative = new Intl.RelativeTimeFormat(formatLocale(language), { numeric: 'always' });
  if (diff < HOUR) return relative.format(-Math.floor(diff / MINUTE), 'minute');
  if (diff < DAY) return relative.format(-Math.floor(diff / HOUR), 'hour');
  if (diff < 7 * DAY) return relative.format(-Math.floor(diff / DAY), 'day');
  return formatDate(date, language);
}
