import { fold } from '@/lib/arabic-fold';
import { COMPETITOR_HOSTS } from '@/modules/cms/fields/editorial';
import type { ConnectionKind } from '@/modules/connections/kinds';

/**
 * Reads an assistant's answer for the ledger (ADR-049 D5): did it name B7R, did it link to
 * the site, which pages it cited, which competitors it named. Pure and table-tested with a
 * recorded shape per engine; the ask hands it the text, the SDK's sources and the raw body.
 */
export const OUR_HOSTS = ['b7r.sa', 'b7r.app'] as const;
export const EXCERPT_LENGTH = 400;

/**
 * The brand after `fold()`: «بحر برنت» with an attached prefix letter allowed («وبحر برنت»,
 * «لبحر برنت»), never bare «بحر» (the sea, «بحر من الخيارات»); `b7r` as a word; the two hosts.
 */
const BRAND_AR = /(^|[^\p{L}])(?:و|ف|ل|ب|ك)?بحر\s*بر(?:ي)?نت/u;
const BRAND_EN = /\bb7r\b/i;
const URL_IN_TEXT = /https?:\/\/[^\s<>()[\]"'«»،؛]+/gi;

export interface AnswerSource {
  url?: string | null;
  title?: string | null;
}

export interface AnswerReading {
  mentioned: boolean;
  linked: boolean;
  /** Every URL the answer cited, ours and others, absolute and de-duplicated. */
  urls: string[];
  /** The competitor hosts (BRD 2.3) among the URLs or named in the text. */
  competitors: string[];
  excerpt: string;
}

export function mentionsBrand(text: string): boolean {
  const folded = fold(text);
  return BRAND_AR.test(folded) || BRAND_EN.test(folded);
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
}

export function isOurHost(host: string | null): boolean {
  return host !== null && OUR_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
}

function competitorOf(host: string | null): string | null {
  if (!host) return null;
  return COMPETITOR_HOSTS.find((c) => host === c || host.endsWith(`.${c}`)) ?? null;
}

/**
 * The competitors as an answer names them (BRD 2.3), on word boundaries: "merchant" is not
 * Merch by Amazon and "springboard" is not Spring; Spring has no safe name and is found by
 * host only.
 */
const COMPETITOR_NAMES: Array<[RegExp, (typeof COMPETITOR_HOSTS)[number]]> = [
  [/\bprintful\b|برنتفل|برينتفول/u, 'printful.com'],
  [/\bprintify\b|برنتفاي|برينتيفاي/u, 'printify.com'],
  [/\bgelato\b|جيلاتو/u, 'gelato.com'],
  [/\bteespring\b/u, 'teespring.com'],
  [/\bredbubble\b|ريدبابل/u, 'redbubble.com'],
  [/\b(?:merch by amazon|amazon merch)\b/u, 'merch.amazon.com'],
];

/** Perplexity's chat body carries `citations` (URLs) and, newer, `search_results[].url`. */
export function rawUrls(raw: unknown): string[] {
  const body = (raw ?? {}) as { citations?: unknown; search_results?: unknown };
  const out: string[] = [];
  if (Array.isArray(body.citations)) {
    for (const c of body.citations) if (typeof c === 'string') out.push(c);
  }
  if (Array.isArray(body.search_results)) {
    for (const r of body.search_results) {
      const url = (r as { url?: unknown } | null)?.url;
      if (typeof url === 'string') out.push(url);
    }
  }
  return out;
}

/**
 * The URLs an engine cited. OpenAI and Anthropic hand real URLs in `sources`; Google's
 * `sources[].url` are grounding redirects and its `title` is the host, so the host stands
 * in as `https://<host>/`; a compatible endpoint (Perplexity) keeps them in the raw body;
 * the plain mode has only what the text says.
 */
export function citedUrls(args: {
  kind: ConnectionKind;
  text: string;
  sources: AnswerSource[];
  raw: unknown;
}): string[] {
  const { kind, text, sources, raw } = args;
  const found: string[] = [];
  if (kind === 'google') {
    for (const s of sources) {
      const host = typeof s.title === 'string' ? s.title.trim().replace(/^www\./, '') : '';
      if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(host)) found.push(`https://${host.toLowerCase()}/`);
      else if (typeof s.url === 'string' && !/vertexaisearch|grounding/.test(s.url))
        found.push(s.url);
    }
  } else {
    for (const s of sources) if (typeof s.url === 'string') found.push(s.url);
  }
  found.push(...rawUrls(raw));
  if (found.length === 0) found.push(...(text.match(URL_IN_TEXT) ?? []));
  return [...new Set(found.map((u) => u.replace(/[.,;:!?)،؛؟]+$/, '')))].filter(
    (u) => hostOf(u) !== null,
  );
}

export function readAnswer(args: {
  kind: ConnectionKind;
  text: string;
  sources: AnswerSource[];
  raw: unknown;
}): AnswerReading {
  const urls = citedUrls(args);
  const hosts = urls.map(hostOf);
  const named = new Set<string>();
  for (const host of hosts) {
    const c = competitorOf(host);
    if (c) named.add(c);
  }
  const folded = fold(args.text);
  for (const [pattern, host] of COMPETITOR_NAMES) if (pattern.test(folded)) named.add(host);
  return {
    mentioned: mentionsBrand(args.text),
    linked: hosts.some(isOurHost),
    urls,
    competitors: [...named],
    excerpt: args.text.replace(/\s+/g, ' ').trim().slice(0, EXCERPT_LENGTH),
  };
}
