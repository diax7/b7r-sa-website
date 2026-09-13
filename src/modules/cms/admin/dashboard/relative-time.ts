/**
 * «قبل 3 دقائق»، Arabic relative time for the dashboard (design system §5): the dual and
 * the 3–10 plural are real forms, 11+ takes the singular; beyond a week the date is shown.
 */
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

type Forms = { one: string; two: string; few: string; many: string };

const FORMS: Record<'minute' | 'hour' | 'day', Forms> = {
  minute: { one: 'دقيقة', two: 'دقيقتين', few: 'دقائق', many: 'دقيقة' },
  hour: { one: 'ساعة', two: 'ساعتين', few: 'ساعات', many: 'ساعة' },
  day: { one: 'يوم', two: 'يومين', few: 'أيام', many: 'يوماً' },
};

function ago(n: number, forms: Forms): string {
  if (n === 1) return `قبل ${forms.one}`;
  if (n === 2) return `قبل ${forms.two}`;
  if (n <= 10) return `قبل ${n} ${forms.few}`;
  return `قبل ${n} ${forms.many}`;
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
  if (diff < MINUTE) return 'قبل قليل';
  if (diff < HOUR) return ago(Math.floor(diff / MINUTE), FORMS.minute);
  if (diff < DAY) return ago(Math.floor(diff / HOUR), FORMS.hour);
  if (diff < 7 * DAY) return ago(Math.floor(diff / DAY), FORMS.day);
  return formatDate(date);
}
