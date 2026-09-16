import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { SiteDocument } from '@/app/site-document';
import { getNavigation, getSeoDefaults, getSiteSettings } from '@/lib/cms';
import { siteLocales } from '@/lib/cms/locales';
import { BRAND_PRIMARY_HEX } from '@/lib/tokens';
import { DraftBar } from '@/modules/core/draft-bar';
import { rootMetadata } from '@/modules/core/seo/metadata';

/** Root metadata: the title template and the verification metas from the SEO settings (ADR-052). */
export async function generateMetadata(): Promise<Metadata> {
  const tokens = (await getSeoDefaults('ar')).verification;
  return {
    ...(await rootMetadata('ar')),
    verification: {
      ...(tokens.google ? { google: tokens.google } : {}),
      ...(tokens.bing ? { other: { 'msvalidate.01': tokens.bing } } : {}),
    },
  };
}

/**
 * Every public page is static and regenerates at most once a minute when requested (ISR), on
 * top of the publish-time `revalidatePath` calls in `modules/cms/hooks/revalidate` (ADR-030).
 */
export const revalidate = 60;

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: BRAND_PRIMARY_HEX,
};

/** Root layout of every Arabic page: the shared document around the page content. */
export default async function RootLayout({ children }: { children: ReactNode }) {
  const [site, navigation, locales] = await Promise.all([
    getSiteSettings('ar'),
    getNavigation('ar'),
    siteLocales(),
  ]);
  return (
    <SiteDocument
      locale="ar"
      locales={locales}
      site={site}
      navigation={navigation}
      banner={<DraftBar locale="ar" />}
    >
      {children}
    </SiteDocument>
  );
}
