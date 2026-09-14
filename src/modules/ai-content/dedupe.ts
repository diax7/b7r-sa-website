import { fold } from '@/lib/arabic-fold';

/**
 * Dedupe (BRD 10.2.4 step 1, 10.2.5): a topic is skipped when a published post already
 * carries its primary keyword, or when the two titles share 60 % or more of their tokens,
 * and a keyword is never republished within twelve months of the post that covered it.
 */
export const TITLE_OVERLAP = 0.6;
export const REPUBLISH_MONTHS = 12;

const STOP = new Set(['في', 'من', 'على', 'إلى', 'عن', 'مع', 'أو', 'و', 'ما', 'هل', 'كيف', 'لا']);

/** The meaningful tokens of a title, folded, without stop words and one-letter bits. */
export function tokens(title: string): Set<string> {
  return new Set(
    fold(title)
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .map((t) => t.replace(/^(و|ال|بال|وال|لل)/, ''))
      .filter((t) => t.length > 1 && !STOP.has(t)),
  );
}

/** Share of `a`'s tokens found in `b` (Jaccard would punish a long title for its length). */
export function titleOverlap(a: string, b: string): number {
  const ta = tokens(a);
  const tb = tokens(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let shared = 0;
  for (const t of ta) if (tb.has(t)) shared += 1;
  return shared / Math.min(ta.size, tb.size);
}

export interface PublishedPost {
  title: string;
  primaryKeyword?: string | null | undefined;
  publishedAt: string;
}

/** Why the topic is a duplicate of a published post, or null. */
export function duplicateReason(
  topic: { title: string; primaryKeyword: string },
  published: PublishedPost[],
  now = new Date(),
): string | null {
  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - REPUBLISH_MONTHS);
  const keyword = fold(topic.primaryKeyword);
  for (const post of published) {
    const recent = new Date(post.publishedAt) >= cutoff;
    if (recent && post.primaryKeyword && fold(post.primaryKeyword) === keyword) {
      return `the keyword "${topic.primaryKeyword}" was published on ${post.publishedAt.slice(0, 10)}`;
    }
    if (recent && keyword && fold(post.title).includes(keyword)) {
      return `a published post already carries "${topic.primaryKeyword}"`;
    }
    const overlap = titleOverlap(topic.title, post.title);
    if (overlap >= TITLE_OVERLAP) {
      return `the title shares ${Math.round(overlap * 100)}% of its words with "${post.title}"`;
    }
  }
  return null;
}
