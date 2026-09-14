import type { Metadata } from 'next';
import { permanentRedirect, redirect } from 'next/navigation';
import { RESERVED_PAGE_SLUGS } from '@/content/schema';
import { getPages } from '@/lib/cms';
import { getRedirects } from '@/lib/cms/redirects';
import { type Locale, localePath } from '@/lib/i18n';
import { resolveSlug } from '@/lib/resolve-slug';
import { cmsPageMetadata } from '@/modules/core/seo/metadata';
import type { ExtraRenderers } from '@/modules/pages/blocks/types';
import { CmsPage } from '@/modules/pages/cms-page';

/**
 * The `pages` routes per locale (ADR-043): the seven designed pages and the `/[slug]` route
 * for pages published in the admin, plus the redirects the admin adds (ADR-032). The Arabic
 * and English route files are thin wrappers over these.
 */
const reserved = new Set<string>(RESERVED_PAGE_SLUGS);

export function designedPageMetadata(locale: Locale, slug: string): Promise<Metadata> {
  return cmsPageMetadata(locale, slug);
}

export function renderDesignedPage(locale: Locale, slug: string, renderers: ExtraRenderers) {
  return <CmsPage slug={slug} locale={locale} renderers={renderers} />;
}

async function resolution(locale: Locale, slug: string) {
  const [redirects, pages] = await Promise.all([getRedirects(), getPages(locale)]);
  return resolveSlug(slug, redirects, new Set(pages.map((p) => p.slug)));
}

/** The published pages of the locale that are not one of the designed seven. */
export async function cmsSlugParams(locale: Locale): Promise<Array<{ slug: string }>> {
  return (await getPages(locale))
    .filter((p) => !reserved.has(p.slug))
    .map((p) => ({ slug: p.slug }));
}

export async function cmsSlugMetadata(locale: Locale, slug: string): Promise<Metadata> {
  const hit = await resolution(locale, slug);
  return hit?.kind === 'page' ? cmsPageMetadata(locale, slug) : {};
}

/**
 * A redirect added in the admin answers 308 (301 rows) or 307 (302 rows); a site-path
 * target keeps the locale's prefix, an absolute URL is followed as it is. Unknown slugs never
 * reach here (the proxy rewrites them to the global 404, B0); `notFound()` in `CmsPage` is
 * the fallback for a page unpublished between the allowlist refresh and the request.
 */
export async function renderCmsSlug(locale: Locale, slug: string, renderers: ExtraRenderers) {
  const hit = await resolution(locale, slug);
  if (hit?.kind === 'redirect') {
    const to = hit.to.startsWith('/') ? localePath(locale, hit.to) : hit.to;
    if (hit.permanent) permanentRedirect(to);
    redirect(to);
  }
  return <CmsPage slug={slug} locale={locale} renderers={renderers} />;
}
