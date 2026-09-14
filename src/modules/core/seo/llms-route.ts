import { getPages, getProducts, getSeoDefaults, getSiteSettings } from '@/lib/cms';
import { getAllPosts } from '@/lib/cms/blog';
import { siteBase } from '@/lib/env';
import type { Locale } from '@/lib/i18n';
import { llmsText } from '@/modules/core/seo/llms';

/** The `llms.txt` of one language from the CMS; the two route files are thin wrappers. */
export async function llmsResponse(locale: Locale): Promise<Response> {
  const [site, seo, pages, products, posts] = await Promise.all([
    getSiteSettings(locale),
    getSeoDefaults(locale),
    getPages(locale),
    getProducts(locale),
    getAllPosts(locale),
  ]);
  const text = llmsText({
    locale,
    base: siteBase(),
    site,
    seo: seo.routes,
    pages,
    products,
    posts,
  });
  return new Response(text, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
