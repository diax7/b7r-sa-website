import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { SiteDocument } from '@/app/site-document';
import { getNavigation, getSiteSettings } from '@/lib/cms';
import { verificationTokens } from '@/lib/env-server';
import { BRAND_PRIMARY_HEX } from '@/lib/tokens';
import { DraftBar } from '@/modules/core/draft-bar';
import { rootMetadata } from '@/modules/core/seo/metadata';

/** Root metadata: the title template and the verification metas (CMS first, env as fallback). */
export async function generateMetadata(): Promise<Metadata> {
  const tokens = verificationTokens();
  return {
    ...(await rootMetadata()),
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

/** Root layout of every public page: the shared document around the page content. */
export default async function RootLayout({ children }: { children: ReactNode }) {
  const [site, navigation] = await Promise.all([getSiteSettings(), getNavigation()]);
  return (
    <SiteDocument site={site} navigation={navigation} banner={<DraftBar />}>
      {children}
    </SiteDocument>
  );
}
