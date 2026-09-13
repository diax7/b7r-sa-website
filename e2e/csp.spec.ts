import { expect, test, type Page } from '@playwright/test';

/**
 * Outsider-seat check for the Content-Security-Policy (BRD 8.10, ADR-016): the browser must
 * report zero `securitypolicyviolation` events on the flows that touch inline styles, blob
 * images, and the third-party scripts. Meaningful only with the CI dummy env (a GA id and the
 * Umami stand-in) so the `connect-src` / `img-src` entries are actually exercised — the
 * first test asserts that shape so a bare env cannot pass this file silently.
 */
declare global {
  interface Window {
    __cspViolations?: string[];
  }
}

async function recordViolations(page: Page) {
  await page.addInitScript(() => {
    window.__cspViolations = [];
    document.addEventListener('securitypolicyviolation', (e) => {
      window.__cspViolations?.push(`${e.violatedDirective} ${e.blockedURI}`);
    });
  });
}

const violations = (page: Page) => page.evaluate(() => window.__cspViolations ?? []);

test.describe('content security policy', () => {
  test('is served with the analytics origins the tests exercise', async ({ request }) => {
    const res = await request.get('/');
    const csp = res.headers()['content-security-policy'] ?? '';
    expect(csp).toContain("style-src 'self' 'unsafe-inline'");
    expect(csp).toContain('https://www.googletagmanager.com');
    expect(csp).toContain("frame-ancestors 'none'");
    // The consent flow below needs GA configured; the widgets spec already relies on it.
    expect(await res.text()).toContain("gtag('consent','default'");
  });

  test('the recorder itself sees a violation (so a green run means something)', async ({
    page,
  }) => {
    await recordViolations(page);
    await page.goto('/');
    await page.evaluate(() => {
      const img = document.createElement('img');
      img.src = 'https://example.com/blocked.png';
      document.body.append(img);
    });
    await page.waitForTimeout(300);
    expect(await violations(page)).toEqual(['img-src https://example.com/blocked.png']);
  });

  test('home load, hero, and inline-styled images produce no violation', async ({ page }) => {
    await recordViolations(page);
    await page.goto('/');
    await page.waitForLoadState('load');
    await page.locator('#faq').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    expect(await violations(page)).toEqual([]);
  });

  test('designer upload (blob image) produces no violation', async ({ page }) => {
    await recordViolations(page);
    await page
      .context()
      .addCookies([{ name: 'b7r_consent', value: 'denied', url: 'http://localhost:3004' }]);
    await page.goto('/');
    await page.locator('#designer').scrollIntoViewIfNeeded();
    await page.waitForSelector('[data-designer-island] canvas', { timeout: 15_000 });
    await page.getByLabel('ارفع ملف التصميم').setInputFiles('e2e/fixtures/design.png');
    await page.waitForTimeout(800);
    expect(await violations(page)).toEqual([]);
  });

  test('consent accept loads GA and Umami without a violation', async ({ page }) => {
    await recordViolations(page);
    await page.goto('/');
    await page.getByTestId('consent-accept').click({ timeout: 5000 });
    await page.waitForTimeout(1500);
    expect(await violations(page)).toEqual([]);
  });
});
