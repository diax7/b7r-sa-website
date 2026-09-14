import { Container } from '@/components/shared/container';
import { Section } from '@/components/shared/section';
import { SectionHeader } from '@/components/shared/section-header';
import { copyFor } from '@/content/copy';
import { getProducts } from '@/lib/cms';
import { siteBase } from '@/lib/env';
import { type Locale, localePath } from '@/lib/i18n';
import { JsonLd, jsonLd } from '@/modules/core';
import { CtaRibbon } from '@/modules/core/cta-ribbon';
import { ProductCard } from '@/modules/products/product-card';

/** Products listing (BRD 6.5): H1 + lead, the five cards, the ribbon. */
export async function ProductsListing({ locale }: { locale: Locale }) {
  const ordered = await getProducts(locale);
  const productsPage = copyFor(locale).productsPage;
  const base = siteBase();
  return (
    <>
      <JsonLd
        nodes={[
          jsonLd.itemList(
            base,
            ordered.map((p) => localePath(locale, `/products/${p.slug}`)),
          ),
          jsonLd.breadcrumbs(base, [
            { name: productsPage.breadcrumbHome, path: localePath(locale, '/') },
            { name: productsPage.title, path: localePath(locale, '/products') },
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
                <ProductCard product={product} locale={locale} priority={i < 3} headingLevel="h2" />
              </li>
            ))}
          </ul>
        </Container>
      </Section>
      <CtaRibbon locale={locale} topTone="surface" page="products" />
    </>
  );
}
