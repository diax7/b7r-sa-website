import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Metadata } from 'next';
import { copyFor } from '@/content/copy';
import type { Product } from '@/content/schema';
import type { Author, Hub, Post } from '@/lib/cms/blog';
import { getPage, getSeo, getSeoDefaults, getSiteSettings } from '@/lib/cms';
import { documentLocales, siteLocales } from '@/lib/cms/locales';
import { env, siteBase } from '@/lib/env';
import { type Locale, languageTag, localePath, ogLocale, otherLocale } from '@/lib/i18n';

const FEED_PATH = '/feed.xml';

/** The default Open Graph image of a language: `pnpm og` renders both sets (ADR-043). */
export function defaultOgImage(locale: Locale): string {
  return localeOgPath(locale, '/default.png');
}

function localeOgPath(locale: Locale, file: string): string {
  return locale === 'ar' ? `/og${file}` : `/og/en${file}`;
}

export interface PageMeta {
  locale: Locale;
  /** The locale-free route (`/products/tee-essential`); the canonical adds the prefix. */
  route: string;
  /** The locales the page exists in; hreflang pairs are emitted only when both do. */
  locales: readonly Locale[];
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
 * Metadata for one route (BRD 7.3, ADR-043): canonical without query under the locale's
 * prefix, hreflang pairs with `x-default → ar` when the twin exists, Open Graph with the
 * page's own image or the default, Twitter card, and `noindex` on any host other than
 * https://b7r.sa (BRD 7.2) so previews never rank. Product pages use `og:type website` with
 * product tags (`product` is not a valid `og:type` for Next's typed metadata; the Product
 * JSON-LD carries the commerce data).
 */
export function pageMetadata(meta: PageMeta): Metadata {
  const ogImage = meta.ogImage ?? defaultOgImage(meta.locale);
  const canonical = localePath(meta.locale, meta.route);
  const twin = otherLocale(meta.locale);
  const paired = meta.locales.includes('ar') && meta.locales.includes('en');
  const common = {
    locale: ogLocale(meta.locale),
    ...(paired ? { alternateLocale: [ogLocale(twin)] } : {}),
    siteName: meta.siteName,
    title: meta.title,
    description: meta.description,
    url: canonical,
    images: [{ url: ogImage, width: 1200, height: 630 }],
  };
  const openGraph: NonNullable<Metadata['openGraph']> =
    meta.ogType === 'article'
      ? {
          type: 'article',
          ...common,
          ...(meta.publishedTime ? { publishedTime: meta.publishedTime } : {}),
          ...(meta.modifiedTime ? { modifiedTime: meta.modifiedTime } : {}),
          authors: [`${siteBase()}${localePath(meta.locale, '/about')}`],
        }
      : { type: 'website', ...common };
  return {
    metadataBase: new URL(siteBase()),
    title: meta.absoluteTitle ? { absolute: meta.title } : meta.title,
    description: meta.description,
    alternates: {
      canonical,
      // The pair, each language canonical to itself, `x-default` on the Arabic (BRD 7.3).
      ...(paired
        ? {
            languages: {
              [languageTag('ar')]: localePath('ar', meta.route),
              [languageTag('en')]: localePath('en', meta.route),
              'x-default': localePath('ar', meta.route),
            },
          }
        : {}),
      // The language's feed is announced on every page so a reader finds it from anywhere (BRD 10.1).
      types: { 'application/rss+xml': localePath(meta.locale, FEED_PATH) },
    },
    openGraph,
    twitter: { card: 'summary_large_image', site: '@b7rprint' },
    robots: env.isProductionSite
      ? { index: true, follow: true, 'max-image-preview': 'large' }
      : { index: false, follow: false },
  };
}

/** Static routes: title/description from the `seo-defaults` global (BRD 4.16). */
export async function buildMetadata(locale: Locale, route: string): Promise<Metadata> {
  const [page, site, locales] = await Promise.all([
    getSeo(locale, route),
    getSiteSettings(locale),
    siteLocales(),
  ]);
  return pageMetadata({
    locale,
    route,
    locales,
    siteName: site.brandName,
    title: page.title,
    description: page.description,
    ...(page.ogImage ? { ogImage: page.ogImage } : {}),
    absoluteTitle: route === '/',
  });
}

/** A `pages` document: its own `seo` group (BRD 4.16); nothing for a slug that is not published. */
export async function cmsPageMetadata(locale: Locale, slug: string): Promise<Metadata> {
  const [page, site, locales] = await Promise.all([
    getPage(locale, slug),
    getSiteSettings(locale),
    documentLocales('pages', slug, 'title'),
  ]);
  if (!page) return {};
  return pageMetadata({
    locale,
    route: `/${slug}`,
    locales,
    siteName: site.brandName,
    title: page.seo.title,
    description: page.seo.description,
    ...(page.seo.ogImage ? { ogImage: page.seo.ogImage } : {}),
  });
}

/**
 * Product detail (BRD 4.16 templates): its own OG image from `public/og/products/` (or
 * `public/og/en/products/` for the English document) when `pnpm og` has rendered one; a
 * product added in the admin falls back to the default until then (docs/RUNBOOK.md, "Open
 * Graph images").
 */
export async function productMetadata(locale: Locale, product: Product): Promise<Metadata> {
  const [site, locales] = await Promise.all([
    getSiteSettings(locale),
    documentLocales('products', product.slug, 'name'),
  ]);
  const productSeo = copyFor(locale).seo.product;
  const ogPath = localeOgPath(locale, `/products/${product.slug}.png`);
  const hasOwnImage = existsSync(join(process.cwd(), 'public', ogPath));
  return pageMetadata({
    locale,
    route: `/products/${product.slug}`,
    locales,
    siteName: site.brandName,
    title: productSeo.title.replace('{name}', product.name),
    description: productSeo.description
      .replace('{short description}', product.shortDescription.replace(/\.$/, ''))
      .replace('{base}', String(product.baseCost)),
    ...(hasOwnImage ? { ogImage: ogPath } : {}),
  });
}

/** Blog post: its `seo` group (the title and excerpt when empty), `article` type with dates. */
export async function postMetadata(locale: Locale, post: Post): Promise<Metadata> {
  const [site, locales] = await Promise.all([
    getSiteSettings(locale),
    documentLocales('posts', post.slug, 'title'),
  ]);
  return pageMetadata({
    locale,
    route: `/blog/${post.slug}`,
    locales,
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
export async function hubMetadata(locale: Locale, hub: Hub, page = 1): Promise<Metadata> {
  const [site, locales] = await Promise.all([
    getSiteSettings(locale),
    documentLocales('categories', hub.slug, 'name'),
  ]);
  const route = `/blog/category/${hub.slug}${page > 1 ? `/page/${page}` : ''}`;
  return pageMetadata({
    locale,
    route,
    locales,
    siteName: site.brandName,
    title: page > 1 ? `${hub.name} (${page})` : hub.name,
    description: hub.description,
    ...(hub.cover ? { ogImage: hub.cover } : {}),
  });
}

/** The blog index beyond page 1: the `seo-defaults` title with the page number. */
export async function blogPageMetadata(locale: Locale, page: number): Promise<Metadata> {
  const [seo, site, locales] = await Promise.all([
    getSeo(locale, '/blog'),
    getSiteSettings(locale),
    siteLocales(),
  ]);
  return pageMetadata({
    locale,
    route: `/blog/page/${page}`,
    locales,
    siteName: site.brandName,
    title: `${seo.title} (${page})`,
    description: seo.description,
    ...(seo.ogImage ? { ogImage: seo.ogImage } : {}),
  });
}

/** The author page. */
export async function authorMetadata(locale: Locale, author: Author): Promise<Metadata> {
  const [site, locales] = await Promise.all([
    getSiteSettings(locale),
    documentLocales('authors', author.slug, 'name'),
  ]);
  return pageMetadata({
    locale,
    route: `/author/${author.slug}`,
    locales,
    siteName: site.brandName,
    title: author.name,
    description: author.bio ?? author.role,
    ...(author.photo ? { ogImage: author.photo } : {}),
  });
}

export async function rootMetadata(locale: Locale): Promise<Metadata> {
  const [seo, site] = await Promise.all([getSeoDefaults(locale), getSiteSettings(locale)]);
  const home = seo.routes.find((r) => r.route === '/');
  return {
    title: {
      default: home?.title ?? site.brandName,
      template: seo.titleTemplate || copyFor(locale).seo.titleTemplate,
    },
    applicationName: site.brandName,
  };
}
