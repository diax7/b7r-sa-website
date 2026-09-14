import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProduct, getProducts } from '@/lib/cms';
import type { Locale } from '@/lib/i18n';
import { buildMetadata, productMetadata } from '@/modules/core/seo/metadata';
import { ProductPage } from '@/modules/products/product-page';
import { ProductsListing } from '@/modules/products/products-listing';

/**
 * The products routes per locale (ADR-043): the Arabic and English route files are thin
 * wrappers over these, so the behaviour (ISR for a product added after the build, `notFound`
 * for an unknown slug, ADR-030) is written once.
 */
export function productsListingMetadata(locale: Locale): Promise<Metadata> {
  return buildMetadata(locale, '/products');
}

export function renderProductsListing(locale: Locale) {
  return <ProductsListing locale={locale} />;
}

export async function productParams(locale: Locale): Promise<Array<{ slug: string }>> {
  return (await getProducts(locale)).map((p) => ({ slug: p.slug }));
}

export async function productRouteMetadata(locale: Locale, slug: string): Promise<Metadata> {
  const product = await getProduct(locale, slug);
  if (!product) notFound();
  return productMetadata(locale, product);
}

export async function renderProduct(locale: Locale, slug: string) {
  const product = await getProduct(locale, slug);
  if (!product) notFound();
  return <ProductPage product={product} locale={locale} />;
}
