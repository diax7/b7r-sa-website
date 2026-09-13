import type { Metadata, Viewport } from 'next';
import { SiteDocument } from '@/app/site-document';
import { notFoundPage } from '@/content/pages';
import { getNavigation, getSiteSettings } from '@/lib/cms';
import { BRAND_PRIMARY_HEX } from '@/lib/tokens';
import { StatusPage } from '@/modules/core';
import { rootMetadata } from '@/modules/core/seo/metadata';

/** Next adds `<meta name="robots" content="noindex">` itself on every 404 response. */
export async function generateMetadata(): Promise<Metadata> {
  return { ...(await rootMetadata()), title: notFoundPage.title };
}

export const revalidate = 60;

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: BRAND_PRIMARY_HEX,
};

/**
 * BRD 4.15 / 6.13. With two root layouts (site and admin) Next cannot compose a 404 from a
 * layout, so this file renders the whole document itself (ADR-024). HTTP 404, no ribbon.
 */
export default async function GlobalNotFound() {
  const [site, navigation] = await Promise.all([getSiteSettings(), getNavigation()]);
  return (
    <SiteDocument site={site} navigation={navigation}>
      <StatusPage
        title={notFoundPage.title}
        text={notFoundPage.text}
        button={notFoundPage.button}
      />
    </SiteDocument>
  );
}
