/** `YYYY-MM-DD` → «13 سبتمبر 2026»: Gregorian, Western digits (BRD 3.9, constitution I). */
const formatter = new Intl.DateTimeFormat('ar-u-nu-latn-ca-gregory', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

export function formatArabicDate(isoDate: string): string {
  return formatter.format(new Date(`${isoDate}T00:00:00Z`));
}
