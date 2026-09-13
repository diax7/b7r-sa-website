import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProduct, getProducts } from '@/lib/cms';
import { productMetadata } from '@/modules/core/seo/metadata';
import { ProductPage } from '@/modules/products';

interface Params {
  params: Promise<{ slug: string }>;
}

/**
 * A product published in the admin after the build gets its page on first request (ISR),
 * so unknown slugs must reach the page and `notFound()`; the 404 is cached like any page.
 * (`await connection()` before `notFound()`, tried 2026-09-13 to keep junk slugs out of the
 * cache, throws DYNAMIC_SERVER_USAGE inside an ISR render and answers 500, not an option.)
 */
export const dynamicParams = true;

export async function generateStaticParams() {
  return (await getProducts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  return productMetadata(product);
}

export default async function ProductRoute({ params }: Params) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  return <ProductPage product={product} />;
}
