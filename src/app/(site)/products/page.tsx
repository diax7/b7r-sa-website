import type { Metadata } from 'next';
import { productsListingMetadata, renderProductsListing } from '@/modules/products';

export const generateMetadata = (): Promise<Metadata> => productsListingMetadata('ar');

export default function ProductsRoute() {
  return renderProductsListing('ar');
}
