import { revalidatePath } from 'next/cache';
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
  PayloadRequest,
} from 'payload';

/**
 * Publish → live (BRD 9.6, ADR-030). Every page revalidates on a 60 s timer; on top of that a
 * publish regenerates the routes that show the content right away with `revalidatePath`.
 *
 * `/products/[slug]` has `dynamicParams = true` so it may be revalidated on demand: with
 * `dynamicParams = false` Next 16's file-system cache answers 404 for the route after its
 * path is expired (`file-system-cache.js` returns null → `NoFallbackError`). Keep it that
 * way, or product pages must go back to the timer only.
 */

/** Routes that render the products: home strip and designer, the listing, the sitemap. */
export const PATHS_FOR_PRODUCTS = ['/', '/products', '/sitemap.xml'];

/**
 * Every static route of the site: the three globals feed the shell (header, footer, meta) of
 * all of them, so any global change regenerates all at once; product pages follow the timer.
 */
export const STATIC_ROUTES = [
  '/',
  '/products',
  '/how-it-works',
  '/about',
  '/contact',
  '/faq',
  '/blog',
  '/terms',
  '/shipping',
  '/privacy',
  '/sitemap.xml',
  '/manifest.webmanifest',
];

/** The product's own page plus the routes that list it. */
export function pathsForProduct(slug: string): string[] {
  return [`/products/${slug}`, ...PATHS_FOR_PRODUCTS];
}

/** Skips revalidation for the migration script (`context.disableRevalidate`) and during build. */
export function shouldRevalidate(req: PayloadRequest): boolean {
  if (req.context?.['disableRevalidate']) return false;
  return process.env['NEXT_PHASE'] !== 'phase-production-build';
}

/**
 * Products: a publish, an unpublish, a slug change or a delete is visible; a draft autosave
 * is not. (An autosave on an already published document looks like an unpublish here and
 * regenerates too; harmless at this scale.)
 */
export const revalidateProducts: CollectionAfterChangeHook & CollectionAfterDeleteHook = ({
  doc,
  req,
  ...rest
}) => {
  if (!shouldRevalidate(req)) return doc;
  const status = (doc as { _status?: string } | undefined)?._status;
  const previous = (rest as { previousDoc?: { slug?: string; _status?: string } }).previousDoc;
  const wasPublished = previous?._status === 'published';
  if ('operation' in rest && status && status !== 'published' && !wasPublished) return doc;
  const slugs = new Set<string>();
  if (typeof doc?.['slug'] === 'string') slugs.add(doc['slug']);
  if (typeof previous?.slug === 'string') slugs.add(previous.slug);
  const paths = new Set([...slugs].flatMap((slug) => pathsForProduct(slug)));
  for (const path of paths) revalidatePath(path);
  return doc;
};

/** Globals: every static route (they all render the shell the globals feed). */
export const revalidateGlobal: GlobalAfterChangeHook = ({ doc, req }) => {
  if (!shouldRevalidate(req)) return doc;
  for (const path of STATIC_ROUTES) revalidatePath(path);
  return doc;
};
