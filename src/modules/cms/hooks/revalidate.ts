import { revalidatePath } from 'next/cache';
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
  PayloadRequest,
} from 'payload';

/**
 * Publish → live (BRD 9.6, ADR-030). Every page revalidates on a 60 s timer; on top of that
 * a publish regenerates the static routes that show the content right away.
 *
 * Product detail pages are deliberately left to the timer: they are `dynamicParams = false`
 * routes, and Next 16's file-system cache answers 404 for such a route once its path has
 * been revalidated on demand (`file-system-cache.js` returns null for expired tags, then the
 * page module throws NoFallbackError). Never add `/products/:slug` here.
 */

/** Static routes that render products: the home strip and designer, the listing, the sitemap. */
export const PATHS_FOR_PRODUCTS = ['/', '/products', '/sitemap.xml'];

export const PATHS_FOR_GLOBAL: Record<string, string[]> = {
  'site-settings': ['/', '/contact', '/about', '/how-it-works', '/faq', '/products', '/blog'],
  navigation: ['/'],
  'seo-defaults': ['/', '/products', '/how-it-works', '/about', '/contact', '/faq', '/blog'],
};

/** Skips revalidation for the migration script (`context.disableRevalidate`) and during build. */
export function shouldRevalidate(req: PayloadRequest): boolean {
  if (req.context?.['disableRevalidate']) return false;
  return process.env['NEXT_PHASE'] !== 'phase-production-build';
}

/** Products: a publish, an unpublish or a delete is visible; a draft autosave is not. */
export const revalidateProducts: CollectionAfterChangeHook & CollectionAfterDeleteHook = ({
  doc,
  req,
  ...rest
}) => {
  if (!shouldRevalidate(req)) return doc;
  const status = (doc as { _status?: string } | undefined)?._status;
  const previous = (rest as { previousDoc?: { _status?: string } }).previousDoc;
  const wasPublished = previous?._status === 'published';
  if ('operation' in rest && status && status !== 'published' && !wasPublished) return doc;
  for (const path of PATHS_FOR_PRODUCTS) revalidatePath(path);
  return doc;
};

/** Globals: every static route that renders them. */
export function revalidateGlobal(slug: string): GlobalAfterChangeHook {
  return ({ doc, req }) => {
    if (!shouldRevalidate(req)) return doc;
    for (const path of PATHS_FOR_GLOBAL[slug] ?? ['/']) revalidatePath(path);
    return doc;
  };
}
