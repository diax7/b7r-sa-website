import { Marked, type Tokens } from 'marked';

/**
 * Markdown for the legal pages and the blog bodies (BRD 6.11, 6.12), rendered on the server.
 * Since 2b the legal bodies come from the admin, so the renderer allowlists instead of
 * trusting: raw HTML is dropped, links keep only `https?:`, `mailto:` and site paths, and
 * off-site links open in a new tab with `rel="noopener"`. H2s get `section-{n}` ids (Arabic
 * slugs percent-encode into unreadable fragments) so the on-this-page list can link to them.
 */
export interface Heading {
  id: string;
  text: string;
  depth: number;
}

export interface Rendered {
  html: string;
  headings: Heading[];
}

/** A link target the site is willing to emit, or null (`javascript:`, `data:`, protocol-relative…). */
export function safeHref(raw: string): string | null {
  const href = raw.trim();
  if (href.startsWith('/') && !href.startsWith('//')) return href;
  if (href.startsWith('#')) return href;
  if (/^https?:\/\/[^\s"'<>]+$/i.test(href)) return href;
  if (/^mailto:[^\s"'<>]+$/i.test(href)) return href;
  return null;
}

const escape = (s: string) =>
  s
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');

function plain(tokens: Tokens.Generic[] | undefined): string {
  if (!tokens) return '';
  return tokens
    .map((t) => {
      if (typeof t['text'] === 'string' && !Array.isArray(t['tokens'])) return t['text'];
      return plain(t['tokens'] as Tokens.Generic[] | undefined);
    })
    .join('');
}

export function renderMarkdown(source: string, headingPrefix = 'section'): Rendered {
  const headings: Heading[] = [];
  const marked = new Marked({
    gfm: true,
    breaks: false,
    renderer: {
      heading({ tokens, depth }: Tokens.Heading) {
        const text = this.parser.parseInline(tokens);
        if (depth !== 2) return `<h${depth}>${text}</h${depth}>\n`;
        const id = `${headingPrefix}-${headings.length + 1}`;
        headings.push({ id, text: plain(tokens), depth });
        return `<h2 id="${id}">${text}</h2>\n`;
      },
      // Raw HTML never reaches the page: an admin's Markdown is text, not markup.
      html: () => '',
      link({ href, title, tokens }: Tokens.Link) {
        const text = this.parser.parseInline(tokens);
        const safe = safeHref(href);
        if (!safe) return text;
        const external = /^https?:\/\//.test(safe) && !safe.startsWith('https://b7r.sa');
        const attrs = [
          `href="${escape(safe)}"`,
          title ? `title="${escape(title)}"` : '',
          external ? 'target="_blank" rel="noopener"' : '',
        ]
          .filter(Boolean)
          .join(' ');
        return `<a ${attrs}>${text}</a>`;
      },
      image({ href, text }: Tokens.Image) {
        const safe = safeHref(href);
        return safe ? `<img src="${escape(safe)}" alt="${escape(text)}" loading="lazy">` : '';
      },
    },
  });
  const html = marked.parse(source, { async: false });
  return { html, headings };
}
