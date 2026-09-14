import type { MetadataRoute } from 'next';
import { getPages, getProducts, getSeoDefaults } from '@/lib/cms';
import { getAllAuthors, getAllPosts, getHubs } from '@/lib/cms/blog';
import { siteLocales } from '@/lib/cms/locales';
import { siteBase } from '@/lib/env';
import type { Locale } from '@/lib/i18n';
import { type LocaleSitemapInput, sitemapEntries } from '@/modules/core/seo/sitemap';

/** Regenerated on publish (`revalidatePath('/sitemap.xml')`) and at most once a minute. */
export const revalidate = 60;

/** Everything indexable in one language; a document without that language is absent (ADR-043). */
async function inputFor(locale: Locale): Promise<LocaleSitemapInput> {
  const [seo, pages, products, posts, hubs, authors] = await Promise.all([
    getSeoDefaults(locale),
    getPages(locale),
    getProducts(locale),
    getAllPosts(locale),
    getHubs(locale),
    getAllAuthors(locale),
  ]);
  return { locale, seo: seo.routes, pages, products, blog: { posts, hubs, authors } };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const locales = await siteLocales();
  const inputs = await Promise.all(locales.map(inputFor));
  return sitemapEntries(siteBase(), inputs);
}
