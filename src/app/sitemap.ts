import type { MetadataRoute } from 'next';
import { getPages, getProducts, getSeoDefaults } from '@/lib/cms';
import { getAllAuthors, getAllPosts, getHubs } from '@/lib/cms/blog';
import { BLOG_ENGLISH_PENDING, siteLocales } from '@/lib/cms/locales';
import { siteBase } from '@/lib/env';
import type { Locale } from '@/lib/i18n';
import { EMPTY_BLOG, type LocaleSitemapInput, sitemapEntries } from '@/modules/core/seo/sitemap';

/** Regenerated on publish (`revalidatePath('/sitemap.xml')`) and at most once a minute. */
export const revalidate = 60;

async function inputFor(locale: Locale): Promise<LocaleSitemapInput> {
  const [seo, pages, products] = await Promise.all([
    getSeoDefaults(locale),
    getPages(locale),
    getProducts(locale),
  ]);
  // The blog routes exist in Arabic only until 5b: neither its posts nor its index in English.
  const englishBlogPending = locale === 'en' && BLOG_ENGLISH_PENDING;
  const blog = englishBlogPending
    ? EMPTY_BLOG
    : {
        posts: await getAllPosts(locale),
        hubs: await getHubs(locale),
        authors: await getAllAuthors(locale),
      };
  const routes = englishBlogPending ? seo.routes.filter((r) => r.route !== '/blog') : seo.routes;
  return { locale, seo: routes, pages, products, blog };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const locales = await siteLocales();
  const inputs = await Promise.all(locales.map(inputFor));
  return sitemapEntries(siteBase(), inputs);
}
