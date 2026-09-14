import { copyFor } from '@/content/copy';
import type { Locale } from '@/lib/i18n';

/**
 * `YYYY-MM-DD` → «13 سبتمبر 2026» or `13 September 2026`: Gregorian, Western digits in both
 * languages (BRD 3.9, constitution I). The `Intl` tag comes from the locale's copy bank.
 */
const formatters = new Map<Locale, Intl.DateTimeFormat>();

function formatter(locale: Locale): Intl.DateTimeFormat {
  let f = formatters.get(locale);
  if (!f) {
    f = new Intl.DateTimeFormat(copyFor(locale).dateLocale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });
    formatters.set(locale, f);
  }
  return f;
}

/** A `YYYY-MM-DD` date or a full ISO timestamp (the CMS stores the latter). */
export function formatDate(locale: Locale, iso: string): string {
  return formatter(locale).format(new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso));
}

/** The `YYYY-MM-DD` part of a timestamp, for `<time dateTime>` and the sitemap. */
export function isoDay(iso: string): string {
  return iso.slice(0, 10);
}
