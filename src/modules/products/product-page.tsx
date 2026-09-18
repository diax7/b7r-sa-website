import Link from 'next/link';
import { Breadcrumbs } from '@/components/shared/breadcrumbs';
import { Button } from '@/components/shared/button';
import { Container } from '@/components/shared/container';
import { SarAmount } from '@/components/shared/sar-amount';
import { Section, type SectionTone } from '@/components/shared/section';
import { SectionHeader } from '@/components/shared/section-header';
import { copyFor } from '@/content/copy';
import type { Product } from '@/content/schema';
import { getProducts, getSiteSettings } from '@/lib/cms';
import { cn } from '@/lib/cn';
import { env, siteBase } from '@/lib/env';
import { type Locale, localePath } from '@/lib/i18n';
import { registerUrl } from '@/lib/utm';
import { JsonLd, jsonLd } from '@/modules/core';
import { CtaRibbon } from '@/modules/core/cta-ribbon';
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
export async function ProductPage({ product, locale }: { product: Product; locale: Locale }) {
  const [products, site] = await Promise.all([getProducts(locale), getSiteSettings(locale)]);
  const messages = copyFor(locale);
  const copy = messages.productsPage;
  const base = siteBase();
  const registerHref = registerUrl(env.appUrl, { campaign: 'product', content: product.slug });
  const profit = product.suggestedPrice - product.baseCost;
  const hasSizeChart = product.sizes.some((s) => s.measurements);
  // surface (intro) → ground (description + sizes) → surface (related) → ribbon
  const relatedTone: SectionTone = 'surface';
  const crumbs = [
    { name: copy.breadcrumbHome, href: localePath(locale, '/') },
    { name: copy.title, href: localePath(locale, '/products') },
    { name: product.name, href: localePath(locale, `/products/${product.slug}`) },
  ];

  return (
    <>
      <JsonLd
        nodes={[
          jsonLd.product(base, locale, product, site),
          jsonLd.breadcrumbs(
            base,
            crumbs.map((c) => ({ name: c.name, path: c.href })),
          ),
        ]}
      />
      <ProductViewTracker slug={product.slug} />

      <Section tone="surface" className="pt-6 md:pt-10" aria-labelledby="product-title">
        <Container className="flex flex-col gap-8">
          <Breadcrumbs items={crumbs} label={messages.breadcrumbs.label} />
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            {/* Gallery first on phones, end column on desktop (BRD 6.6). */}
            <div className="lg:order-last">
              <Gallery
                productName={product.name}
                colors={product.colors}
                copy={{
                  label: messages.gallery.label,
                  flip: messages.gallery.flip,
                  front: messages.gallery.front,
                  back: messages.gallery.back,
                  colorLabel: copy.specLabels.colors,
                  colorOptionAria: copy.colorSwitchAria.replace('{colour}', '{color}'),
                  separator: copy.listSeparator,
                }}
              />
            </div>
            <div className="flex flex-col gap-6">
              <h1 id="product-title" className="text-h1 text-text">
                {product.name}
              </h1>
              <p className="text-body measure text-text-muted">{product.description}</p>
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
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  asChild
                  size="lg"
                  id={PRIMARY_CTA_ID}
                  variant={site.ctaShiny ? 'shiny' : 'primary'}
                >
                  <a href={registerHref} data-track="cta_click" data-location="product">
                    {copy.primaryCta}
                  </a>
                </Button>
                <Button asChild variant="link" size="lg">
                  <Link href={`${localePath(locale, '/')}#designer?product=${product.slug}`}>
                    {copy.secondaryLink}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* Specs beside the size chart (Dhia, 2026-09-13): the description sits under the name. */}
      <Section
        tone="ground"
        className="py-12 md:py-16"
        aria-labelledby="product-specs-title"
        data-product-details=""
      >
        <Container
          className={cn(
            'grid gap-10',
            hasSizeChart
              ? 'md:grid-cols-[3fr_2fr] md:gap-12 lg:gap-16'
              : 'lg:grid-cols-2 lg:gap-16',
          )}
        >
          <div className="flex flex-col gap-4">
            <h2 id="product-specs-title" className="text-h3 text-text">
              {copy.sections.specs}
            </h2>
            <SpecList product={product} copy={copy} />
          </div>
          {hasSizeChart && (
            // min-w-0: the chart's 420 px table must scroll inside its card, never widen the
            // grid column (and the layout viewport) on a phone.
            <div className="flex min-w-0 flex-col gap-4">
              <h2 id="product-sizes-title" className="text-h3 text-text">
                {copy.sections.sizeChart}
              </h2>
              <SizeChart
                product={product}
                caption={`${copy.sections.sizeChart}: ${product.name}`}
                copy={copy}
              />
            </div>
          )}
        </Container>
      </Section>

      <Section tone={relatedTone} aria-labelledby="product-related-title">
        <Container className="flex flex-col gap-10">
          <SectionHeader id="product-related-title" title={copy.sections.related} />
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" data-reveal-stagger="">
            {relatedProducts(product, products).map((other) => (
              <li key={other.slug}>
                <ProductCard product={other} locale={locale} />
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <CtaRibbon locale={locale} topTone={relatedTone} page={`product-${product.slug}`} />
      <ProductStickyBar
        shiny={site.ctaShiny}
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
