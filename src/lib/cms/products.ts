import 'server-only';
import { cache } from 'react';
import type { Product } from '@/content/schema';
import { toProduct } from '@/lib/cms/mappers';
import { cms, PUBLIC_READ } from '@/lib/cms/payload';
import { sortProducts } from '@/lib/product-helpers';

/** Published products in catalogue order; one read per render (ADR-030). */
export const getProducts = cache(async (): Promise<Product[]> => {
  const payload = await cms();
  const { docs } = await payload.find({
    collection: 'products',
    ...PUBLIC_READ,
    depth: 1,
    limit: 100,
    pagination: false,
    sort: 'sortOrder',
  });
  return sortProducts(docs.map(toProduct));
});

export async function getProduct(slug: string): Promise<Product | undefined> {
  return (await getProducts()).find((p) => p.slug === slug);
}
