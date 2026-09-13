import { goneHtml } from '@/lib/gone-page';
import { isGone } from '@/lib/redirects';

/**
 * Retired WordPress URLs answer 410 Gone (BRD 5.2, ADR-017): `next.config` redirects cannot
 * emit 410, so this proxy does. The matcher is limited to those patterns, so pages and
 * `_next/static` never pass through here. It mirrors `GONE_MATCHER` in `src/lib/redirects.ts`
 * as literals because Next reads `config` statically (`tests/redirects.test.ts` keeps them equal).
 */
export function proxy(request: Request) {
  const { pathname } = new URL(request.url);
  if (!isGone(pathname)) return undefined;
  return new Response(goneHtml(), {
    status: 410,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}

export const config = {
  matcher: [
    '/team',
    '/our_services',
    '/under-construction',
    '/demo-design-system',
    '/hello-world',
    '/feed',
    '/wp-login.php',
    '/xmlrpc.php',
    '/post001',
    '/post002',
    '/post003',
    '/post004',
    '/post005',
    '/post006',
    '/post007',
    '/post008',
    '/post009',
    '/post010',
    '/post011',
    '/post012',
    '/specialists/:path*',
    '/project/:path*',
    '/project-category/:path*',
    '/services/:path*',
    '/category/:path*',
    '/wp-content/:path*',
    '/wp-admin/:path*',
    '/wp-json/:path*',
  ],
};
