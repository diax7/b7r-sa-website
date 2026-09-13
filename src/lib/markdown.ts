import { Marked, type Tokens } from 'marked';

/**
 * Markdown for the legal pages and the blog bodies (BRD 6.11, 6.12): rendered on the server
 * from trusted repo content. H2s get `section-{n}` ids (Arabic slugs percent-encode into
 * unreadable fragments) so the on-this-page list can link to them. Level 2 must sanitise CMS
 * Markdown before it reaches `dangerouslySetInnerHTML` (see docs/IDEAS.md).
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

function plain(tokens: Tokens.Generic[] | undefined): string {
  if (!tokens) return '';
  return tokens
    .map((t) => {
      if (typeof t['text'] === 'string' && !Array.isArray(t['tokens'])) return t['text'];
      return plain(t['tokens'] as Tokens.Generic[] | undefined);
    })
    .join('');
}

export function renderMarkdown(source: string): Rendered {
  const headings: Heading[] = [];
  const marked = new Marked({
    gfm: true,
    breaks: false,
    renderer: {
      heading({ tokens, depth }: Tokens.Heading) {
        const text = this.parser.parseInline(tokens);
        if (depth !== 2) return `<h${depth}>${text}</h${depth}>\n`;
        const id = `section-${headings.length + 1}`;
        headings.push({ id, text: plain(tokens), depth });
        return `<h2 id="${id}">${text}</h2>\n`;
      },
      // Off-site links open safely; internal ones stay ordinary.
      link({ href, title, tokens }: Tokens.Link) {
        const text = this.parser.parseInline(tokens);
        const external = /^https?:\/\//.test(href) && !href.startsWith('https://b7r.sa');
        const attrs = [
          `href="${href}"`,
          title ? `title="${title}"` : '',
          external ? 'target="_blank" rel="noopener"' : '',
        ]
          .filter(Boolean)
          .join(' ');
        return `<a ${attrs}>${text}</a>`;
      },
    },
  });
  const html = marked.parse(source, { async: false });
  return { html, headings };
}
