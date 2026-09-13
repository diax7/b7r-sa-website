import type { MetadataRoute } from 'next';
import { siteBase } from '@/lib/env';
import { sitemapEntries } from '@/modules/core/seo/sitemap';

export default function sitemap(): MetadataRoute.Sitemap {
  return sitemapEntries(siteBase());
}
