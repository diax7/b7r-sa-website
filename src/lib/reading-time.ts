import type { SiteCopy } from '@/content/copy';
import type { Locale } from '@/lib/i18n';

/** Reading pace per language for the «{n} دقائق قراءة» meta line (BRD 4.13): Arabic, then English. */
export const WORDS_PER_MINUTE: Record<Locale, number> = { ar: 150, en: 200 };

/** Whole minutes, never below 1; Markdown syntax and headings count as words like any other. */
export function readingMinutes(text: string, locale: Locale = 'ar'): number {
  const words = text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE[locale]));
}

/**
 * Count agreement for the meta line: the BRD template «{n} دقائق قراءة» is the 3–10 form;
 * 1, 2 and 11+ take their own forms (ux-araby plural rules). English uses one form.
 */
export function readingLabel(copy: SiteCopy['readingTime'], minutes: number): string {
  if (minutes === 1) return copy.one;
  if (minutes === 2) return copy.two;
  if (minutes <= 10) return copy.few.replace('{n}', String(minutes));
  return copy.many.replace('{n}', String(minutes));
}
