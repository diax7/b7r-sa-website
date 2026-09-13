import type { Metadata } from 'next';
import { SITE_BLOCK_RENDERERS } from '@/app/(site)/cms-blocks';
import { RESERVED_PAGE_SLUGS } from '@/content/schema';
import { getPages } from '@/lib/cms';
import { cmsPageMetadata } from '@/modules/core/seo/metadata';
import { CmsPage } from '@/modules/pages';

interface Params {
  params: Promise<{ slug: string }>;
}

/**
 * A page published in the admin gets its route on first request (ISR) and on the next
 * build. Unknown top-level URLs never reach here: the proxy rewrites them to the global
 * 404 (B0, ADR-032), so `notFound()` below is the fallback for a page unpublished between
 * the allowlist refresh and the request.
 */
export const dynamicParams = true;

const reserved = new Set<string>(RESERVED_PAGE_SLUGS);

export async function generateStaticParams() {
  return (await getPages()).filter((p) => !reserved.has(p.slug)).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  return cmsPageMetadata(slug);
}

export default async function PageRoute({ params }: Params) {
  const { slug } = await params;
  return <CmsPage slug={slug} renderers={SITE_BLOCK_RENDERERS} />;
}
