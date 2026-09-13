import 'server-only';
import { cache } from 'react';
import type { Navigation, PageSeo, SiteSettings } from '@/content/schema';
import { toNavigation, toSeoRows, toSiteSettings } from '@/lib/cms/mappers';
import { cms, PUBLIC_READ } from '@/lib/cms/payload';

/**
 * Global reads, deduplicated per render with `React.cache` (the layout and the page both ask
 * for the site settings). Pages revalidate on a timer and on publish (ADR-030), so no data
 * cache sits between here and Payload.
 */

/** `site-settings` global as the Level 1 `SiteSettings` contract. */
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  const payload = await cms();
  return toSiteSettings(await payload.findGlobal({ slug: 'site-settings', ...PUBLIC_READ }));
});

export const getNavigation = cache(async (): Promise<Navigation> => {
  const payload = await cms();
  return toNavigation(await payload.findGlobal({ slug: 'navigation', ...PUBLIC_READ }));
});

export interface SeoDefaults {
  titleTemplate: string;
  defaultOgImage: string;
  routes: PageSeo[];
  verification: { google?: string; bing?: string };
}

export const getSeoDefaults = cache(async (): Promise<SeoDefaults> => {
  const payload = await cms();
  const doc = await payload.findGlobal({ slug: 'seo-defaults', ...PUBLIC_READ });
  return {
    titleTemplate: doc.titleTemplate,
    defaultOgImage: doc.defaultOgImage,
    routes: toSeoRows(doc),
    verification: {
      ...(doc.verification?.google ? { google: doc.verification.google } : {}),
      ...(doc.verification?.bing ? { bing: doc.verification.bing } : {}),
    },
  };
});

/** Title/description for a static route (BRD 4.16); throws when the CMS has no row for it. */
export async function getSeo(route: string): Promise<PageSeo> {
  const entry = (await getSeoDefaults()).routes.find((s) => s.route === route);
  if (!entry)
    throw new Error(`No SEO entry for route ${route}; add it in the admin (seo-defaults)`);
  return entry;
}
