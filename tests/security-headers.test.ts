import { describe, expect, it } from 'vitest';
import {
  ADMIN_ROUTE_SOURCES,
  adminContentSecurityPolicy,
  adminHeaders,
  contentSecurityPolicy,
  FONT_CACHE,
  headerRoutes,
  originOf,
  PAGE_ROUTE_SOURCE,
  securityHeaders,
} from '@/lib/security-headers';

function directive(csp: string, name: string): string[] {
  const entry = csp.split('; ').find((d) => d.startsWith(`${name} `));
  if (!entry) throw new Error(`${name} missing from CSP`);
  return entry.slice(name.length + 1).split(' ');
}

describe('content security policy (BRD 8.10, ADR-016)', () => {
  const csp = contentSecurityPolicy({ umamiOrigin: 'https://umami.b7r.app' });

  it('allows inline styles: next/image fill and the motion primitives emit style attributes', () => {
    expect(directive(csp, 'style-src')).toEqual(["'self'", "'unsafe-inline'"]);
  });

  it('allows the three script origins plus inline, never eval in production', () => {
    expect(directive(csp, 'script-src')).toEqual([
      "'self'",
      "'unsafe-inline'",
      'https://www.googletagmanager.com',
      'https://challenges.cloudflare.com',
      'https://umami.b7r.app',
    ]);
    expect(csp).not.toContain("'unsafe-eval'");
  });

  it('adds eval only for the dev server', () => {
    expect(directive(contentSecurityPolicy({ allowEval: true }), 'script-src')).toContain(
      "'unsafe-eval'",
    );
  });

  it('lets GA and Umami connect and the designer use blob images', () => {
    expect(directive(csp, 'connect-src')).toEqual([
      "'self'",
      'https://*.google-analytics.com',
      'https://*.analytics.google.com',
      'https://region1.google-analytics.com',
      'https://umami.b7r.app',
    ]);
    expect(directive(csp, 'img-src')).toEqual(
      expect.arrayContaining(["'self'", 'data:', 'blob:', 'https://www.google-analytics.com']),
    );
  });

  it('carries the hardening directives', () => {
    expect(directive(csp, 'default-src')).toEqual(["'self'"]);
    expect(directive(csp, 'object-src')).toEqual(["'none'"]);
    expect(directive(csp, 'base-uri')).toEqual(["'self'"]);
    expect(directive(csp, 'form-action')).toEqual(["'self'"]);
    expect(directive(csp, 'frame-ancestors')).toEqual(["'none'"]);
    expect(directive(csp, 'frame-src')).toEqual(['https://challenges.cloudflare.com']);
    expect(directive(csp, 'font-src')).toEqual(["'self'"]);
    expect(directive(csp, 'media-src')).toEqual(["'self'"]);
  });

  it('does not repeat an Umami origin that is already self', () => {
    const local = contentSecurityPolicy({ umamiOrigin: undefined });
    expect(directive(local, 'connect-src')).toHaveLength(4);
  });
});

describe('security headers', () => {
  const headers = Object.fromEntries(securityHeaders().map((h) => [h.key, h.value]));

  it('sets HSTS with preload, nosniff, referrer, permissions and frame options', () => {
    expect(headers['Strict-Transport-Security']).toBe(
      'max-age=63072000; includeSubDomains; preload',
    );
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['Permissions-Policy']).toBe('camera=(), microphone=(), geolocation=()');
    expect(headers['X-Frame-Options']).toBe('DENY');
    expect(headers['Content-Security-Policy']).toContain("default-src 'self'");
  });

  it('applies Content-Language to pages only', () => {
    const routes = headerRoutes();
    expect(routes[0]?.source).toBe('/(.*)');
    expect(routes[1]).toEqual({
      source: PAGE_ROUTE_SOURCE,
      headers: [{ key: 'Content-Language', value: 'ar' }],
    });
    const pageOnly = new RegExp(`^${PAGE_ROUTE_SOURCE.replace(/^\//, '/')}$`);
    for (const page of ['/', '/products', '/products/hoodie', '/blog/a-post']) {
      expect(pageOnly.test(page), page).toBe(true);
    }
    for (const notPage of ['/api/health', '/_next/static/x.js', '/robots.txt', '/og/a.png']) {
      expect(pageOnly.test(notPage), notPage).toBe(false);
    }
  });
});

describe('admin headers (ADR-028)', () => {
  const csp = adminContentSecurityPolicy({ mediaOrigin: 'https://media.b7r.sa' });

  it('allows no third-party script or connection besides Turnstile', () => {
    expect(directive(csp, 'script-src')).toEqual([
      "'self'",
      "'unsafe-inline'",
      'https://challenges.cloudflare.com',
    ]);
    expect(directive(csp, 'connect-src')).toEqual(["'self'", 'https://media.b7r.sa']);
    expect(csp).not.toContain('googletagmanager');
    expect(csp).not.toContain("'unsafe-eval'");
  });

  it('lets upload previews come from storage, blobs and data URLs', () => {
    expect(directive(csp, 'img-src')).toEqual(["'self'", 'data:', 'blob:', 'https://media.b7r.sa']);
    expect(directive(csp, 'media-src')).toEqual(["'self'", 'blob:']);
    expect(directive(adminContentSecurityPolicy(), 'img-src')).toEqual([
      "'self'",
      'data:',
      'blob:',
    ]);
  });

  it('keeps the hardening directives of the site policy', () => {
    for (const name of ['object-src', 'base-uri', 'form-action', 'frame-ancestors']) {
      expect(directive(csp, name)).toEqual(directive(contentSecurityPolicy(), name));
    }
  });

  it('marks the admin and its API noindex and uncacheable, on both sources', () => {
    const headers = Object.fromEntries(adminHeaders().map((h) => [h.key, h.value]));
    expect(headers['X-Robots-Tag']).toBe('noindex, nofollow');
    expect(headers['Cache-Control']).toBe('private, no-store');
    expect(headers['Content-Security-Policy']).toContain("default-src 'self'");
    const routes = headerRoutes();
    const adminRoutes = routes.filter((r) => ADMIN_ROUTE_SOURCES.includes(r.source));
    expect(adminRoutes.map((r) => r.source)).toEqual(['/admin/:path*', '/api/payload/:path*']);
    // Later routes win for the same key, so the admin set must follow the site-wide set.
    expect(routes.indexOf(adminRoutes[0]!)).toBeGreaterThan(
      routes.findIndex((r) => r.source === '/(.*)'),
    );
  });
});

describe('originOf', () => {
  it('reduces a script URL to its origin and ignores junk', () => {
    expect(originOf('https://umami.b7r.app/script.js')).toBe('https://umami.b7r.app');
    expect(originOf('http://localhost:3004/umami-test.js')).toBe('http://localhost:3004');
    expect(originOf('')).toBeUndefined();
    expect(originOf('nope')).toBeUndefined();
  });
});

describe('font files', () => {
  it('are cached for a year under their fixed names (ADR-039: no font swap per admin page)', () => {
    const route = headerRoutes().find((r) => r.source === '/fonts/:path*');
    expect(route?.headers).toContainEqual(FONT_CACHE);
    expect(FONT_CACHE.value).toContain('immutable');
  });
});
