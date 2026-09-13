import Link from 'next/link';
import { Breadcrumbs } from '@/components/shared/breadcrumbs';
import { Button } from '@/components/shared/button';
import { Container } from '@/components/shared/container';
import { SarAmount } from '@/components/shared/sar-amount';
import { Section, type SectionTone } from '@/components/shared/section';
import { SectionHeader } from '@/components/shared/section-header';
import { productsPage } from '@/content/pages';
import type { Product } from '@/content/schema';
import { getProducts, getSiteSettings } from '@/lib/cms';
import { env, siteBase } from '@/lib/env';
import { registerUrl } from '@/lib/utm';
import messages from '@/messages/ar.json';
import { CtaRibbon, JsonLd, jsonLd } from '@/modules/core';
import { Gallery } from '@/modules/products/gallery';
import { ProductCard } from '@/modules/products/product-card';
import { SizeChart, SpecList } from '@/modules/products/product-details';
import { ProductStickyBar } from '@/modules/products/product-sticky-bar';
import { ProductViewTracker } from '@/modules/products/product-view-tracker';

const PRIMARY_CTA_ID = 'product-primary-cta';

/** Three other products, in catalogue order, wrapping around (BRD 5.3, 6.6). */
export function relatedProducts(current: Product, products: Product[]): Product[] {
  const ordered = products.toSorted((a, b) => a.sortOrder - b.sortOrder);
  const start = ordered.findIndex((p) => p.slug === current.slug);
  const others: Product[] = [];
  for (let i = 1; others.length < 3 && i < ordered.length; i++) {
    const candidate = ordered[(start + i) % ordered.length];
    if (candidate && candidate.slug !== current.slug) others.push(candidate);
  }
  return others;
}

/** Product detail (BRD 6.6). */
export async function ProductPage({ product }: { product: Product }) {
  const [products, site] = await Promise.all([getProducts(), getSiteSettings()]);
  const copy = productsPage;
  const base = siteBase();
  const registerHref = registerUrl(env.appUrl, { campaign: 'product', content: product.slug });
  const profit = product.suggestedPrice - product.baseCost;
  const hasSizeChart = product.sizes.some((s) => s.measurements);
  // surface (intro) → ground (description) → [surface (sizes)] → related → ribbon
  const relatedTone: SectionTone = hasSizeChart ? 'ground' : 'surface';
  const crumbs = [
    { name: copy.breadcrumbHome, href: '/' },
    { name: copy.title, href: '/products' },
    { name: product.name, href: `/products/${product.slug}` },
  ];

  return (
    <>
      <JsonLd
        nodes={[
          jsonLd.product(base, product, site),
          jsonLd.breadcrumbs(
            base,
            crumbs.map((c) => ({ name: c.name, path: c.href })),
          ),
        ]}
      />
      <ProductViewTracker slug={product.slug} />

      <Section tone="surface" className="pt-6 md:pt-10" aria-labelledby="product-title">
        <Container className="flex flex-col gap-8">
          <Breadcrumbs items={crumbs} />
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            {/* Gallery first on phones, end column on desktop (BRD 6.6). */}
            <div className="lg:order-last">
              <Gallery
                productName={product.name}
                colors={product.colors}
                copy={{
                  label: messages.gallery.label,
                  thumbnails: messages.gallery.thumbnails,
                  previous: messages.gallery.previous,
                  next: messages.gallery.next,
                  front: messages.gallery.front,
                  back: messages.gallery.back,
                  colorLabel: copy.specLabels.colors,
                  colorOptionAria: copy.colorSwitchAria.replace('{colour}', '{color}'),
                  counter: copy.galleryAria,
                }}
              />
            </div>
            <div className="flex flex-col gap-6">
              <h1 id="product-title" className="text-h1 text-text">
                {product.name}
              </h1>
              <p className="lead text-text-muted">{product.shortDescription}</p>
              <dl className="grid gap-3 rounded-base border border-border bg-ground p-5">
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-body text-text-muted">{copy.priceBlock.cost}</dt>
                  <dd>
                    <SarAmount value={product.baseCost} className="text-h3 text-text" />
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-body text-text-muted">{copy.priceBlock.suggested}</dt>
                  <dd>
                    <SarAmount value={product.suggestedPrice} className="text-h4 text-text" />
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 border-t border-border pt-3">
                  <dt className="text-body font-medium text-text">{copy.priceBlock.profit}</dt>
                  <dd className="text-success">
                    <SarAmount value={profit} className="text-h4" data-profit="" />{' '}
                    <span className="text-small">{copy.priceBlock.perPiece}</span>
                  </dd>
                </div>
              </dl>
              <p className="text-small text-text-muted">{copy.priceFootnote}</p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button asChild size="lg" id={PRIMARY_CTA_ID}>
                  <a href={registerHref} data-track="cta_click" data-location="product">
                    {copy.primaryCta}
                  </a>
                </Button>
                <Button asChild variant="link" size="lg">
                  <Link href={`/#designer?product=${product.slug}`}>{copy.secondaryLink}</Link>
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="ground" aria-labelledby="product-description-title">
        <Container className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col gap-6">
            <h2 id="product-description-title" className="text-h2 text-text">
              {copy.sections.description}
            </h2>
            <p className="lead measure text-text">{product.description}</p>
          </div>
          <div className="flex flex-col gap-6">
            <h2 className="text-h2 text-text">{copy.sections.specs}</h2>
            <SpecList product={product} />
          </div>
        </Container>
      </Section>

      {hasSizeChart && (
        <Section tone="surface" aria-labelledby="product-sizes-title">
          <Container className="flex flex-col gap-8">
            <SectionHeader id="product-sizes-title" title={copy.sections.sizeChart} />
            <SizeChart product={product} caption={`${copy.sections.sizeChart} — ${product.name}`} />
          </Container>
        </Section>
      )}

      <Section tone={relatedTone} aria-labelledby="product-related-title">
        <Container className="flex flex-col gap-10">
          <SectionHeader id="product-related-title" title={copy.sections.related} />
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedProducts(product, products).map((other) => (
              <li key={other.slug}>
                <ProductCard product={other} />
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <CtaRibbon topTone={relatedTone} page={`product-${product.slug}`} />
      <ProductStickyBar
        slug={product.slug}
        pricePrefix={copy.pricePrefix}
        baseCost={product.baseCost}
        cta={copy.primaryCta}
        href={registerHref}
        watch={`#${PRIMARY_CTA_ID}`}
      />
    </>
  );
}
