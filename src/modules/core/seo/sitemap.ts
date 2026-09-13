import type { MetadataRoute } from 'next';
import { blogPosts } from '@/content/blog';
import { getLegalPages } from '@/content/legal';
import { products } from '@/content/products';
import { seo } from '@/content/seo';

const LEGAL_ROUTES = new Set(['/terms', '/shipping', '/privacy']);

/** `YYYY-MM-DD` → the UTC midnight instant, so the XML carries a full ISO 8601 timestamp. */
export function contentDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00Z`);
}

/**
 * Every indexable route (BRD 7.5): the static pages from `content/seo.ts`, the five products
 * with their photos, the published posts. Legal pages take their date from the legal file so
 * the visible «آخر تحديث», the JSON-LD and the sitemap agree. No 404, no API, no queries.
 */
export function sitemapEntries(base: string): MetadataRoute.Sitemap {
  const legalDates = new Map(getLegalPages().map((p) => [`/${p.slug}`, p.updatedAt]));
  const pages = seo.map((page) => ({
    url: `${base}${page.route === '/' ? '' : page.route}`,
    lastModified: contentDate(
      LEGAL_ROUTES.has(page.route)
        ? (legalDates.get(page.route) ?? page.updatedAt)
        : page.updatedAt,
    ),
  }));
  const productEntries = products
    .toSorted((a, b) => a.sortOrder - b.sortOrder)
    .map((product) => ({
      url: `${base}/products/${product.slug}`,
      lastModified: contentDate(product.updatedAt),
      images: product.colors
        .flatMap((c) => [c.images.front, c.images.back].filter((p): p is string => Boolean(p)))
        .map((path) => `${base}${path}`),
    }));
  const postEntries = blogPosts.map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: contentDate(post.updatedAt),
  }));
  return [...pages, ...productEntries, ...postEntries];
}
