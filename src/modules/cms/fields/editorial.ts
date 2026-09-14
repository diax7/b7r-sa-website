import { latinParagraphs, type LexicalState, linkTargets, plainText } from '@/lib/lexical';
import { readingMinutes } from '@/lib/reading-time';

/**
 * The editorial rules of a post (BRD 10.1), pure so the unit test needs no database. The
 * hard rules refuse a publish; the soft rules become the `warnings` an editor sees in the
 * sidebar and the content engine reads before it publishes.
 */
export const TITLE_MAX = 70;
export const EXCERPT_MAX = 160;
export const TAKEAWAYS = 3;
export const MIN_INTERNAL_LINKS = 2;

/** Hosts an internal link must never point at (a soft rule): the competitors of BRD 2.3. */
export const COMPETITOR_HOSTS = [
  'printful.com',
  'printify.com',
  'gelato.com',
  'teespring.com',
  'spring.com',
  'redbubble.com',
  'merch.amazon.com',
];

const EM_DASH = String.fromCharCode(0x2014);

export interface PostDraft {
  title?: unknown;
  excerpt?: unknown;
  takeaways?: unknown;
  cover?: unknown;
  body?: unknown;
}

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function takeawayCount(value: unknown): number {
  if (!Array.isArray(value)) return 0;
  return value.filter((row) => {
    const text = typeof row === 'string' ? row : (row as { text?: unknown })?.text;
    return str(text).length > 0;
  }).length;
}

function bodyOf(value: unknown): LexicalState | null {
  return value && typeof value === 'object' && 'root' in value ? (value as LexicalState) : null;
}

/** Why a post cannot be published, in the order an editor should fix them; empty when it can. */
export function publishProblems(post: PostDraft): string[] {
  const problems: string[] = [];
  const title = str(post.title);
  const excerpt = str(post.excerpt);
  if (!title) problems.push('Title: required');
  else if (title.length > TITLE_MAX) problems.push(`Title: at most ${TITLE_MAX} characters`);
  if (!excerpt) problems.push('Excerpt: required');
  else if (excerpt.length > EXCERPT_MAX) {
    problems.push(`Excerpt: at most ${EXCERPT_MAX} characters`);
  }
  if (takeawayCount(post.takeaways) !== TAKEAWAYS) {
    problems.push(`Key takeaways: exactly ${TAKEAWAYS}`);
  }
  if (!post.cover) problems.push('Cover: required');
  const internal = linkTargets(bodyOf(post.body)).filter((l) => l.internal).length;
  if (internal < MIN_INTERNAL_LINKS) {
    problems.push(`Body: at least ${MIN_INTERNAL_LINKS} links to pages of this site`);
  }
  return problems;
}

/** What an editor should look at before publishing; never blocks a save. */
export function editorialWarnings(post: PostDraft): string[] {
  const warnings: string[] = [];
  const body = bodyOf(post.body);
  for (const link of linkTargets(body)) {
    if (link.internal) continue;
    const host = hostOf(link.href);
    if (host && COMPETITOR_HOSTS.some((c) => host === c || host.endsWith(`.${c}`))) {
      warnings.push(`A link to a competitor: ${host}`);
    }
  }
  const latin = latinParagraphs(body);
  if (latin.length > 0) {
    warnings.push(`${latin.length} paragraph${latin.length === 1 ? '' : 's'} in Latin script`);
  }
  const text = [str(post.title), str(post.excerpt), plainText(body)].join('\n');
  if (text.includes(EM_DASH)) warnings.push('An em dash in the text (use a colon or a comma)');
  return warnings;
}

/** Reading time of the body, for the meta line; 1 for an empty body. */
export function bodyReadingMinutes(body: unknown): number {
  return readingMinutes(plainText(bodyOf(body)));
}

function hostOf(href: string): string | null {
  try {
    return new URL(href).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}
