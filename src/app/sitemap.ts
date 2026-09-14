import type { MetadataRoute } from 'next';
import { getPages, getProducts, getSeoDefaults } from '@/lib/cms';
import { getAllAuthors, getAllPosts, getHubs } from '@/lib/cms/blog';
import { siteBase } from '@/lib/env';
import { sitemapEntries } from '@/modules/core/seo/sitemap';

/** Regenerated on publish (`revalidatePath('/sitemap.xml')`) and at most once a minute. */
export const revalidate = 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [seo, pages, products, posts, hubs, authors] = await Promise.all([
    getSeoDefaults(),
    getPages(),
    getProducts(),
    getAllPosts(),
    getHubs(),
    getAllAuthors(),
  ]);
  return sitemapEntries(siteBase(), seo.routes, pages, products, { posts, hubs, authors });
}
