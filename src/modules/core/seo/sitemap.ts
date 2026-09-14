import type { MetadataRoute } from 'next';
import type { Page, PageSeo, Product } from '@/content/schema';
import { absoluteUrl } from '@/lib/absolute-url';
import { type Locale, languageTag, localePath } from '@/lib/i18n';

/** The blog's sitemap input: what `lib/cms/blog.ts` reads. */
export interface BlogSitemap {
  posts: Array<{ slug: string; publishedAt: string; contentUpdatedAt: string | null }>;
  hubs: Array<{ slug: string }>;
  authors: Array<{ slug: string }>;
}

export const EMPTY_BLOG: BlogSitemap = { posts: [], hubs: [], authors: [] };

/** One locale's share of the sitemap: what exists in that language. */
export interface LocaleSitemapInput {
  locale: Locale;
  seo: PageSeo[];
  pages: Array<Pick<Page, 'slug' | 'updatedAt'>>;
  products: Product[];
  blog?: BlogSitemap;
}

/** `YYYY-MM-DD` → the UTC midnight instant, so the XML carries a full ISO 8601 timestamp. */
export function contentDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00Z`);
}

type Entry = MetadataRoute.Sitemap[number];
type Draft = { route: string; entry: Entry };

function draftsOf(base: string, input: LocaleSitemapInput): Draft[] {
  const { locale } = input;
  const url = (route: string) => absoluteUrl(base, localePath(locale, route));
  const blog = input.blog ?? EMPTY_BLOG;
  const staticEntries = input.seo.map((page) => ({
    route: page.route,
    entry: { url: url(page.route), lastModified: contentDate(page.updatedAt) },
  }));
  const pageEntries = input.pages.map((page) => ({
    route: `/${page.slug}`,
    entry: { url: url(`/${page.slug}`), lastModified: contentDate(page.updatedAt) },
  }));
  const productEntries = input.products.map((product) => ({
    route: `/products/${product.slug}`,
    entry: {
      url: url(`/products/${product.slug}`),
      lastModified: contentDate(product.updatedAt),
      images: product.colors
        .flatMap((c) => [c.images.front, c.images.back].filter((p): p is string => Boolean(p)))
        .map((path) => absoluteUrl(base, path)),
    },
  }));
  const postEntries = blog.posts.map((post) => ({
    route: `/blog/${post.slug}`,
    entry: {
      url: url(`/blog/${post.slug}`),
      lastModified: new Date(post.contentUpdatedAt ?? post.publishedAt),
    },
  }));
  const hubEntries = blog.hubs.map((hub) => ({
    route: `/blog/category/${hub.slug}`,
    entry: { url: url(`/blog/category/${hub.slug}`) },
  }));
  const authorEntries = blog.authors.map((author) => ({
    route: `/author/${author.slug}`,
    entry: { url: url(`/author/${author.slug}`) },
  }));
  return [
    ...staticEntries,
    ...pageEntries,
    ...productEntries,
    ...postEntries,
    ...hubEntries,
    ...authorEntries,
  ];
}

/**
 * Every indexable route (BRD 7.5, ADR-043), per locale: the code-owned routes from
 * `seo-defaults` (`/`, `/products`, `/blog`), every published page with its date (a legal
 * page's date is its body's «آخر تحديث», so the visible line, the JSON-LD and the sitemap
 * agree), the products with their photos, the published posts with a real `lastmod`, the
 * hub pages and the authors. A route that exists in both languages carries the hreflang
 * pair on both entries (`x-default` on the Arabic). No 404, no API, no queries, no
 * paginated listing.
 */
export function sitemapEntries(base: string, inputs: LocaleSitemapInput[]): MetadataRoute.Sitemap {
  const drafts = inputs.flatMap((input) =>
    draftsOf(base, input).map((d) => ({ ...d, locale: input.locale })),
  );
  const urlsByRoute = new Map<string, Partial<Record<Locale, string>>>();
  for (const d of drafts) {
    const urls = urlsByRoute.get(d.route) ?? {};
    urls[d.locale] = d.entry.url;
    urlsByRoute.set(d.route, urls);
  }
  return drafts.map((d) => {
    const urls = urlsByRoute.get(d.route) ?? {};
    if (!urls.ar || !urls.en) return d.entry;
    return {
      ...d.entry,
      alternates: {
        languages: {
          [languageTag('ar')]: urls.ar,
          [languageTag('en')]: urls.en,
          'x-default': urls.ar,
        },
      },
    };
  });
}
