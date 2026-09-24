import { notFound } from 'next/navigation';
import { copyFor } from '@/content/copy';
import type { Block, Page } from '@/content/schema';
import { getPage } from '@/lib/cms';
import { siteBase } from '@/lib/env';
import { type Locale, localePath } from '@/lib/i18n';
import { JsonLd, jsonLd } from '@/modules/core';
import { CtaRibbon } from '@/modules/core/cta-ribbon';
import { rendererFor } from '@/modules/pages/blocks';
import { faqItemsFor } from '@/modules/pages/blocks/faq-list';
import { blockTones } from '@/modules/pages/tones';
import {
  blockAnchors,
  type BlockComponent,
  type ExtraRenderers,
} from '@/modules/pages/blocks/types';

interface CmsPageProps {
  slug: string;
  locale: Locale;
  /** Renderers for blocks whose section lives in another feature module (contact). */
  renderers?: ExtraRenderers;
}

const NO_EXTRA: ExtraRenderers = {};

/** The one page whose questions are emitted as `FAQPage` (ADR-050): the FAQ page, not the how-it-works slice of the same entries. */
export const FAQ_SCHEMA_SLUG = 'faq';

/** The FAQ page's entries for its schema; empty elsewhere and on a page without the block. */
export async function faqSchemaItems(
  page: Pick<Page, 'slug' | 'blocks'>,
  locale: Locale,
): Promise<Array<{ question: string; answer: string }>> {
  if (page.slug !== FAQ_SCHEMA_SLUG) return [];
  const block = page.blocks.find((b) => b.blockType === 'faqList');
  return block ? faqItemsFor(block, locale) : [];
}

/**
 * A page from the `pages` collection (BRD 9.4, 9.5; ADR-031): JSON-LD, the blocks in order,
 * the first one carries the page title as its H1, and the CTA ribbon. `notFound()` when the
 * slug is not published (the proxy already answers unknown top-level URLs, B0).
 */
export async function CmsPage({ slug, locale, renderers = NO_EXTRA }: CmsPageProps) {
  const page = await getPage(locale, slug);
  if (!page) notFound();
  return <CmsPageBody page={page} locale={locale} renderers={renderers} />;
}

export async function CmsPageBody({
  page,
  locale,
  renderers = NO_EXTRA,
}: {
  page: Page;
  locale: Locale;
  renderers?: ExtraRenderers;
}) {
  const base = siteBase();
  const route = `/${page.slug}`;
  const productsPage = copyFor(locale).productsPage;
  const tones = blockTones(page.blocks);
  const anchors = blockAnchors(page.blocks);
  const legal = page.blocks.find((b) => b.blockType === 'legalBody');
  const faq = jsonLd.faqPage(base, locale, route, await faqSchemaItems(page, locale));
  return (
    <>
      <JsonLd
        nodes={[
          jsonLd.webPage(
            base,
            locale,
            route,
            page.seo.title,
            page.seo.description,
            legal ? legal.updatedAt : undefined,
          ),
          jsonLd.breadcrumbs(base, [
            { name: productsPage.breadcrumbHome, path: localePath(locale, '/') },
            { name: page.title, path: localePath(locale, route) },
          ]),
          ...(faq ? [faq] : []),
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
            locale={locale}
            tone={tones[i] ?? 'surface'}
            anchor={anchors[i] ?? block.blockType}
            heading={i === 0 ? { title: page.title, lead: page.lead } : undefined}
          />
        );
      })}
      <CtaRibbon locale={locale} page={page.slug} />
    </>
  );
}
