import 'server-only';
import { cache } from 'react';
import type { Navigation, PageSeo, SiteSettings } from '@/content/schema';
import { toNavigation, toSeoRows, toSiteSettings } from '@/lib/cms/mappers';
import { cms, publicRead } from '@/lib/cms/payload';
import type { Locale } from '@/lib/i18n';

/**
 * Global reads, deduplicated per render with `React.cache` (the layout and the page both ask
 * for the site settings). Pages revalidate on a timer and on publish (ADR-030), so no data
 * cache sits between here and Payload.
 */

/** `site-settings` global as the Level 1 `SiteSettings` contract. */
export const getSiteSettings = cache(async (locale: Locale): Promise<SiteSettings> => {
  const payload = await cms();
  return toSiteSettings(await payload.findGlobal({ slug: 'site-settings', ...publicRead(locale) }));
});

export const getNavigation = cache(async (locale: Locale): Promise<Navigation> => {
  const payload = await cms();
  return toNavigation(
    await payload.findGlobal({ slug: 'navigation', ...publicRead(locale) }),
    locale,
  );
});

/**
 * Whether the site as a whole exists in a locale (ADR-043): Arabic always; English once the
 * settings and the navigation carry their required English values, judged on one field
 * each, so a half-seeded environment answers 404 for `/en` rather than a shell with empty
 * labels. The proxy reads it through `/api/pages/slugs/en`.
 */
export const localeEnabled = cache(async (locale: Locale): Promise<boolean> => {
  if (locale === 'ar') return true;
  const payload = await cms();
  const [site, navigation] = await Promise.all([
    payload.findGlobal({ slug: 'site-settings', ...publicRead(locale), depth: 0 }),
    payload.findGlobal({ slug: 'navigation', ...publicRead(locale), depth: 0 }),
  ]);
  return Boolean(site.brandName) && Boolean(navigation.ctaLabel);
});

export interface SeoDefaults {
  titleTemplate: string;
  defaultOgImage: string;
  routes: PageSeo[];
  verification: { google?: string; bing?: string };
}

export const getSeoDefaults = cache(async (locale: Locale): Promise<SeoDefaults> => {
  const payload = await cms();
  const doc = await payload.findGlobal({ slug: 'seo-defaults', ...publicRead(locale) });
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
export async function getSeo(locale: Locale, route: string): Promise<PageSeo> {
  const entry = (await getSeoDefaults(locale)).routes.find((s) => s.route === route);
  if (!entry)
    throw new Error(`No SEO entry for route ${route}; add it in the admin (seo-defaults)`);
  return entry;
}
