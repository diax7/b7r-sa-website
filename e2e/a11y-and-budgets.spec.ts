import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('status pages', () => {
  test('unknown routes return HTTP 404 with the BRD copy and no ribbon', async ({ page }) => {
    const res = await page.goto('/this-page-does-not-exist');
    expect(res?.status()).toBe(404);
    await expect(page.locator('h1')).toHaveText('الصفحة غير موجودة');
    await expect(page.getByRole('link', { name: 'العودة للرئيسية' })).toHaveAttribute('href', '/');
    await expect(page.locator('[aria-labelledby="cta-ribbon-title"]')).toHaveCount(0);
  });

  test('an unknown top-level URL is a full 404 document in the raw HTML (B0, ADR-032)', async ({
    request,
  }) => {
    for (const path of ['/no-such-page', '/nope-123', '/nope_123']) {
      const res = await request.get(path);
      expect(res.status(), path).toBe(404);
      const html = await res.text();
      expect(html, path).toContain('<html lang="ar" dir="rtl"');
      expect(html, path).not.toContain('__next_error__');
      expect(html, path).toContain('<h1 class="text-h1">الصفحة غير موجودة</h1>');
      for (const landmark of ['<header', '<main', '<footer'])
        expect(html, path).toContain(landmark);
      expect(html, path).not.toContain('cta-ribbon-title');
    }
  });

  test('an unknown product slug is a 404 that still shows the site shell once hydrated', async ({
    page,
  }) => {
    // notFound() from a page answers from a bare document; the client renders the
    // not-found view inside the site layout (ADR-024).
    const res = await page.goto('/products/this-product-does-not-exist');
    expect(res?.status()).toBe(404);
    await expect(page.locator('h1')).toHaveText('الصفحة غير موجودة');
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('contentinfo')).toBeVisible();
    await expect(page.locator('main#content')).toBeVisible();
  });

  test('health endpoint reports ok and a version', async ({ request }) => {
    const res = await request.get('/api/health');
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { ok: boolean; version: string };
    expect(body.ok).toBe(true);
    expect(body.version).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

test.describe('accessibility (BRD 3.13)', () => {
  for (const path of ['/', '/this-page-does-not-exist']) {
    test(`axe reports no serious or critical violations on ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('load');
      if (path === '/') {
        // Mount the lazy islands (designer, video loop, widgets) so they are inside the scan.
        await page.locator('#designer').scrollIntoViewIfNeeded();
        await page.waitForSelector('[data-designer-island] canvas', { timeout: 15_000 });
        await page.locator('#video').scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        await page.evaluate(() => window.scrollTo(0, 0));
      }
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
        .analyze();
      const serious = results.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical',
      );
      expect(
        serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
      ).toEqual([]);
    });
  }
});

test.describe('budgets (BRD 7.8, constitution IV)', () => {
  test('home JS (without the lazy designer chunk), fonts and LCP image stay within budget', async ({
    page,
    isMobile,
  }) => {
    const js: Array<{ url: string; bytes: number }> = [];
    const css: Array<{ url: string; bytes: number }> = [];
    const fonts: Array<{ url: string; bytes: number }> = [];
    const hero: Array<{ url: string; bytes: number }> = [];
    // The budget is the home route's own JS (BRD 7.8). Next prefetches the routes linked in
    // the viewport (header, footer) after load and preloads their chunks; those belong to
    // the next navigation, so the RSC prefetch requests are blocked for this measurement.
    await page.route('**/*', (route) => {
      const headers = route.request().headers();
      if (headers['next-router-prefetch'] || headers['rsc']) return route.abort();
      return route.continue();
    });
    page.on('response', async (r) => {
      const url = r.url();
      const type = r.request().resourceType();
      try {
        const sizes = await r.request().sizes();
        const bytes = sizes.responseBodySize;
        if (type === 'script') js.push({ url, bytes });
        if (type === 'stylesheet') css.push({ url, bytes });
        if (url.includes('/fonts/')) fonts.push({ url, bytes });
        // The hero photos are CMS media (seeded as hero-set-*.jpg, ADR-031).
        if (/hero-set-[ab]-(desktop|mobile)/.test(url)) hero.push({ url, bytes });
      } catch {
        // Cached or aborted responses have no sizes; ignore.
      }
    });
    await page.goto('/');
    await page.waitForLoadState('load');
    await page.waitForTimeout(1500);

    const jsTotal = js.reduce((n, r) => n + r.bytes, 0);
    expect(jsTotal, js.map((r) => `${r.bytes}\t${r.url}`).join('\n')).toBeLessThanOrEqual(
      180 * 1024,
    );
    // The admin has its own stylesheet (ADR-039); the site's must not grow with it.
    const cssTotal = css.reduce((n, r) => n + r.bytes, 0);
    expect(cssTotal, css.map((r) => `${r.bytes}\t${r.url}`).join('\n')).toBeLessThanOrEqual(
      80 * 1024,
    );
    for (const f of fonts) expect(f.bytes, f.url).toBeLessThanOrEqual(40 * 1024);
    expect(fonts.length).toBeGreaterThanOrEqual(2);
    expect(hero.length).toBe(1);
    expect(hero[0]!.bytes, hero[0]!.url).toBeLessThanOrEqual(220 * 1024);
    // Konva must not be part of the initial payload (chunk names are hashed, so check the global).
    expect(await page.evaluate(() => typeof (window as { Konva?: unknown }).Konva)).toBe(
      'undefined',
    );
    test.info().annotations.push({
      type: 'js-bytes',
      description: `${jsTotal} (${isMobile ? 'mobile' : 'desktop'})`,
    });
  });

  test('the blog index prerenders and its search island stays small (ADR-041)', async ({
    page,
    context,
  }) => {
    const res = await page.request.get('/blog');
    expect(res.headers()['x-nextjs-cache']).toMatch(/HIT|STALE/);
    // The scripts a route loads, by URL, without the prefetches of the next navigation.
    const scripts = async (path: string) => {
      const tab = await context.newPage();
      const js = new Map<string, number>();
      await tab.route('**/*', (route) => {
        const headers = route.request().headers();
        if (headers['next-router-prefetch'] || headers['rsc']) return route.abort();
        return route.continue();
      });
      tab.on('response', async (r) => {
        if (r.request().resourceType() !== 'script') return;
        try {
          js.set(r.url(), (await r.request().sizes()).responseBodySize);
        } catch {
          // Cached or aborted responses have no sizes; ignore.
        }
      });
      await tab.goto(path);
      await tab.waitForLoadState('load');
      await tab.waitForTimeout(1500);
      await tab.close();
      return js;
    };
    const home = await scripts('/');
    const blog = await scripts('/blog');
    const total = [...blog.values()].reduce((n, b) => n + b, 0);
    expect(total).toBeLessThanOrEqual(180 * 1024);
    // What the blog loads beyond the shared chunks the home already needs: the route, the
    // search island (measured at 1.9 KB on 2026-09-14) and, since the header logo became a
    // static file (ADR-064), next/image's client runtime, which left the layout's shared
    // chunk for the chunk of every route that renders a photo (about 8 KB gzipped here,
    // 10.2 KB together on 2026-09-20). The island must stay a small thing.
    const own = [...blog].filter(([url]) => !home.has(url));
    const ownBytes = own.reduce((n, [, b]) => n + b, 0);
    expect(ownBytes, own.map(([url, b]) => `${b}\t${url}`).join('\n')).toBeLessThanOrEqual(
      12 * 1024,
    );
  });

  test('the contact page stays within budget and its booking picker is out of the first paint (ADR-062)', async ({
    page,
    baseURL,
  }) => {
    const js: Array<{ url: string; bytes: number }> = [];
    await page.route('**/*', (route) => {
      const headers = route.request().headers();
      if (headers['next-router-prefetch'] || headers['rsc']) return route.abort();
      return route.continue();
    });
    page.on('response', async (r) => {
      // Our own chunks: the Turnstile script is Cloudflare's and the analytics stub the test's.
      if (r.request().resourceType() !== 'script' || !r.url().includes('/_next/static/')) return;
      try {
        js.push({ url: r.url(), bytes: (await r.request().sizes()).responseBodySize });
      } catch {
        // Cached or aborted responses have no sizes; ignore.
      }
    });
    await page.goto('/contact');
    await page.waitForLoadState('load');
    await page.waitForTimeout(1500);
    const total = js.reduce((n, r) => n + r.bytes, 0);
    // Measured at 207 KB on 2026-09-19, before and after the picker: the form's split chunk
    // hydrates with the page, the picker's loader is a few lines, the island never loads here.
    expect(total, js.map((r) => `${r.bytes}\t${r.url}`).join('\n')).toBeLessThanOrEqual(215 * 1024);
    // The island is a dynamic import: no script the server HTML references carries it.
    const html = await (await page.request.get(`${baseURL}/contact`)).text();
    const sources = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]!);
    expect(sources.length).toBeGreaterThan(0);
    for (const src of sources) {
      const body = await (await page.request.get(new URL(src, baseURL).toString())).text();
      expect(body, src).not.toContain('data-booking-island');
    }
  });

  test('CMS pages ship no editor or rich-text JS: their blocks render on the server', async ({
    page,
  }) => {
    const scripts: string[] = [];
    page.on('request', (r) => {
      if (r.resourceType() === 'script') scripts.push(r.url());
    });
    for (const path of ['/how-it-works', '/terms', '/blog/how-to-price-printed-tshirt-saudi']) {
      await page.goto(path);
      await page.waitForLoadState('load');
    }
    expect(scripts.some((u) => /lexical|payload|richtext/i.test(u))).toBe(false);
    // The legal body and the flow are HTML before hydration.
    const html = await (await page.request.get('/terms')).text();
    expect(html).toMatch(/<h2 id="legal-section-1">/);
  });

  test('a page other than the home never downloads the hero photo or the Black font', async ({
    page,
  }) => {
    // Prefetching the home hoisted its hero and font preloads into every other page's head
    // (site audit 2026-09-18, item 4): the home links carry prefetch={false}.
    const requests: string[] = [];
    page.on('request', (r) => requests.push(r.url()));
    await page.goto('/products');
    await page.waitForLoadState('load');
    await page.locator('footer').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);
    expect(requests.filter((u) => /hero-set-|ITFRayatRound-Black/.test(u))).toEqual([]);
    expect(await page.locator('link[rel="preload"][as="image"][media]').count()).toBe(0);
  });

  test('the LCP photo of each template is fetched at high priority, with its blur placeholder inlined', async ({
    page,
    baseURL,
  }) => {
    // `priority` on next/image only preloads; the fetchpriority attribute is what lets the
    // browser start the LCP image ahead of the scripts (site audit 2026-09-18, item 3). The
    // blur-up placeholder (ADR-029) is in the server HTML as the image's background.
    for (const path of [
      '/products/tee-essential',
      '/products',
      '/blog/how-to-price-printed-tshirt-saudi',
      '/blog',
      '/about',
    ]) {
      const html = await (await page.request.get(`${baseURL}${path}`)).text();
      const lcp = /<img[^>]*fetchpriority="high"[^>]*>/i.exec(html)?.[0];
      expect(lcp, `${path}: the LCP img in the server HTML`).toBeTruthy();
      expect(lcp, path).toContain('data:image/webp;base64,');
      await page.goto(path);
      const high = page.locator('main img[fetchpriority="high"]');
      await expect(high, path).toHaveCount(1);
      await expect(high, path).not.toHaveAttribute('loading', 'lazy');
    }
  });
});
