import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { SiteDocument } from '@/app/site-document';
import { getNavigation, getSiteSettings } from '@/lib/cms';
import { localeEnabled } from '@/lib/cms/settings';
import { LOCALES } from '@/lib/i18n';
import { getAppearance, siteViewport } from '@/modules/brand';
import { DraftBar } from '@/modules/core/draft-bar';
import { rootMetadata } from '@/modules/core/seo/metadata';

/** Root metadata of the English document: the English title template (no verification metas twice). */
export async function generateMetadata(): Promise<Metadata> {
  return rootMetadata('en');
}

export const revalidate = 60;

export function generateViewport(): Promise<Viewport> {
  return siteViewport();
}

/**
 * Root layout of every English page (ADR-043): a second root layout, so `/en/*` is a real
 * `lang="en" dir="ltr"` document on the same shell. While the site is not in English (a
 * database seeded before Level 5) every English route is a 404: the proxy answers it for
 * requests, and this guard answers it for the build, which prerenders `/en` and would
 * otherwise fail on an Arabic-only production database until the English seed ran. The
 * routes regenerate once the English settings and navigation exist (`revalidate`).
 */
export default async function EnglishLayout({ children }: { children: ReactNode }) {
  if (!(await localeEnabled('en'))) {
    console.error('The site is not in English yet: /en answers 404 until the English seed runs');
    notFound();
  }
  const [site, navigation, appearance] = await Promise.all([
    getSiteSettings('en'),
    getNavigation('en'),
    getAppearance(),
  ]);
  return (
    <SiteDocument
      locale="en"
      locales={LOCALES}
      site={site}
      navigation={navigation}
      appearance={appearance}
      banner={<DraftBar locale="en" />}
    >
      {children}
    </SiteDocument>
  );
}
