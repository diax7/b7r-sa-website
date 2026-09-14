import {
  EXTERNAL_LINK_ALLOWLIST,
  OFFICIAL_LINK_SUFFIXES,
} from '@/modules/ai-content/prompts/defaults';

/**
 * Links in a draft (BRD 10.2.5): an internal link must point at a path the brief allowed,
 * an external one at b7r.app, b7r.sa or a Saudi government host; anything else keeps its
 * text and loses its link. Pure over Markdown.
 */
const MARKDOWN_LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g;

export function allowedExternal(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    return (
      EXTERNAL_LINK_ALLOWLIST.some((h) => host === h || host.endsWith(`.${h}`)) ||
      OFFICIAL_LINK_SUFFIXES.some((s) => host.endsWith(s))
    );
  } catch {
    return false;
  }
}

export interface LinkAudit {
  markdown: string;
  internal: number;
  dropped: string[];
}

export function sanitizeLinks(markdown: string, allowedPaths: readonly string[]): LinkAudit {
  const allowed = new Set(allowedPaths.map((p) => p.replace(/\/$/, '') || '/'));
  const dropped: string[] = [];
  let internal = 0;
  const out = markdown.replaceAll(MARKDOWN_LINK, (whole, text: string, url: string) => {
    const target = url.trim();
    if (target.startsWith('/') && !target.startsWith('//')) {
      const path = target.split(/[?#]/)[0]!.replace(/\/$/, '') || '/';
      if (allowed.has(path)) {
        internal += 1;
        return whole;
      }
      dropped.push(target);
      return text;
    }
    if (target.startsWith('https://') && allowedExternal(target)) return whole;
    dropped.push(target);
    return text;
  });
  return { markdown: out, internal, dropped };
}
