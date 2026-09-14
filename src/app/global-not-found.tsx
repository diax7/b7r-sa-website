import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { SiteDocument } from '@/app/site-document';
import { copyFor } from '@/content/copy';
import { getNavigation, getSiteSettings } from '@/lib/cms';
import { BRAND_PRIMARY_HEX } from '@/lib/tokens';
import { StatusPage } from '@/modules/core';
import { rootMetadata } from '@/modules/core/seo/metadata';

const ar = copyFor('ar');
const en = copyFor('en');

/** Next adds `<meta name="robots" content="noindex">` itself on every 404 response. */
export async function generateMetadata(): Promise<Metadata> {
  return { ...(await rootMetadata('ar')), title: ar.notFoundPage.title };
}

export const revalidate = 60;

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: BRAND_PRIMARY_HEX,
};

/**
 * BRD 4.15 / 6.13, ADR-043. With two root layouts (site and admin) Next cannot compose a 404
 * from a layout, so this file renders the whole document itself (ADR-024), and it cannot
 * vary by URL, so an unknown `/en/*` lands here too: the Arabic document, then one English
 * line with a link to `/en`. HTTP 404, no ribbon.
 */
export default async function GlobalNotFound() {
  const [site, navigation] = await Promise.all([getSiteSettings('ar'), getNavigation('ar')]);
  return (
    <SiteDocument locale="ar" site={site} navigation={navigation}>
      <StatusPage
        title={ar.notFoundPage.title}
        text={ar.notFoundPage.text}
        button={ar.notFoundPage.button}
        home="/"
      />
      <p
        lang="en"
        dir="ltr"
        className="pb-16 text-center text-small text-text-muted"
        data-not-found-en=""
      >
        {en.notFoundPage.title}. {en.notFoundPage.text}{' '}
        <Link href="/en" hrefLang="en" className="font-medium text-primary hover:underline">
          {en.notFoundPage.button}
        </Link>
      </p>
    </SiteDocument>
  );
}
