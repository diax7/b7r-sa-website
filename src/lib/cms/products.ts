import 'server-only';
import { unstable_cache } from 'next/cache';
import type { Product } from '@/content/schema';
import { toProduct } from '@/lib/cms/mappers';
import { cms, PUBLIC_READ } from '@/lib/cms/payload';
import { sortProducts } from '@/lib/product-helpers';
import { CACHE_TAGS } from '@/modules/cms/hooks/revalidate';

async function readProducts(): Promise<Product[]> {
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
}

/** Published products in catalogue order; cached until `revalidateTag('products')`. */
export const getProducts = unstable_cache(readProducts, ['cms', 'products', PUBLIC_READ.locale], {
  tags: [CACHE_TAGS.products],
});

export async function getProduct(slug: string): Promise<Product | undefined> {
  return (await getProducts()).find((p) => p.slug === slug);
}
