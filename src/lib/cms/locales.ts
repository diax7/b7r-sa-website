import 'server-only';
import { cache } from 'react';
import { cms } from '@/lib/cms/payload';
import { PUBLISHED } from '@/lib/cms/read';
import { localeEnabled } from '@/lib/cms/settings';
import { type Locale, LOCALES } from '@/lib/i18n';

type LocalisedCollection = 'products' | 'pages' | 'posts' | 'categories' | 'authors';

/**
 * The locales a published document exists in (ADR-043): one read at `locale: 'all'` of its
 * title-like field, so hreflang pairs and the switcher never need a second full read. A
 * value counts when it is a non-empty string in that locale.
 */
export const documentLocales = cache(
  async (collection: LocalisedCollection, slug: string, field: string): Promise<Locale[]> => {
    const payload = await cms();
    const { docs } = await payload.find({
      collection,
      locale: 'all',
      draft: false,
      overrideAccess: true,
      depth: 0,
      limit: 1,
      where: { and: [{ slug: { equals: slug } }, ...(isVersioned(collection) ? [PUBLISHED] : [])] },
    });
    const values = (docs[0] as Record<string, unknown> | undefined)?.[field];
    if (!values || typeof values !== 'object') return [];
    const byLocale = values as Record<string, unknown>;
    return LOCALES.filter((locale) => {
      const value = byLocale[locale];
      return typeof value === 'string' && value.trim() !== '';
    });
  },
);

function isVersioned(collection: LocalisedCollection): boolean {
  return collection === 'products' || collection === 'pages' || collection === 'posts';
}

/**
 * The locales the code-owned routes (the designed pages, the listings, the blog index) exist
 * in: Arabic, and English once the site is in it.
 */
export const siteLocales = cache(async (): Promise<Locale[]> => {
  return (await localeEnabled('en')) ? ['ar', 'en'] : ['ar'];
});
