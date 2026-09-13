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
 * Every static route of the site: the globals feed the shell (header, footer, meta, the CTA
 * ribbon) of all of them, so any global change regenerates all at once; product pages
 * follow the timer.
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

/** Routes that list the FAQ entries: the home accordion, the FAQ page, the mini FAQ. */
export const PATHS_FOR_FAQS = ['/', '/faq', '/how-it-works'];

/** The product's own page plus the routes that list it. */
export function pathsForProduct(slug: string): string[] {
  return [`/products/${slug}`, ...PATHS_FOR_PRODUCTS];
}

/** Skips revalidation for the migration script (`context.disableRevalidate`) and during build. */
export function shouldRevalidate(req: PayloadRequest): boolean {
  if (req.context?.['disableRevalidate']) return false;
  return process.env['NEXT_PHASE'] !== 'phase-production-build';
}

let warnedOutsideRequest = false;

/** Reset for the unit tests only. */
export function resetRevalidateWarning(): void {
  warnedOutsideRequest = false;
}

/**
 * `revalidatePath` needs Next's request store: called from a job (the queue cron, a scheduled
 * publish) it throws the "static generation store missing" invariant. Outside a request the
 * 60 s timer covers the change, so the helper logs that once and moves on (ADR-033, 2b phase 3).
 */
export function safeRevalidatePath(path: string, logger: Pick<Console, 'info'> = console): void {
  try {
    revalidatePath(path);
  } catch (error) {
    // Anything else is a real failure and must surface.
    if (!(error instanceof Error) || !/store missing/i.test(error.message)) throw error;
    if (!warnedOutsideRequest) {
      warnedOutsideRequest = true;
      logger.info(
        `revalidatePath(${path}) skipped outside a request (${error.message}); the 60 s timer covers it.`,
      );
    }
  }
}

type ChangeArgs = {
  doc?: Record<string, unknown>;
  previousDoc?: Record<string, unknown>;
};

/**
 * A versioned document's change is visible when it is published now or was published
 * before (an unpublish, a slug change, a delete); a draft autosave or a draft delete of a
 * never-published document is not. Unversioned documents are always visible. (An autosave
 * on an already published document looks like an unpublish here and regenerates too;
 * harmless at this scale.)
 */
export function isVisibleChange({ doc, previousDoc }: ChangeArgs): boolean {
  const status = doc?.['_status'];
  if (typeof status !== 'string') return true;
  return status === 'published' || previousDoc?.['_status'] === 'published';
}

/**
 * Products: a publish, an unpublish, a slug change or a delete regenerates the product's page
 * and every route that lists it; a draft autosave is not visible.
 */
export const revalidateProducts: CollectionAfterChangeHook & CollectionAfterDeleteHook = ({
  doc,
  req,
  ...rest
}) => {
  if (!shouldRevalidate(req)) return doc;
  const previous = (rest as { previousDoc?: { slug?: string; _status?: string } }).previousDoc;
  if (!isVisibleChange({ doc, ...rest })) return doc;
  const slugs = new Set<string>();
  if (typeof doc?.['slug'] === 'string') slugs.add(doc['slug']);
  if (typeof previous?.slug === 'string') slugs.add(previous.slug);
  const paths = new Set([...slugs].flatMap((slug) => pathsForProduct(slug)));
  for (const path of paths) safeRevalidatePath(path);
  return doc;
};

/** The proxy's allowlist of top-level slugs (B0, ADR-032): published pages and redirect sources. */
export const SLUGS_ENDPOINT = '/api/pages/slugs';

/** A page's own route plus the sitemap and the proxy allowlist. */
export function pathsForPage(slug: string): string[] {
  return [`/${slug}`, '/sitemap.xml', SLUGS_ENDPOINT];
}

/**
 * Pages: a publish, an unpublish, a slug change or a delete regenerates the page, the sitemap
 * and the allowlist; a draft autosave of a never-published page is not visible.
 */
export const revalidatePages: CollectionAfterChangeHook & CollectionAfterDeleteHook = ({
  doc,
  req,
  ...rest
}) => {
  if (!shouldRevalidate(req)) return doc;
  const previous = (rest as { previousDoc?: { slug?: string } }).previousDoc;
  if (!isVisibleChange({ doc, ...rest })) return doc;
  const slugs = new Set<string>();
  if (typeof doc?.['slug'] === 'string') slugs.add(doc['slug']);
  if (typeof previous?.slug === 'string') slugs.add(previous.slug);
  const paths = new Set([...slugs].flatMap((slug) => pathsForPage(slug)));
  for (const path of paths) safeRevalidatePath(path);
  return doc;
};

/** A collection hook that regenerates fixed routes on every visible change or delete. */
export function revalidateRoutes(
  paths: readonly string[],
): CollectionAfterChangeHook & CollectionAfterDeleteHook {
  return ({ doc, req, ...rest }) => {
    if (!shouldRevalidate(req)) return doc;
    if (!isVisibleChange({ doc, ...rest })) return doc;
    for (const path of paths) safeRevalidatePath(path);
    return doc;
  };
}

/** Globals: every static route (they all render the shell the globals feed). */
export const revalidateGlobal: GlobalAfterChangeHook = ({ doc, previousDoc, req }) => {
  if (!shouldRevalidate(req)) return doc;
  if (!isVisibleChange({ doc, previousDoc })) return doc;
  for (const path of STATIC_ROUTES) safeRevalidatePath(path);
  return doc;
};
