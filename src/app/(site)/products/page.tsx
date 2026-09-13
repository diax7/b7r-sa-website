import type { Metadata } from 'next';
import { buildMetadata } from '@/modules/core';
import { ProductsListing } from '@/modules/products';

export const metadata: Metadata = buildMetadata('/products');

export default function ProductsRoute() {
  return <ProductsListing />;
}
