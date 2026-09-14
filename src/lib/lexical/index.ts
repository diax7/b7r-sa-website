/**
 * Pure helpers over a serialised Lexical editor state (the JSON Payload stores for a rich
 * text field). No Lexical runtime: the tree is walked as data, so the blog templates, the
 * editorial rules and the content engine share one reading of a post's body.
 */
import { type Locale, localePath } from '@/lib/i18n';

export interface LexicalNode {
  type: string;
  tag?: string;
  text?: string;
  url?: string;
  children?: LexicalNode[];
  fields?: {
    linkType?: string;
    url?: string;
    doc?: { relationTo?: string; value?: unknown } | null;
  };
  [key: string]: unknown;
}

export interface LexicalState {
  root: LexicalNode & { children: LexicalNode[] };
}

export interface Heading {
  id: string;
  text: string;
  level: 2 | 3;
}

const HEADING = /^h([23])$/;

/** Depth-first visit of every node under `node`, the node itself first. */
export function* walk(node: LexicalNode): Generator<LexicalNode> {
  yield node;
  for (const child of node.children ?? []) yield* walk(child);
}

/** The text of a node and its descendants, inline runs joined as written. */
export function textOf(node: LexicalNode): string {
  if (typeof node.text === 'string') return node.text;
  return (node.children ?? []).map(textOf).join('');
}

/**
 * Plain text of the whole body: one line per block, which is what reading time, the Latin
 * check and the number check need. Empty when the state is missing or malformed.
 */
export function plainText(state: LexicalState | null | undefined): string {
  const blocks = state?.root?.children ?? [];
  return blocks
    .map(textOf)
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');
}

/**
 * Heading ids are `section-n` by position among the H2s (an H3 takes the id of the H2 it
 * follows plus its own index) so an editor's post and an engine's post get the same anchors,
 * and the table of contents, the CTA split and the freshness job agree.
 */
export function headingIds(state: LexicalState | null | undefined): Map<LexicalNode, string> {
  const ids = new Map<LexicalNode, string>();
  let h2 = 0;
  let h3 = 0;
  for (const block of state?.root?.children ?? []) {
    const match =
      block.type === 'heading' && typeof block.tag === 'string' && HEADING.exec(block.tag);
    if (!match) continue;
    if (match[1] === '2') {
      h2 += 1;
      h3 = 0;
      ids.set(block, `section-${h2}`);
    } else {
      h3 += 1;
      ids.set(block, `section-${h2}-${h3}`);
    }
  }
  return ids;
}

/** The H2s of the body in order, for the table of contents. */
export function headings(state: LexicalState | null | undefined): Heading[] {
  const ids = headingIds(state);
  const out: Heading[] = [];
  for (const [node, id] of ids) {
    if (node.tag !== 'h2') continue;
    const text = textOf(node).trim();
    if (text) out.push({ id, text, level: 2 });
  }
  return out;
}

/**
 * The body split before its third H2, i.e. after the second section (BRD 6.11): the in-post
 * CTA renders between the two halves. A body with fewer than three H2s is all "before".
 */
export function splitAfterSecondHeading(state: LexicalState): [LexicalState, LexicalState | null] {
  const blocks = state.root.children;
  let seen = 0;
  for (const [index, block] of blocks.entries()) {
    if (block.type === 'heading' && block.tag === 'h2') {
      seen += 1;
      if (seen === 3) {
        return [
          { root: { ...state.root, children: blocks.slice(0, index) } },
          { root: { ...state.root, children: blocks.slice(index) } },
        ];
      }
    }
  }
  return [state, null];
}

export interface LinkTarget {
  /** A site path (`/products/tee`), or the absolute URL for an external link. */
  href: string;
  internal: boolean;
}

/**
 * Every link in the body: a link to a document picked in the editor counts as internal, so
 * does a URL that starts with `/`; anything else is external.
 */
export function linkTargets(state: LexicalState | null | undefined): LinkTarget[] {
  const out: LinkTarget[] = [];
  if (!state?.root) return out;
  for (const node of walk(state.root)) {
    if (node.type !== 'link' && node.type !== 'autolink') continue;
    const fields = node.fields ?? {};
    if (fields.linkType === 'internal') {
      out.push({ href: docHref(fields.doc) ?? '/', internal: true });
      continue;
    }
    const url = (fields.url ?? node.url ?? '').trim();
    if (!url) continue;
    out.push({ href: url, internal: url.startsWith('/') && !url.startsWith('//') });
  }
  return out;
}

/**
 * The site path of a document a link points at, when the relationship is populated, under
 * the locale's prefix (ADR-043): an English body links the English twin.
 */
export function docHref(
  doc: { relationTo?: string; value?: unknown } | null | undefined,
  locale: Locale = 'ar',
): string | null {
  if (!doc || typeof doc.value !== 'object' || doc.value === null) return null;
  const slug = (doc.value as { slug?: unknown })['slug'];
  if (typeof slug !== 'string') return null;
  if (doc.relationTo === 'pages') return localePath(locale, `/${slug}`);
  if (doc.relationTo === 'products') return localePath(locale, `/products/${slug}`);
  if (doc.relationTo === 'posts') return localePath(locale, `/blog/${slug}`);
  return null;
}

const ARABIC_LETTER = /[\u0600-\u06FF]/g;
const LATIN_LETTER = /[A-Za-z]/g;
const LATIN_WORD = /[A-Za-z]{2,}/g;
const ARABIC_WORD = /[\u0600-\u06FF]{2,}/g;
const PROSE_WORDS = 4;

/**
 * Paragraphs written in Latin script (BRD 10.1, a soft rule): four Latin words or more and
 * more Latin letters than Arabic ones. A brand name inside an Arabic sentence passes, so
 * does a line that is only a name; an English paragraph does not. Headings and list items
 * count as paragraphs here.
 */
export function latinParagraphs(state: LexicalState | null | undefined): string[] {
  return plainText(state)
    .split('\n')
    .filter((line) => {
      const words = line.match(LATIN_WORD)?.length ?? 0;
      const latin = line.match(LATIN_LETTER)?.length ?? 0;
      const arabic = line.match(ARABIC_LETTER)?.length ?? 0;
      return words >= PROSE_WORDS && latin > arabic;
    });
}

/** The mirror for an English body (ADR-043): paragraphs written in Arabic script. */
export function arabicParagraphs(state: LexicalState | null | undefined): string[] {
  return plainText(state)
    .split('\n')
    .filter((line) => {
      const words = line.match(ARABIC_WORD)?.length ?? 0;
      const latin = line.match(LATIN_LETTER)?.length ?? 0;
      const arabic = line.match(ARABIC_LETTER)?.length ?? 0;
      return words >= PROSE_WORDS && arabic > latin;
    });
}
