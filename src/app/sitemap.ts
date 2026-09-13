import type { MetadataRoute } from 'next';
import { getPages, getProducts, getSeoDefaults } from '@/lib/cms';
import { siteBase } from '@/lib/env';
import { sitemapEntries } from '@/modules/core/seo/sitemap';

/** Regenerated on publish (`revalidatePath('/sitemap.xml')`) and at most once a minute. */
export const revalidate = 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [seo, pages, products] = await Promise.all([getSeoDefaults(), getPages(), getProducts()]);
  return sitemapEntries(siteBase(), seo.routes, pages, products);
}
