import { expect, test } from '@playwright/test';

/** BRD 5.2 / Appendix C: old URL → final URL. First hop is Next's 308 (trailing slash) or our 301. */
const REDIRECTS: Array<[string, string]> = [
  ['/about/', '/about'],
  ['/showcase/', '/products'],
  ['/showcase', '/products'],
  ['/contact/', '/contact'],
  ['/terms-conditions/', '/terms'],
  ['/shipping/', '/shipping'],
  ['/privacy-policy/', '/privacy'],
  ['/blog/', '/blog'],
  ['/home-2/', '/'],
];

const GONE = [
  '/team/',
  '/our_services/',
  '/under-construction/',
  '/demo-design-system/',
  '/specialists/anyone',
  '/project/x',
  '/project-category/y',
  '/services/z',
  '/category/c',
  '/post001/',
  '/post012',
  '/hello-world/',
  '/feed/',
  '/wp-content/uploads/2020/a.jpg',
  '/wp-admin/',
  '/wp-json/wp/v2/posts',
  '/wp-login.php',
  '/xmlrpc.php',
];

test.describe('redirects and 410s (BRD 5.2)', () => {
  test.skip(({ browserName, isMobile }) => browserName !== 'chromium' || isMobile, 'one project');

  for (const [from, to] of REDIRECTS) {
    test(`${from} lands on ${to} with a permanent first hop`, async ({ request }) => {
      const first = await request.get(from, { maxRedirects: 0 });
      expect([301, 308]).toContain(first.status());
      const final = await request.get(from);
      expect(final.status()).toBe(200);
      expect(new URL(final.url()).pathname).toBe(to);
    });
  }

  for (const path of GONE) {
    test(`${path} is 410 Gone`, async ({ request }) => {
      const res = await request.get(path);
      expect(res.status()).toBe(410);
      expect(res.headers()['content-type']).toContain('text/html');
      expect(res.headers()['cache-control']).toContain('max-age=86400');
      const html = await res.text();
      expect(html).toContain('<html lang="ar" dir="rtl">');
      expect(html).toContain('noindex');
    });
  }

  test('unknown routes stay 404, not 410 and not a soft 200', async ({ request }) => {
    for (const path of ['/post013', '/teams', '/services-x', '/indexnow/nope.txt']) {
      expect((await request.get(path)).status(), path).toBe(404);
    }
  });
});
