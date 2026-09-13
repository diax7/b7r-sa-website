/**
 * "5 minutes ago" for the dashboard (the panel is English); beyond a week the date is shown.
 */
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function ago(n: number, unit: 'minute' | 'hour' | 'day'): string {
  return `${n} ${unit}${n === 1 ? '' : 's'} ago`;
}

export function formatDate(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${date.getFullYear()}`;
}

export function relativeTime(iso: string | Date, now: Date = new Date()): string {
  const date = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(date.getTime())) return '';
  const diff = now.getTime() - date.getTime();
  if (diff < MINUTE) return 'just now';
  if (diff < HOUR) return ago(Math.floor(diff / MINUTE), 'minute');
  if (diff < DAY) return ago(Math.floor(diff / HOUR), 'hour');
  if (diff < 7 * DAY) return ago(Math.floor(diff / DAY), 'day');
  return formatDate(date);
}
