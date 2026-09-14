import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Metadata } from 'next';
import type { Product } from '@/content/schema';
import type { Author, Hub, Post } from '@/lib/cms/blog';
import { productSeo, SEO_TITLE_TEMPLATE } from '@/content/seo-copy';
import { getPage, getSeo, getSeoDefaults, getSiteSettings } from '@/lib/cms';
import { env, siteBase } from '@/lib/env';

const FEED_PATH = '/feed.xml';

export const DEFAULT_OG_IMAGE = '/og/default.png';

export interface PageMeta {
  route: string;
  /** Brand name for `og:site_name`. */
  siteName: string;
  title: string;
  description: string;
  ogType?: 'website' | 'article';
  ogImage?: string;
  /** Article dates, ISO `YYYY-MM-DD`. */
  publishedTime?: string;
  modifiedTime?: string;
  /** The home page uses the full title without the « | بحر برنت» template. */
  absoluteTitle?: boolean;
}

/**
 * Metadata for one route (BRD 7.3): canonical without query, Open Graph with the page's own
 * image or the default, Twitter card, and `noindex` on any host other than https://b7r.sa
 * (BRD 7.2) so previews never rank. Product pages use `og:type website` with product tags
 * (`product` is not a valid `og:type` for Next's typed metadata; the Product JSON-LD carries
 * the commerce data).
 */
export function pageMetadata(meta: PageMeta): Metadata {
  const ogImage = meta.ogImage ?? DEFAULT_OG_IMAGE;
  const openGraph: NonNullable<Metadata['openGraph']> =
    meta.ogType === 'article'
      ? {
          type: 'article',
          locale: 'ar_SA',
          siteName: meta.siteName,
          title: meta.title,
          description: meta.description,
          url: meta.route,
          images: [{ url: ogImage, width: 1200, height: 630 }],
          ...(meta.publishedTime ? { publishedTime: meta.publishedTime } : {}),
          ...(meta.modifiedTime ? { modifiedTime: meta.modifiedTime } : {}),
          authors: [`${siteBase()}/about`],
        }
      : {
          type: 'website',
          locale: 'ar_SA',
          siteName: meta.siteName,
          title: meta.title,
          description: meta.description,
          url: meta.route,
          images: [{ url: ogImage, width: 1200, height: 630 }],
        };
  return {
    metadataBase: new URL(siteBase()),
    title: meta.absoluteTitle ? { absolute: meta.title } : meta.title,
    description: meta.description,
    // The feed is announced on every page so a reader finds it from anywhere (BRD 10.1).
    alternates: { canonical: meta.route, types: { 'application/rss+xml': FEED_PATH } },
    openGraph,
    twitter: { card: 'summary_large_image', site: '@b7rprint' },
    robots: env.isProductionSite
      ? { index: true, follow: true, 'max-image-preview': 'large' }
      : { index: false, follow: false },
  };
}

/** Static routes: title/description from the `seo-defaults` global (BRD 4.16). */
export async function buildMetadata(route: string): Promise<Metadata> {
  const [page, site] = await Promise.all([getSeo(route), getSiteSettings()]);
  return pageMetadata({
    route,
    siteName: site.brandName,
    title: page.title,
    description: page.description,
    ...(page.ogImage ? { ogImage: page.ogImage } : {}),
    absoluteTitle: route === '/',
  });
}

/** A `pages` document: its own `seo` group (BRD 4.16); nothing for a slug that is not published. */
export async function cmsPageMetadata(slug: string): Promise<Metadata> {
  const [page, site] = await Promise.all([getPage(slug), getSiteSettings()]);
  if (!page) return {};
  return pageMetadata({
    route: `/${slug}`,
    siteName: site.brandName,
    title: page.seo.title,
    description: page.seo.description,
    ...(page.seo.ogImage ? { ogImage: page.seo.ogImage } : {}),
  });
}

/**
 * Product detail (BRD 4.16 templates): its own OG image from `public/og/products/` when
 * `pnpm og` has rendered one; a product added in the admin falls back to the default until
 * then (docs/RUNBOOK.md, "Open Graph images").
 */
export async function productMetadata(product: Product): Promise<Metadata> {
  const site = await getSiteSettings();
  const ogPath = `/og/products/${product.slug}.png`;
  const hasOwnImage = existsSync(join(process.cwd(), 'public', ogPath));
  return pageMetadata({
    route: `/products/${product.slug}`,
    siteName: site.brandName,
    title: productSeo.title.replace('{name}', product.name),
    description: productSeo.description
      .replace('{short description}', product.shortDescription.replace(/\.$/, ''))
      .replace('{base}', String(product.baseCost)),
    ...(hasOwnImage ? { ogImage: ogPath } : {}),
  });
}

/** Blog post: its `seo` group (the title and excerpt when empty), `article` type with dates. */
export async function postMetadata(post: Post): Promise<Metadata> {
  const site = await getSiteSettings();
  return pageMetadata({
    route: `/blog/${post.slug}`,
    siteName: site.brandName,
    title: post.seo.title,
    description: post.seo.description,
    ogType: 'article',
    ...(post.seo.ogImage ? { ogImage: post.seo.ogImage } : {}),
    publishedTime: post.publishedAt,
    modifiedTime: post.contentUpdatedAt ?? post.publishedAt,
  });
}

/** A hub page; page 2 and up carry the page number and a canonical of their own. */
export async function hubMetadata(hub: Hub, page = 1): Promise<Metadata> {
  const site = await getSiteSettings();
  const route = `/blog/category/${hub.slug}${page > 1 ? `/page/${page}` : ''}`;
  return pageMetadata({
    route,
    siteName: site.brandName,
    title: page > 1 ? `${hub.name} (${page})` : hub.name,
    description: hub.description,
    ...(hub.cover ? { ogImage: hub.cover } : {}),
  });
}

/** The blog index beyond page 1: the `seo-defaults` title with the page number. */
export async function blogPageMetadata(page: number): Promise<Metadata> {
  const [seo, site] = await Promise.all([getSeo('/blog'), getSiteSettings()]);
  return pageMetadata({
    route: `/blog/page/${page}`,
    siteName: site.brandName,
    title: `${seo.title} (${page})`,
    description: seo.description,
    ...(seo.ogImage ? { ogImage: seo.ogImage } : {}),
  });
}

/** The author page. */
export async function authorMetadata(author: Author): Promise<Metadata> {
  const site = await getSiteSettings();
  return pageMetadata({
    route: `/author/${author.slug}`,
    siteName: site.brandName,
    title: author.name,
    description: author.bio ?? author.role,
    ...(author.photo ? { ogImage: author.photo } : {}),
  });
}

export async function rootMetadata(): Promise<Metadata> {
  const [seo, site] = await Promise.all([getSeoDefaults(), getSiteSettings()]);
  const home = seo.routes.find((r) => r.route === '/');
  return {
    title: {
      default: home?.title ?? site.brandName,
      template: seo.titleTemplate || SEO_TITLE_TEMPLATE,
    },
    applicationName: site.brandName,
  };
}
