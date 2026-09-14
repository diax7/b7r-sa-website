import { fold } from '@/lib/arabic-fold';

/**
 * Ranking for the command palette (ADR-039): pure, unit-tested. Text is folded before
 * matching (`lib/arabic-fold.ts`).
 */
export interface Rankable {
  label: string;
  /** Extra text that may match (a group name, a slug); weighs less than the label. */
  keywords?: string;
}

export const MIN_QUERY = 2;

/** 0 = no match; higher is better: prefix of the label > word start > substring > keywords. */
export function score(query: string, item: Rankable): number {
  const q = fold(query);
  if (!q) return 0;
  const label = fold(item.label);
  if (label.startsWith(q)) return 4;
  if (label.split(' ').some((w) => w.startsWith(q))) return 3;
  if (label.includes(q)) return 2;
  if (item.keywords && fold(item.keywords).includes(q)) return 1;
  return 0;
}

/** Items that match, best first; stable for equal scores (the caller's order wins). */
export function rank<T extends Rankable>(query: string, items: readonly T[]): T[] {
  return items
    .map((item, index) => ({ item, index, score: score(query, item) }))
    .filter((r) => r.score > 0)
    .toSorted((a, b) => b.score - a.score || a.index - b.index)
    .map((r) => r.item);
}
