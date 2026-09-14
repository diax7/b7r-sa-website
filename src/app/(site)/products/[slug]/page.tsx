import type { Metadata } from 'next';
import { productParams, productRouteMetadata, renderProduct } from '@/modules/products';

interface Params {
  params: Promise<{ slug: string }>;
}

/**
 * A product published in the admin after the build gets its page on first request (ISR),
 * so unknown slugs must reach the page and `notFound()`; the 404 is cached like any page
 * (ADR-030).
 */
export const dynamicParams = true;

export const generateStaticParams = () => productParams('ar');

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  return productRouteMetadata('ar', (await params).slug);
}

export default async function ProductRoute({ params }: Params) {
  return renderProduct('ar', (await params).slug);
}
