import type { Metadata } from 'next';
import { buildMetadata } from '@/modules/core/seo/metadata';
import { ProductsListing } from '@/modules/products';

export const generateMetadata = (): Promise<Metadata> => buildMetadata('/products');

export default function ProductsRoute() {
  return <ProductsListing />;
}
