import { RESERVED_PAGE_SLUGS } from '@/content/schema';
import type { Locale } from '@/lib/i18n';

/**
 * Top-level path segments the code owns (B0, ADR-032): the `(site)` route folders, the CMS,
 * the metadata routes and the asset folders. Anything else at the top level is a `pages`
 * slug candidate, and the proxy decides between the page and the global 404. The proxy runs
 * on every page request (`PROXY_MATCHER`, ADR-048) and this list is what `localeSlug()`
 * reads at runtime; `tests/site-routes.test.ts` keeps it and the `(site)` folders identical.
 */
export const CODE_TOP_LEVEL = [
  ...RESERVED_PAGE_SLUGS,
  'products',
  'blog',
  'author',
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

/**
 * The proxy's one matcher (Next reads `config` statically, so this is a literal there too):
 * every request but the API, the admin, Next's own files and the asset folders. The page
 * logic and the crawler count decide the rest at runtime.
 */
export const PROXY_MATCHER = '/((?!(?:api|_next|media|images|fonts|og|video)(?:/|$)).*)';

/** Payload's admin route (`routes.admin` in the CMS config); the proxy strips `?locale=` under it. */
export const ADMIN_PREFIX = '/admin';

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

/**
 * A slug candidate in either locale: `/creators` → `{ ar, creators }`, `/en/creators` →
 * `{ en, creators }`; null for the code-owned segments, files and deeper paths.
 */
export function localeSlug(pathname: string): { locale: Locale; slug: string } | null {
  if (pathname === '/en' || pathname.startsWith('/en/')) {
    const rest = pathname === '/en' ? '/' : pathname.slice(3);
    const slug = topLevelSlug(rest);
    return slug === null ? null : { locale: 'en', slug };
  }
  const slug = topLevelSlug(pathname);
  return slug === null ? null : { locale: 'ar', slug };
}

/** Whether a path is under the English prefix (`/en`, `/en/anything`). */
export function isEnglishPath(pathname: string): boolean {
  return pathname === '/en' || pathname.startsWith('/en/');
}
