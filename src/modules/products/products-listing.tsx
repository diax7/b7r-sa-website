import { Container } from '@/components/shared/container';
import { Section } from '@/components/shared/section';
import { SectionHeader } from '@/components/shared/section-header';
import { productsPage } from '@/content/pages';
import { products } from '@/content/products';
import { siteBase } from '@/lib/env';
import { CtaRibbon, JsonLd, jsonLd } from '@/modules/core';
import { ProductCard } from '@/modules/products/product-card';

/** Products listing (BRD 6.5): H1 + lead, the five cards, the ribbon. */
export function ProductsListing() {
  const ordered = products.toSorted((a, b) => a.sortOrder - b.sortOrder);
  const base = siteBase();
  return (
    <>
      <JsonLd
        nodes={[
          jsonLd.itemList(
            base,
            ordered.map((p) => `/products/${p.slug}`),
          ),
          jsonLd.breadcrumbs(base, [
            { name: productsPage.breadcrumbHome, path: '/' },
            { name: productsPage.title, path: '/products' },
          ]),
        ]}
      />
      <Section tone="surface" className="pt-10 md:pt-16" aria-labelledby="products-title">
        <Container className="flex flex-col gap-10">
          <SectionHeader
            as="h1"
            id="products-title"
            title={productsPage.title}
            lead={productsPage.lead}
          />
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" data-product-grid="">
            {ordered.map((product, i) => (
              <li key={product.slug}>
                <ProductCard product={product} priority={i < 3} headingLevel="h2" />
              </li>
            ))}
          </ul>
        </Container>
      </Section>
      <CtaRibbon topTone="surface" page="products" />
    </>
  );
}
