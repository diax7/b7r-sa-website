/**
 * Old WordPress URLs (BRD 5.2, Appendix C). Kept as data so Level 2 can move the map into
 * the admin. Sources carry no trailing slash: with `trailingSlash: false` Next answers
 * `/showcase/` with its own 308 to `/showcase` before custom redirects run, so `/showcase`
 * is the only form that needs an entry (e2e asserts first hop ∈ {301, 308} + final URL).
 */
export interface Redirect {
  source: string;
  destination: string;
  /** Explicit codes: the BRD says 301/302, and Next's `permanent` flag would emit 308/307. */
  statusCode: 301 | 302;
}

/** Renamed pages: 301. */
export const renamed: Redirect[] = [
  { source: '/showcase', destination: '/products', statusCode: 301 },
  { source: '/terms-conditions', destination: '/terms', statusCode: 301 },
  { source: '/privacy-policy', destination: '/privacy', statusCode: 301 },
  { source: '/home-2', destination: '/', statusCode: 301 },
];

/** Old paths whose only change is the trailing slash; Next's own 308 resolves them. */
export const slashOnly = ['/about', '/contact', '/shipping', '/blog'];

/** `/en/*` is reserved for the English phase: 302 to the Arabic route until it exists. */
export const english: Redirect[] = [
  { source: '/en', destination: '/', statusCode: 302 },
  { source: '/en/:path*', destination: '/:path*', statusCode: 302 },
];

/** Everything `next.config.ts` `redirects()` returns, in order (`/en` exact before the glob). */
export function redirectRules(): Redirect[] {
  return [...renamed, ...english];
}

/** Exact old paths that are gone for good (HTTP 410). */
export const goneExact = [
  '/team',
  '/our_services',
  '/under-construction',
  '/demo-design-system',
  '/hello-world',
  '/feed',
  '/wp-login.php',
  '/xmlrpc.php',
  ...Array.from({ length: 12 }, (_, i) => `/post${String(i + 1).padStart(3, '0')}`),
];

/** Old prefixes (`/services/*`): the prefix itself and anything below it are gone. */
export const gonePrefixes = [
  '/specialists',
  '/project',
  '/project-category',
  '/services',
  '/category',
  '/wp-content',
  '/wp-admin',
  '/wp-json',
];

/**
 * The `config.matcher` for `src/proxy.ts`, in path-to-regexp form. Next reads that array
 * statically, so `proxy.ts` repeats it as literals; `tests/redirects.test.ts` asserts the two
 * lists are identical.
 */
export const GONE_MATCHER = [...goneExact, ...gonePrefixes.map((p) => `${p}/:path*`)];

/** Mirrors `GONE_MATCHER` at runtime; the proxy's matcher is a build-time filter only. */
export function isGone(pathname: string): boolean {
  const path = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  if (goneExact.includes(path)) return true;
  return gonePrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}
