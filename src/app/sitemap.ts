import type { MetadataRoute } from 'next';
import { getProducts, getSeoDefaults } from '@/lib/cms';
import { siteBase } from '@/lib/env';
import { sitemapEntries } from '@/modules/core/seo/sitemap';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [seo, products] = await Promise.all([getSeoDefaults(), getProducts()]);
  return sitemapEntries(siteBase(), seo.routes, products);
}
