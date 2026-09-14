import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { SiteDocument } from '@/app/site-document';
import { getNavigation, getSiteSettings } from '@/lib/cms';
import { localeEnabled } from '@/lib/cms/settings';
import { BRAND_PRIMARY_HEX } from '@/lib/tokens';
import { DraftBar } from '@/modules/core/draft-bar';
import { rootMetadata } from '@/modules/core/seo/metadata';

/** Root metadata of the English document: the English title template (no verification metas twice). */
export async function generateMetadata(): Promise<Metadata> {
  return rootMetadata('en');
}

export const revalidate = 60;

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: BRAND_PRIMARY_HEX,
};

/**
 * Root layout of every English page (ADR-043): a second root layout, so `/en/*` is a real
 * `lang="en" dir="ltr"` document on the same shell. The proxy answers 404 for every `/en`
 * URL while the site is not in English; this guard is the last line for a build that ran
 * against a half-seeded database (a clear error, never a shell with empty labels).
 */
export default async function EnglishLayout({ children }: { children: ReactNode }) {
  if (!(await localeEnabled('en'))) {
    throw new Error('The site is not in English yet: seed the English settings and navigation');
  }
  const [site, navigation] = await Promise.all([getSiteSettings('en'), getNavigation('en')]);
  return (
    <SiteDocument locale="en" site={site} navigation={navigation} banner={<DraftBar locale="en" />}>
      {children}
    </SiteDocument>
  );
}
