import 'server-only';
import { cache } from 'react';
import type { Product } from '@/content/schema';
import { toProduct } from '@/lib/cms/mappers';
import { cms, publicRead } from '@/lib/cms/payload';
import { versionedRead } from '@/lib/cms/read-mode';
import type { Locale } from '@/lib/i18n';
import { sortProducts } from '@/lib/product-helpers';

/**
 * Published products in catalogue order (drafts in a preview request), in the locale and
 * only those that exist in it; one read per render and locale.
 */
export const getProducts = cache(async (locale: Locale): Promise<Product[]> => {
  const payload = await cms();
  const { docs } = await payload.find({
    collection: 'products',
    ...publicRead(locale),
    ...(await versionedRead('name')),
    depth: 1,
    limit: 100,
    pagination: false,
    sort: 'sortOrder',
  });
  return sortProducts(docs.map(toProduct));
});

export async function getProduct(locale: Locale, slug: string): Promise<Product | undefined> {
  return (await getProducts(locale)).find((p) => p.slug === slug);
}
