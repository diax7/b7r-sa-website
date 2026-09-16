import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BlockSchema, type BlockOf } from '@/content/schema';
import { comparePrintful } from '@/content/seed/pages';
import { pagesEn } from '@/content/seed/en/pages';
import { toPage } from '@/lib/cms/mappers';
import { CompareBlock } from '@/modules/pages/blocks/compare';
import type { Page as PageDoc } from '@/payload-types';

const block = comparePrintful.blocks[0] as BlockOf<'compare'>;

/** The seeded comparison as Payload stores it (rows with ids, lists as `{ text }`, the date as ISO). */
function pageDoc(over: Partial<PageDoc> = {}): PageDoc {
  return {
    id: 8,
    slug: 'compare-printful',
    title: comparePrintful.title,
    lead: comparePrintful.lead,
    blocks: [
      {
        id: 'b1',
        blockType: 'compare',
        intro: block.intro,
        ours: block.ours,
        theirs: block.theirs,
        asOf: '2026-09-16T00:00:00.000Z',
        rows: block.rows.map((r, i) => ({ id: `r${i}`, ...r })),
        bestFor: block.bestFor.map((text, i) => ({ id: `b${i}`, text })),
        notBestFor: block.notBestFor.map((text, i) => ({ id: `n${i}`, text })),
        closing: block.closing,
      },
    ],
    seo: { title: comparePrintful.seo.title, description: comparePrintful.seo.description },
    updatedAt: '2026-09-16T00:00:00.000Z',
    createdAt: '2026-09-16T00:00:00.000Z',
    _status: 'draft',
    ...over,
  } as PageDoc;
}

describe('the compare block (ADR-050)', () => {
  it('needs three rows, a list on each side, a read date, and carries no URL', () => {
    expect(BlockSchema.safeParse(block).success).toBe(true);
    expect(BlockSchema.safeParse({ ...block, rows: block.rows.slice(0, 2) }).success).toBe(false);
    expect(BlockSchema.safeParse({ ...block, notBestFor: [] }).success).toBe(false);
    expect(BlockSchema.safeParse({ ...block, asOf: '16/09/2026' }).success).toBe(false);
    expect(JSON.stringify(block)).not.toMatch(/https?:\/\//);
    // The English seed answers every row and list item by position.
    const english = pagesEn['compare-printful']!.blocks[0] as {
      rows: unknown[];
      bestFor: unknown[];
      notBestFor: unknown[];
    };
    expect(english.rows).toHaveLength(block.rows.length);
    expect(english.bestFor).toHaveLength(block.bestFor.length);
    expect(english.notBestFor).toHaveLength(block.notBestFor.length);
  });

  it('maps the Payload rows back onto the contract, a draft only through the preview', () => {
    expect(() => toPage(pageDoc())).toThrow(/not published/);
    const page = toPage(pageDoc(), { draft: true });
    const mapped = page.blocks[0] as BlockOf<'compare'>;
    expect(mapped.asOf).toBe('2026-09-16');
    expect(mapped.rows).toEqual(block.rows);
    expect(mapped.bestFor).toEqual(block.bestFor);
    expect(mapped.notBestFor).toEqual(block.notBestFor);
    expect(mapped.closing).toBe(block.closing);
    expect(toPage(pageDoc({ _status: 'published' })).slug).toBe('compare-printful');
  });

  it('renders a captioned table with scoped headers, the two lists, the read date, in both directions', () => {
    for (const locale of ['ar', 'en'] as const) {
      const { container } = render(
        <CompareBlock
          block={block}
          page={comparePrintful}
          locale={locale}
          tone="surface"
          anchor="compare"
          heading={{ title: comparePrintful.title, lead: comparePrintful.lead }}
        />,
      );
      expect(container.querySelector('h1')?.textContent).toBe(comparePrintful.title);
      expect(container.querySelector('table caption')?.textContent).toContain('Printful');
      expect(container.querySelectorAll('thead th[scope="col"]')).toHaveLength(3);
      expect(container.querySelectorAll('tbody th[scope="row"]')).toHaveLength(8);
      expect(container.querySelectorAll('[data-compare-list="best"] li')).toHaveLength(3);
      expect(container.querySelectorAll('[data-compare-list="not"] li')).toHaveLength(2);
      expect(container.querySelector('time')?.getAttribute('dateTime')).toBe('2026-09-16');
      expect(container.querySelectorAll('a')).toHaveLength(0);
      expect(container.innerHTML).not.toMatch(/\b(ml|mr|pl|pr|left|right)-/);
    }
  });
});
