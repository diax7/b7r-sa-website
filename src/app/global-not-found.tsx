import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { SiteDocument } from '@/app/site-document';
import { copyFor } from '@/content/copy';
import { getNavigation, getSiteSettings } from '@/lib/cms';
import { siteLocales } from '@/lib/cms/locales';
import { getAppearance, siteViewport } from '@/modules/brand';
import { StatusPage } from '@/modules/core';
import { rootMetadata } from '@/modules/core/seo/metadata';

const ar = copyFor('ar');
const en = copyFor('en');

/** Next adds `<meta name="robots" content="noindex">` itself on every 404 response. */
export async function generateMetadata(): Promise<Metadata> {
  return { ...(await rootMetadata('ar')), title: ar.notFoundPage.title };
}

export const revalidate = 60;

export function generateViewport(): Promise<Viewport> {
  return siteViewport();
}

/**
 * BRD 4.15 / 6.13, ADR-043. With two root layouts (site and admin) Next cannot compose a 404
 * from a layout, so this file renders the whole document itself (ADR-024), and it cannot
 * vary by URL, so an unknown `/en/*` lands here too: the Arabic document, then one English
 * line with a link to `/en` (once the site is in English). HTTP 404, no ribbon.
 */
export default async function GlobalNotFound() {
  const [site, navigation, locales, appearance] = await Promise.all([
    getSiteSettings('ar'),
    getNavigation('ar'),
    siteLocales(),
    getAppearance(),
  ]);
  return (
    <SiteDocument
      locale="ar"
      locales={locales}
      site={site}
      navigation={navigation}
      appearance={appearance}
    >
      <StatusPage
        title={ar.notFoundPage.title}
        text={ar.notFoundPage.text}
        button={ar.notFoundPage.button}
        home="/"
      />
      {locales.includes('en') && (
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
      )}
    </SiteDocument>
  );
}
