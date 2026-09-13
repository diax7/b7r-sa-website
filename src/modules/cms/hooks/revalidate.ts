import { revalidatePath, revalidateTag } from 'next/cache';
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
  PayloadRequest,
} from 'payload';

/** Cache tags the site's data layer reads with (`src/lib/cms/*`). */
export const CACHE_TAGS = {
  products: 'products',
  siteSettings: 'site-settings',
  navigation: 'navigation',
  seo: 'seo',
} as const;

/** Routes that read each source; `/` and `/sitemap.xml` are included where relevant. */
export function pathsForProduct(slug: string): string[] {
  return ['/', '/products', `/products/${slug}`, '/sitemap.xml'];
}

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

function revalidate(tag: string, paths: string[]): void {
  revalidateTag(tag, 'max');
  for (const path of new Set(paths)) revalidatePath(path);
}

/** Products: the document's page, the listing, the home (strip + designer) and the sitemap. */
export const revalidateProducts: CollectionAfterChangeHook & CollectionAfterDeleteHook = ({
  doc,
  req,
  ...rest
}) => {
  if (!shouldRevalidate(req)) return doc;
  const slugs = new Set<string>();
  if (typeof doc?.['slug'] === 'string') slugs.add(doc['slug']);
  const previous = (rest as { previousDoc?: { slug?: string } }).previousDoc;
  if (typeof previous?.slug === 'string') slugs.add(previous.slug);
  // Only a published change is visible; a draft autosave must not churn the cache.
  const status = (doc as { _status?: string } | undefined)?._status;
  if ('operation' in rest && status && status !== 'published') return doc;
  revalidate(
    CACHE_TAGS.products,
    [...slugs].flatMap((slug) => pathsForProduct(slug)),
  );
  return doc;
};

/** Globals: their own tag plus every route that renders them. */
export function revalidateGlobal(slug: string, tag: string): GlobalAfterChangeHook {
  return ({ doc, req }) => {
    if (!shouldRevalidate(req)) return doc;
    revalidate(tag, PATHS_FOR_GLOBAL[slug] ?? ['/']);
    return doc;
  };
}
