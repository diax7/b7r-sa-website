/** `YYYY-MM-DD` → «13 سبتمبر 2026»: Gregorian, Western digits (BRD 3.9, constitution I). */
const formatter = new Intl.DateTimeFormat('ar-u-nu-latn-ca-gregory', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

/** A `YYYY-MM-DD` date or a full ISO timestamp (the CMS stores the latter). */
export function formatArabicDate(iso: string): string {
  return formatter.format(new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso));
}

/** The `YYYY-MM-DD` part of a timestamp, for `<time dateTime>` and the sitemap. */
export function isoDay(iso: string): string {
  return iso.slice(0, 10);
}
