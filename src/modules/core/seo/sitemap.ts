import type { MetadataRoute } from 'next';
import type { Page, PageSeo, Product } from '@/content/schema';
import { absoluteUrl } from '@/lib/absolute-url';

/** The blog's sitemap input: what `lib/cms/blog.ts` reads. */
export interface BlogSitemap {
  posts: Array<{ slug: string; publishedAt: string; contentUpdatedAt: string | null }>;
  hubs: Array<{ slug: string }>;
  authors: Array<{ slug: string }>;
}

const EMPTY_BLOG: BlogSitemap = { posts: [], hubs: [], authors: [] };

/** `YYYY-MM-DD` → the UTC midnight instant, so the XML carries a full ISO 8601 timestamp. */
export function contentDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00Z`);
}

/**
 * Every indexable route (BRD 7.5): the code-owned routes from `seo-defaults` (`/`,
 * `/products`, `/blog`), every published page with its date (a legal page's date is its
 * body's «آخر تحديث», so the visible line, the JSON-LD and the sitemap agree), the products
 * with their photos, the published posts with a real `lastmod`, the hub pages and the
 * authors. No 404, no API, no queries, no paginated listing.
 */
export function sitemapEntries(
  base: string,
  seo: PageSeo[],
  pages: Array<Pick<Page, 'slug' | 'updatedAt'>>,
  products: Product[],
  blog: BlogSitemap = EMPTY_BLOG,
): MetadataRoute.Sitemap {
  const staticEntries = seo.map((page) => ({
    url: `${base}${page.route === '/' ? '' : page.route}`,
    lastModified: contentDate(page.updatedAt),
  }));
  const pageEntries = pages.map((page) => ({
    url: `${base}/${page.slug}`,
    lastModified: contentDate(page.updatedAt),
  }));
  const productEntries = products.map((product) => ({
    url: `${base}/products/${product.slug}`,
    lastModified: contentDate(product.updatedAt),
    images: product.colors
      .flatMap((c) => [c.images.front, c.images.back].filter((p): p is string => Boolean(p)))
      .map((path) => absoluteUrl(base, path)),
  }));
  const postEntries = blog.posts.map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: new Date(post.contentUpdatedAt ?? post.publishedAt),
  }));
  const hubEntries = blog.hubs.map((hub) => ({ url: `${base}/blog/category/${hub.slug}` }));
  const authorEntries = blog.authors.map((author) => ({ url: `${base}/author/${author.slug}` }));
  return [
    ...staticEntries,
    ...pageEntries,
    ...productEntries,
    ...postEntries,
    ...hubEntries,
    ...authorEntries,
  ];
}
