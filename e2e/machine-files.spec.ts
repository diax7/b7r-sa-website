import { createHash } from 'node:crypto';
import { expect, test } from '@playwright/test';

test.describe('machine files (BRD 7.2, 7.3, 7.5, 7.6)', () => {
  test.skip(({ browserName, isMobile }) => browserName !== 'chromium' || isMobile, 'one project');

  test('sitemap lists every indexable route with timestamps and product images', async ({
    request,
  }) => {
    const res = await request.get('/sitemap.xml');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('xml');
    const xml = await res.text();
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    for (const path of [
      '',
      '/products',
      '/products/hoodie',
      '/how-it-works',
      '/about',
      '/contact',
      '/faq',
      '/blog',
      '/blog/how-to-price-printed-tshirt-saudi',
      '/terms',
      '/shipping',
      '/privacy',
    ]) {
      expect(locs, path).toContain(`https://b7r.sa${path}`);
    }
    expect(locs.some((l) => l?.includes('/api') || l?.includes('?'))).toBe(false);
    expect(xml).toMatch(/<lastmod>\d{4}-\d{2}-\d{2}T00:00:00\.000Z<\/lastmod>/);
    // Product photos come from the CMS: same-origin `/api/payload/media/file/...` with local
    // storage, an absolute S3 URL when S3 is configured (ADR-029).
    expect(xml).toMatch(/<image:loc>https?:\/\/[^<]+\/hoodie-black-front\.jpg<\/image:loc>/);
  });

  test('an empty hub is noindex, follow and out of the sitemap; a hub with posts is listed', async ({
    request,
  }) => {
    // The seed puts posts in three of the six hubs; seasons has none (site audit 2026-09-18,
    // item 10). The robots meta is `noindex, nofollow` everywhere off the production origin,
    // so the `follow` variant is asserted only when the build runs as https://b7r.sa (CI).
    const xml = await (await request.get('/sitemap.xml')).text();
    expect(xml).toContain('<loc>https://b7r.sa/blog/category/pricing-profit</loc>');
    expect(xml).not.toContain('<loc>https://b7r.sa/blog/category/seasons</loc>');
    const robots = await (await request.get('/robots.txt')).text();
    if (!robots.includes('Sitemap: https://b7r.sa/sitemap.xml')) return;
    const empty = await (await request.get('/blog/category/seasons')).text();
    expect(empty).toContain('<meta name="robots" content="noindex, follow"/>');
    const full = await (await request.get('/blog/category/pricing-profit')).text();
    expect(full).toContain(
      '<meta name="robots" content="index, follow, max-image-preview:large"/>',
    );
  });

  test('robots.txt disallows everything on a non-production host', async ({ request }) => {
    // Local builds leave NEXT_PUBLIC_SITE_URL unset; CI sets the production origin and checks
    // the full rule set in the Lighthouse SEO audit instead.
    const res = await request.get('/robots.txt');
    expect(res.status()).toBe(200);
    const text = await res.text();
    const production = text.includes('Sitemap: https://b7r.sa/sitemap.xml');
    if (production) {
      expect(text).toContain('Disallow: /api/');
      expect(text).toContain('Disallow: /*?q=');
      expect(text).toContain('User-Agent: OAI-SearchBot');
      expect(text).toContain('User-Agent: PerplexityBot');
    } else {
      expect(text).toContain('Disallow: /');
      expect(text).not.toContain('Sitemap:');
    }
  });

  test('manifest is Arabic, RTL and points at the icon set', async ({ request }) => {
    const res = await request.get('/manifest.webmanifest');
    expect(res.status()).toBe(200);
    const manifest = (await res.json()) as {
      name: string;
      lang: string;
      dir: string;
      display: string;
      theme_color: string;
      icons: Array<{ src: string; sizes: string }>;
    };
    expect(manifest.name).toBe('بحر برنت');
    expect(manifest.lang).toBe('ar');
    expect(manifest.dir).toBe('rtl');
    expect(manifest.display).toBe('browser');
    expect(manifest.theme_color.toLowerCase()).toBe('#0058b0');
    for (const icon of manifest.icons) {
      expect((await request.get(icon.src)).status(), icon.src).toBe(200);
    }
    for (const path of ['/favicon.ico', '/og/default.png', '/og/products/hoodie.png']) {
      expect((await request.get(path)).status(), path).toBe(200);
    }
  });

  // The key is derived from PAYLOAD_SECRET (ADR-052): its file answers, any other name is a
  // 404, and health says "off" because a ping happens only on the production runtime.
  test('the IndexNow key file answers at the derived name only; health says off outside production', async ({
    request,
  }) => {
    const health = (await (await request.get('/api/health')).json()) as { indexnow: string };
    expect(health.indexnow).toBe('off');
    expect((await request.get('/indexnow/anything.txt')).status()).toBe(404);
    expect((await request.get('/indexnow/a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4.txt')).status()).toBe(
      404,
    );
    const secret = process.env['PAYLOAD_SECRET'];
    test.skip(!secret, 'the derived key needs the secret in the test process');
    const key = createHash('sha256').update(`indexnow:${secret}`).digest('hex').slice(0, 32);
    const file = await request.get(`/indexnow/${key}.txt`);
    expect(file.status()).toBe(200);
    expect(await file.text()).toBe(key);
  });

  test('every page carries OG, Twitter and canonical tags; the home page an absolute title', async ({
    request,
  }) => {
    const html = await (await request.get('/products/hoodie')).text();
    expect(html).toContain('<meta property="og:type" content="website"');
    expect(html).toContain('<meta property="og:locale" content="ar_SA"');
    expect(html).toContain(
      '<meta property="og:image" content="https://b7r.sa/og/products/hoodie.png"',
    );
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image"');
    expect(html).toContain('<title>هودي للطباعة عند الطلب | بحر برنت</title>');
    const home = await (await request.get('/')).text();
    expect(home).toContain('<title>بحر برنت: منصة الطباعة عند الطلب في السعودية</title>');
    const post = await (await request.get('/blog/how-to-price-printed-tshirt-saudi')).text();
    expect(post).toContain('<meta property="og:type" content="article"');
    expect(post).toMatch(/<meta property="article:published_time" content="2026-09-13/);
    expect(post).toContain('<link rel="alternate" type="application/rss+xml"');
  });
});
