/** Arabic reading speed used for the «{n} دقائق قراءة» meta line (BRD 4.13). */
export const WORDS_PER_MINUTE = 150;

/** Whole minutes, never below 1; Markdown syntax and headings count as words like any other. */
export function readingMinutes(text: string): number {
  const words = text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

/**
 * Arabic count agreement for the meta line: the BRD template «{n} دقائق قراءة» is the 3–10
 * form; 1, 2 and 11+ take their own forms (ux-araby plural rules).
 */
export function readingLabel(minutes: number): string {
  if (minutes === 1) return 'دقيقة قراءة';
  if (minutes === 2) return 'دقيقتا قراءة';
  if (minutes <= 10) return `${minutes} دقائق قراءة`;
  return `${minutes} دقيقة قراءة`;
}
