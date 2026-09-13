import type { Metadata } from 'next';
import { permanentRedirect, redirect } from 'next/navigation';
import { SITE_BLOCK_RENDERERS } from '@/app/(site)/cms-blocks';
import { RESERVED_PAGE_SLUGS } from '@/content/schema';
import { getPages } from '@/lib/cms';
import { getRedirects } from '@/lib/cms/redirects';
import { resolveSlug } from '@/lib/resolve-slug';
import { cmsPageMetadata } from '@/modules/core/seo/metadata';
import { CmsPage } from '@/modules/pages';

interface Params {
  params: Promise<{ slug: string }>;
}

/**
 * A page published in the admin gets its route on first request (ISR) and on the next
 * build; a redirect added in the admin answers 308 (301 rows) or 307 (302 rows) from here
 * (ADR-032). Unknown top-level URLs never reach here: the proxy rewrites them to the global
 * 404 (B0), so `notFound()` in `CmsPage` is the fallback for a page unpublished between the
 * allowlist refresh and the request.
 */
export const dynamicParams = true;

async function resolution(slug: string) {
  const [redirects, pages] = await Promise.all([getRedirects(), getPages()]);
  return resolveSlug(slug, redirects, new Set(pages.map((p) => p.slug)));
}

const reserved = new Set<string>(RESERVED_PAGE_SLUGS);

export async function generateStaticParams() {
  return (await getPages()).filter((p) => !reserved.has(p.slug)).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const hit = await resolution(slug);
  return hit?.kind === 'page' ? cmsPageMetadata(slug) : {};
}

export default async function PageRoute({ params }: Params) {
  const { slug } = await params;
  const hit = await resolution(slug);
  if (hit?.kind === 'redirect') {
    if (hit.permanent) permanentRedirect(hit.to);
    redirect(hit.to);
  }
  return <CmsPage slug={slug} renderers={SITE_BLOCK_RENDERERS} />;
}
