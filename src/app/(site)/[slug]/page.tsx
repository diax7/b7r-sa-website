import type { Metadata } from 'next';
import { SITE_BLOCK_RENDERERS } from '@/app/(site)/cms-blocks';
import { cmsSlugMetadata, cmsSlugParams, renderCmsSlug } from '@/modules/pages';

interface Params {
  params: Promise<{ slug: string }>;
}

/**
 * A page published in the admin gets its route on first request (ISR) and on the next
 * build; a redirect added in the admin answers from here (ADR-032). Unknown URLs never reach
 * here: the proxy rewrites them to the global 404 (B0).
 */
export const dynamicParams = true;

export const generateStaticParams = () => cmsSlugParams('ar');

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  return cmsSlugMetadata('ar', (await params).slug);
}

export default async function PageRoute({ params }: Params) {
  return renderCmsSlug('ar', (await params).slug, SITE_BLOCK_RENDERERS);
}
