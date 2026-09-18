/**
 * Response headers (BRD 8.10, amended in Phase 1c). Consumed by `next.config.ts` `headers()`
 * and unit-tested directly, so the policy the browser receives is the policy the test reads.
 *
 * No nonces (ADR-016): every page is static, so a per-response nonce is impossible without
 * dynamic rendering, and a nonce next to `'unsafe-inline'` would switch the latter off in
 * CSP3 browsers and break the inline scripts gtag injects. `style-src 'unsafe-inline'` is
 * required because `next/image fill`, `Reveal`, the hero and the dock all emit inline
 * `style` attributes.
 */
export interface HeaderEntry {
  key: string;
  value: string;
}

export interface HeaderRoute {
  source: string;
  headers: HeaderEntry[];
}

export interface SecurityHeaderOptions {
  /** Origin of the S3 public URL: the admin shows upload previews straight from storage. */
  mediaOrigin?: string | undefined;
  /** Next dev needs `eval` for React Refresh; never set in production builds. */
  allowEval?: boolean;
}

const GTM = 'https://www.googletagmanager.com';
const TURNSTILE = 'https://challenges.cloudflare.com';
const GA_HOSTS = ['https://*.google-analytics.com', 'https://*.analytics.google.com'];
const GA_REGION = 'https://region1.google-analytics.com';
/**
 * Where a Umami script and its events may live (ADR-052): Umami Cloud (its script and its
 * event gateway) or B7R's own Umami at umami.b7r.app (BRD 7.7). Exact hosts, never a
 * wildcard: a dangling subdomain must not become script on the site's origin. The admin's
 * Umami field accepts only these, so the policy never blocks a configured script; the policy
 * is static (ADR-016) and cannot follow an arbitrary URL. Another self-hosted Umami is one
 * line here.
 */
export const UMAMI_HOSTS = [
  'https://cloud.umami.is',
  'https://api-gateway.umami.dev',
  'https://umami.b7r.app',
] as const;
const UMAMI_SCRIPT_HOSTS = new Set(['cloud.umami.is', 'umami.b7r.app']);
/** Whether a Umami script URL is one the policy admits (a root-relative path is `'self'`). */
export function umamiSrcAllowed(src: string): boolean {
  if (/^\/[^/]/.test(src)) return true;
  try {
    const url = new URL(src);
    return url.protocol === 'https:' && UMAMI_SCRIPT_HOSTS.has(url.host);
  } catch {
    return false;
  }
}

function unique(values: Array<string | undefined>): string[] {
  return [...new Set(values.filter((v): v is string => Boolean(v)))];
}

export function contentSecurityPolicy({ allowEval = false }: SecurityHeaderOptions = {}): string {
  const directives: Array<[string, string[]]> = [
    ['default-src', ["'self'"]],
    [
      'script-src',
      unique([
        "'self'",
        "'unsafe-inline'",
        allowEval ? "'unsafe-eval'" : undefined,
        GTM,
        TURNSTILE,
        ...UMAMI_HOSTS,
      ]),
    ],
    ['style-src', ["'self'", "'unsafe-inline'"]],
    // GA's tag also reports through image pixels and fetches on googletagmanager.com (its
    // documented CSP asks for the host on both directives; WebKit took the pixel path first).
    ['img-src', ["'self'", 'data:', 'blob:', 'https://www.google-analytics.com', ...GA_HOSTS, GTM]],
    ['connect-src', unique(["'self'", ...GA_HOSTS, GA_REGION, GTM, ...UMAMI_HOSTS])],
    ['frame-src', [TURNSTILE]],
    ['font-src', ["'self'"]],
    ['media-src', ["'self'"]],
    ['object-src', ["'none'"]],
    ['base-uri', ["'self'"]],
    ['form-action', ["'self'"]],
    ['frame-ancestors', ["'none'"]],
  ];
  return directives.map(([name, values]) => `${name} ${values.join(' ')}`).join('; ');
}

/**
 * The admin (ADR-028): Payload's UI is one React app with inline styles, blob previews for
 * uploads, same-origin API calls and, from Phase 2b, the Turnstile widget on the login form.
 * No analytics, no third-party scripts.
 */
export function adminContentSecurityPolicy({
  mediaOrigin,
  allowEval = false,
}: SecurityHeaderOptions = {}): string {
  const directives: Array<[string, string[]]> = [
    ['default-src', ["'self'"]],
    [
      'script-src',
      unique(["'self'", "'unsafe-inline'", allowEval ? "'unsafe-eval'" : undefined, TURNSTILE]),
    ],
    ['style-src', ["'self'", "'unsafe-inline'"]],
    ['img-src', unique(["'self'", 'data:', 'blob:', mediaOrigin])],
    ['connect-src', unique(["'self'", mediaOrigin])],
    ['frame-src', [TURNSTILE]],
    ['font-src', ["'self'", 'data:']],
    ['media-src', ["'self'", 'blob:']],
    ['object-src', ["'none'"]],
    ['base-uri', ["'self'"]],
    ['form-action', ["'self'"]],
    ['frame-ancestors', ["'none'"]],
  ];
  return directives.map(([name, values]) => `${name} ${values.join(' ')}`).join('; ');
}

/** Every response under `/admin` and `/api/payload`: never indexed, never cached by a shared cache. */
export function adminHeaders(options: SecurityHeaderOptions = {}): HeaderEntry[] {
  return [
    { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
    { key: 'Cache-Control', value: 'private, no-store' },
    { key: 'Content-Security-Policy', value: adminContentSecurityPolicy(options) },
  ];
}

export function securityHeaders(options: SecurityHeaderOptions = {}): HeaderEntry[] {
  return [
    // `preload` commits every future *.b7r.sa subdomain to HTTPS (RUNBOOK notes this).
    {
      key: 'Strict-Transport-Security',
      value: 'max-age=63072000; includeSubDomains; preload',
    },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Content-Security-Policy', value: contentSecurityPolicy(options) },
  ];
}

/** Page routes only: not the API, not Next internals, not files with an extension. */
export const PAGE_ROUTE_SOURCE = '/((?!api/|_next/|.*\\..*).*)';

/** The English document and its routes (ADR-043): `/en` and `/en/anything`. */
export const ENGLISH_ROUTE_SOURCES = ['/en', '/en/:path*'];

/** The CMS surfaces (ADR-028); later routes override earlier ones for the same header key. */
export const ADMIN_ROUTE_SOURCES = ['/admin/:path*', '/api/payload/:path*'];

/**
 * Header routes for `next.config.ts`: security headers everywhere, the language on pages,
 * the admin set on the CMS surfaces.
 */
/** The self-hosted font files never change under their names: cache them for a year. */
export const FONT_CACHE: HeaderEntry = {
  key: 'Cache-Control',
  value: 'public, max-age=31536000, immutable',
};

/**
 * The Open Graph renders, the app icons and the brand and product images keep their names
 * across deploys, so a day is the cache (site audit 2026-09-18, item 16); Next's default for
 * `public/` is `max-age=0`.
 */
export const IMAGE_CACHE: HeaderEntry = { key: 'Cache-Control', value: 'public, max-age=86400' };
export const IMAGE_ROUTE_SOURCES = ['/og/:path*', '/icons/:path*', '/images/:path*'];

export function headerRoutes(options: SecurityHeaderOptions = {}): HeaderRoute[] {
  return [
    { source: '/(.*)', headers: securityHeaders(options) },
    { source: PAGE_ROUTE_SOURCE, headers: [{ key: 'Content-Language', value: 'ar' }] },
    ...ENGLISH_ROUTE_SOURCES.map((source) => ({
      source,
      headers: [{ key: 'Content-Language', value: 'en' }],
    })),
    // Without this Next answers `max-age=0` for /public files and every admin navigation
    // re-validates the brand font, which shows as a font swap on each page (ADR-039).
    { source: '/fonts/:path*', headers: [FONT_CACHE] },
    ...IMAGE_ROUTE_SOURCES.map((source) => ({ source, headers: [IMAGE_CACHE] })),
    ...ADMIN_ROUTE_SOURCES.map((source) => ({ source, headers: adminHeaders(options) })),
  ];
}
