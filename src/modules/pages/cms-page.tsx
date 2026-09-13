import { notFound } from 'next/navigation';
import { productsPage } from '@/content/pages';
import type { Block, Page } from '@/content/schema';
import { getPage } from '@/lib/cms';
import { siteBase } from '@/lib/env';
import { JsonLd, jsonLd } from '@/modules/core';
import { CtaRibbon } from '@/modules/core/cta-ribbon';
import { rendererFor } from '@/modules/pages/blocks';
import {
  blockAnchors,
  type BlockComponent,
  type BlockTone,
  type ExtraRenderers,
} from '@/modules/pages/blocks/types';

interface CmsPageProps {
  slug: string;
  /** Renderers for blocks whose section lives in another feature module (contact). */
  renderers?: ExtraRenderers;
}

const NO_EXTRA: ExtraRenderers = {};

/** Tones alternate over the blocks (BRD 3.4), the first section on surface. */
export function blockTones(count: number): BlockTone[] {
  return Array.from({ length: count }, (_, i) => (i % 2 === 0 ? 'surface' : 'ground'));
}

/**
 * A page from the `pages` collection (BRD 9.4, 9.5; ADR-031): JSON-LD, the blocks in order,
 * the first one carries the page title as its H1, and the CTA ribbon. `notFound()` when the
 * slug is not published (the proxy already answers unknown top-level URLs, B0).
 */
export async function CmsPage({ slug, renderers = NO_EXTRA }: CmsPageProps) {
  const page = await getPage(slug);
  if (!page) notFound();
  return <CmsPageBody page={page} renderers={renderers} />;
}

export function CmsPageBody({
  page,
  renderers = NO_EXTRA,
}: {
  page: Page;
  renderers?: ExtraRenderers;
}) {
  const base = siteBase();
  const route = `/${page.slug}`;
  const tones = blockTones(page.blocks.length);
  const anchors = blockAnchors(page.blocks);
  const legal = page.blocks.find((b) => b.blockType === 'legalBody');
  return (
    <>
      <JsonLd
        nodes={[
          jsonLd.webPage(
            base,
            route,
            page.seo.title,
            page.seo.description,
            legal ? legal.updatedAt : undefined,
          ),
          jsonLd.breadcrumbs(base, [
            { name: productsPage.breadcrumbHome, path: '/' },
            { name: page.title, path: route },
          ]),
        ]}
      />
      {page.blocks.map((block, i) => {
        // Widened to the union: the registry guarantees the renderer matches the block type.
        const Renderer = rendererFor(block.blockType, renderers) as BlockComponent<
          Block['blockType']
        >;
        return (
          <Renderer
            key={block.id}
            block={block}
            page={page}
            tone={tones[i] ?? 'surface'}
            anchor={anchors[i] ?? block.blockType}
            heading={i === 0 ? { title: page.title, lead: page.lead } : undefined}
          />
        );
      })}
      <CtaRibbon topTone={tones[page.blocks.length - 1] ?? 'surface'} page={page.slug} />
    </>
  );
}
