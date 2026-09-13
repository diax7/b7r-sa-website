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
  /** Origin of the Umami script (`NEXT_PUBLIC_UMAMI_SRC`), added to script and connect. */
  umamiOrigin?: string | undefined;
  /** Next dev needs `eval` for React Refresh; never set in production builds. */
  allowEval?: boolean;
}

const GTM = 'https://www.googletagmanager.com';
const TURNSTILE = 'https://challenges.cloudflare.com';
const GA_HOSTS = ['https://*.google-analytics.com', 'https://*.analytics.google.com'];
const GA_REGION = 'https://region1.google-analytics.com';

function unique(values: Array<string | undefined>): string[] {
  return [...new Set(values.filter((v): v is string => Boolean(v)))];
}

export function contentSecurityPolicy({
  umamiOrigin,
  allowEval = false,
}: SecurityHeaderOptions = {}): string {
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
        umamiOrigin,
      ]),
    ],
    ['style-src', ["'self'", "'unsafe-inline'"]],
    ['img-src', ["'self'", 'data:', 'blob:', 'https://www.google-analytics.com', ...GA_HOSTS]],
    ['connect-src', unique(["'self'", ...GA_HOSTS, GA_REGION, umamiOrigin])],
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

/** Header routes for `next.config.ts`: security headers everywhere, the language on pages. */
export function headerRoutes(options: SecurityHeaderOptions = {}): HeaderRoute[] {
  return [
    { source: '/(.*)', headers: securityHeaders(options) },
    { source: PAGE_ROUTE_SOURCE, headers: [{ key: 'Content-Language', value: 'ar' }] },
  ];
}

/** Origin of a script URL, or undefined when unset or not a URL. */
export function originOf(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).origin;
  } catch {
    return undefined;
  }
}
