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
        if (url.includes('/fonts/')) fonts.push({ url, bytes });
        if (url.includes('images%2Fhero') || url.includes('images/hero')) hero.push({ url, bytes });
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
});
