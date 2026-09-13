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

  test('CMS pages ship no editor or rich-text JS: their blocks render on the server', async ({
    page,
  }) => {
    const scripts: string[] = [];
    page.on('request', (r) => {
      if (r.resourceType() === 'script') scripts.push(r.url());
    });
    for (const path of ['/how-it-works', '/terms']) {
      await page.goto(path);
      await page.waitForLoadState('load');
    }
    expect(scripts.some((u) => /lexical|payload|richtext/i.test(u))).toBe(false);
    // The legal body and the flow are HTML before hydration.
    const html = await (await page.request.get('/terms')).text();
    expect(html).toMatch(/<h2 id="legal-section-1">/);
  });
});
