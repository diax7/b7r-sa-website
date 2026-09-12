import type { Metadata } from 'next';
import { getSeo, SEO_TITLE_TEMPLATE } from '@/content/seo';
import { site } from '@/content/site';
import { env, PRODUCTION_SITE_URL } from '@/lib/env';

/**
 * Per-route metadata (BRD 7.3). The home page uses its full title without the template.
 * Any host other than https://b7r.sa gets `noindex` (BRD 7.2) so previews never rank.
 */
export function buildMetadata(route: string): Metadata {
  const page = getSeo(route);
  const base = env.siteUrl ?? PRODUCTION_SITE_URL;
  const isHome = route === '/';
  const title = isHome ? { absolute: page.title } : page.title;
  return {
    metadataBase: new URL(base),
    title,
    description: page.description,
    alternates: { canonical: route },
    openGraph: {
      type: 'website',
      locale: 'ar_SA',
      siteName: site.brandName,
      title: page.title,
      description: page.description,
      url: route,
      ...(page.ogImage ? { images: [{ url: page.ogImage, width: 1200, height: 630 }] } : {}),
    },
    twitter: { card: 'summary_large_image', site: '@b7rprint' },
    robots: env.isProductionSite
      ? { index: true, follow: true, 'max-image-preview': 'large' }
      : { index: false, follow: false },
  };
}

export const rootMetadata: Metadata = {
  title: { default: getSeo('/').title, template: SEO_TITLE_TEMPLATE },
  applicationName: site.brandName,
};
