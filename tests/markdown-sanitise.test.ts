import { describe, expect, it } from 'vitest';
import { renderMarkdown, safeHref } from '@/lib/markdown';

/** An admin's Markdown is text, not markup (ADR-031): what the renderer refuses. */
describe('renderMarkdown allowlist', () => {
  it('drops raw HTML blocks and inline tags', () => {
    const { html } = renderMarkdown(
      '# T\n\n<script>alert(1)</script>\n\nنص <b onclick="x()">عريض</b> عادي\n\n<iframe src="https://evil"></iframe>',
    );
    expect(html).not.toContain('<script');
    expect(html).not.toContain('<iframe');
    expect(html).not.toContain('onclick');
    expect(html).toContain('عادي');
  });

  it('keeps https, mailto and site links; strips javascript:, data: and protocol-relative ones', () => {
    const { html } = renderMarkdown(
      '[ok](https://b7r.sa/about) [mail](mailto:contact@b7r.sa) [site](/faq) [js](javascript:alert(1)) [data](data:text/html,x) [rel](//evil.com)',
    );
    expect(html).toContain('href="https://b7r.sa/about"');
    expect(html).toContain('href="mailto:contact@b7r.sa"');
    expect(html).toContain('href="/faq"');
    expect(html).not.toContain('javascript:');
    expect(html).not.toContain('data:');
    expect(html).not.toContain('//evil.com');
    // The link text survives without the link.
    expect(html).toContain('js');
  });

  it('opens off-site links in a new tab with rel=noopener, never the site itself', () => {
    const { html } = renderMarkdown('[x](https://example.com) [own](https://b7r.sa/x)');
    expect(html).toContain('href="https://example.com" target="_blank" rel="noopener"');
    expect(html).toContain('<a href="https://b7r.sa/x">');
  });

  it('escapes quotes in attributes and numbers the H2s for the on-this-page list', () => {
    const { html, headings } = renderMarkdown('## أ\n\n[t](https://e.com/a"b)\n\n## ب');
    expect(html).not.toContain('href="https://e.com/a"b"');
    expect(headings.map((h) => h.id)).toEqual(['section-1', 'section-2']);
  });

  it('safeHref', () => {
    expect(safeHref(' /contact ')).toBe('/contact');
    expect(safeHref('#section-1')).toBe('#section-1');
    expect(safeHref('JAVASCRIPT:void(0)')).toBeNull();
    expect(safeHref('https://x.y/"><script>')).toBeNull();
  });
});
