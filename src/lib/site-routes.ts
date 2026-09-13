import { RESERVED_PAGE_SLUGS } from '@/content/schema';

/**
 * Top-level path segments the code owns (B0, ADR-032): the `(site)` route folders, the CMS,
 * the metadata routes and the asset folders. Anything else at the top level is a `pages`
 * slug candidate, and the proxy decides between the page and the global 404. The matcher in
 * `src/proxy.ts` repeats this list as a literal (Next reads `config` statically);
 * `tests/site-routes.test.ts` keeps the two — and the `(site)` folders — identical.
 */
export const CODE_TOP_LEVEL = [
  ...RESERVED_PAGE_SLUGS,
  'products',
  'blog',
  'admin',
  'api',
  '_next',
  'og',
  'images',
  'fonts',
  'media',
  'video',
  '__404',
  'en',
] as const;

/** The regex segment of the proxy matcher: one segment that is none of the above and has no dot. */
export const SLUG_MATCHER = `/((?!(?:${CODE_TOP_LEVEL.join('|')})$)(?!.*\\.)[^/]+)`;

/** The path the proxy rewrites an unknown slug to: no route matches it, so Next renders the global 404. */
export const NOT_FOUND_PREFIX = '/__404/';

/** A top-level slug candidate (`/creators`), or null for anything else. */
export function topLevelSlug(pathname: string): string | null {
  const match = /^\/([^/]+)\/?$/.exec(pathname);
  if (!match) return null;
  const slug = match[1] ?? '';
  if (slug.includes('.')) return null;
  return (CODE_TOP_LEVEL as readonly string[]).includes(slug) ? null : slug;
}
