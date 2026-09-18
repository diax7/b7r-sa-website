import type { Locale } from '@/lib/i18n';
import { headings, type LexicalState, plainText } from '@/lib/lexical';
import type { Finding, Item, Loc, Section, Status, Text } from '@/modules/visibility/types';
import { INTERROGATIVES, weightOf } from '@/modules/visibility/rules/weights';

/** The value in one language, trimmed, or an empty string. */
export function loc(value: Loc | string | null | undefined, locale: Locale): string {
  if (!value) return '';
  if (typeof value === 'string') return value.trim();
  return (value[locale] ?? '').trim();
}

export function has(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim() !== '';
}

/** The same words in both languages: a name, a file, a brand. */
export function same(text: string): Text {
  return { en: text, ar: text };
}

/** The language a document is judged in, as a listed document names it. */
export const LANGUAGE_NAMES: Record<Locale, Text> = {
  ar: { en: 'Arabic', ar: 'العربية' },
  en: { en: 'English', ar: 'الإنجليزية' },
};

export type DocKind = 'page' | 'product' | 'post' | 'hub' | 'author';

const KIND_NAMES: Record<DocKind, Text> = {
  page: { en: 'page', ar: 'صفحة' },
  product: { en: 'product', ar: 'منتج' },
  post: { en: 'post', ar: 'مقال' },
  hub: { en: 'hub', ar: 'قسم' },
  author: { en: 'author', ar: 'كاتب' },
};

/**
 * How a finding names a listed document: its title, then in brackets its kind and the
 * language judged, whichever apply ("Hoodie (product, English)", «هودي (منتج، الإنجليزية)»).
 */
export function docLabel(title: string, kind?: DocKind, locale?: Locale): Text {
  const tags = (language: keyof Text) =>
    [kind ? KIND_NAMES[kind][language] : null, locale ? LANGUAGE_NAMES[locale][language] : null]
      .filter((t): t is string => t !== null)
      .join(language === 'ar' ? '، ' : ', ');
  const en = tags('en');
  const ar = tags('ar');
  return { en: en ? `${title} (${en})` : title, ar: ar ? `${title} (${ar})` : title };
}

/** A rule with one answer: done, next or missing, by its own judgment. */
export function finding(args: {
  key: string;
  section: Section;
  status: Status;
  title: Text;
  guide: Text;
  href?: string;
}): Finding {
  const weight = weightOf(args.key);
  const earned = args.status === 'done' ? weight : args.status === 'next' ? weight / 2 : 0;
  return { ...args, weight, earned };
}

/**
 * A rule over documents: pro-rata, `next` while partial, the documents that fail listed
 * (up to ten; the count says how many). With nothing to judge the rule is done: an empty
 * blog has no post that lacks an answer.
 */
export function prorata(args: {
  key: string;
  section: Section;
  checks: Array<{ ok: boolean; label: Text; href: string }>;
  title: Text;
  guide: Text;
  href?: string;
}): Finding {
  const weight = weightOf(args.key);
  const total = args.checks.length;
  const done = args.checks.filter((c) => c.ok).length;
  const earned = total === 0 ? weight : (weight * done) / total;
  const status: Status = total === 0 || done === total ? 'done' : done === 0 ? 'missing' : 'next';
  const items: Item[] = args.checks
    .filter((c) => !c.ok)
    .slice(0, 10)
    .map(({ label, href }) => ({ label, href }));
  return {
    key: args.key,
    section: args.section,
    weight,
    earned,
    status,
    title: args.title,
    guide: args.guide,
    ...(args.href ? { href: args.href } : {}),
    items,
    count: { done, total },
  };
}

export function words(text: string): number {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
}

/** The first paragraph with words in a body (an editor's empty first line is skipped), or 0. */
export function openingWords(state: LexicalState | null | undefined): number {
  for (const node of state?.root.children ?? []) {
    if (node.type !== 'paragraph') continue;
    const n = words(plainText({ root: { type: 'root', children: [node] } } as LexicalState));
    if (n > 0) return n;
  }
  return 0;
}

/** A heading phrased as a buyer asks: ends in a question mark or starts with an interrogative. */
export function isQuestion(text: string, locale: Locale): boolean {
  const t = text.trim();
  if (t.endsWith('؟') || t.endsWith('?')) return true;
  const first = t.split(/\s+/)[0]?.toLowerCase() ?? '';
  return (INTERROGATIVES[locale] as readonly string[]).some(
    (w) => first === w || first === `و${w}` || first === `ف${w}`,
  );
}

export function hasQuestionHeading(
  state: LexicalState | null | undefined,
  locale: Locale,
): boolean {
  return headings(state).some((h) => h.level === 2 && isQuestion(h.text, locale));
}

/** The title as the page emits it: the template around it, or the title alone on the home. */
export function emittedTitle(template: string, title: string, absolute = false): string {
  if (absolute || !template.includes('%s')) return title;
  return template.replace('%s', title);
}

export function editHref(
  adminRoute: string,
  collection: string,
  id: number,
  locale?: Locale,
): string {
  return `${adminRoute}/collections/${collection}/${id}${locale === 'en' ? '?locale=en' : ''}`;
}

export function globalHref(adminRoute: string, slug: string, locale?: Locale): string {
  return `${adminRoute}/globals/${slug}${locale === 'en' ? '?locale=en' : ''}`;
}

export function isHttps(value: string | null | undefined): boolean {
  return typeof value === 'string' && /^https:\/\/[^\s"'<>]+$/.test(value.trim());
}
