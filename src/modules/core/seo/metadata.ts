import type { Metadata } from 'next';
import type { BlogPost, Product } from '@/content/schema';
import { getSeo, productSeo, SEO_TITLE_TEMPLATE } from '@/content/seo';
import { site } from '@/content/site';
import { env, siteBase } from '@/lib/env';

export const DEFAULT_OG_IMAGE = '/og/default.png';

export interface PageMeta {
  route: string;
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
          siteName: site.brandName,
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
          siteName: site.brandName,
          title: meta.title,
          description: meta.description,
          url: meta.route,
          images: [{ url: ogImage, width: 1200, height: 630 }],
        };
  return {
    metadataBase: new URL(siteBase()),
    title: meta.absoluteTitle ? { absolute: meta.title } : meta.title,
    description: meta.description,
    alternates: { canonical: meta.route },
    openGraph,
    twitter: { card: 'summary_large_image', site: '@b7rprint' },
    robots: env.isProductionSite
      ? { index: true, follow: true, 'max-image-preview': 'large' }
      : { index: false, follow: false },
  };
}

/** Static routes listed in `content/seo.ts`. */
export function buildMetadata(route: string): Metadata {
  const page = getSeo(route);
  return pageMetadata({
    route,
    title: page.title,
    description: page.description,
    ...(page.ogImage ? { ogImage: page.ogImage } : {}),
    absoluteTitle: route === '/',
  });
}

/** Product detail (BRD 4.16 templates): its own OG image from `public/og/products/`. */
export function productMetadata(product: Product): Metadata {
  return pageMetadata({
    route: `/products/${product.slug}`,
    title: productSeo.title.replace('{name}', product.name),
    description: productSeo.description
      .replace('{short description}', product.shortDescription.replace(/\.$/, ''))
      .replace('{base}', String(product.baseCost)),
    ogImage: `/og/products/${product.slug}.png`,
  });
}

/** Blog post: `article` type with dates; the cover doubles as the OG image. */
export function postMetadata(post: BlogPost): Metadata {
  return pageMetadata({
    route: `/blog/${post.slug}`,
    title: post.title,
    description: post.excerpt,
    ogType: 'article',
    ogImage: post.cover,
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt,
  });
}

export const rootMetadata: Metadata = {
  title: { default: getSeo('/').title, template: SEO_TITLE_TEMPLATE },
  applicationName: site.brandName,
};
