import { expect, test } from '@playwright/test';

const ORDER = ['tee-essential', 'hoodie', 'tee-oversize', 'tote-bag', 'baby-onesie'];

test.describe('product strip (BRD 6.4.2)', () => {
  test('five real links in the BRD order with name and price as accessible text', async ({
    page,
  }) => {
    await page.goto('/');
    const panels = page.locator('.strip-panel');
    await expect(panels).toHaveCount(5);
    for (const [i, slug] of ORDER.entries()) {
      await expect(panels.nth(i)).toHaveAttribute('href', `/products/${slug}`);
    }
    await expect(panels.first()).toContainText('تيشيرت أساسي');
    await expect(panels.first()).toContainText('يبدأ من');
    await expect(panels.first().locator('img')).toHaveAttribute(
      'sizes',
      '(min-width: 1024px) 20vw, 78vw',
    );
  });

  test('keyboard focus expands a panel on desktop', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop hover/focus layout');
    await page.goto('/');
    const panels = page.locator('.strip-panel');
    await panels.first().scrollIntoViewIfNeeded();
    const restWidth = (await panels.nth(1).boundingBox())!.width;
    await panels.nth(1).focus();
    await page.waitForTimeout(700);
    const focusedWidth = (await panels.nth(1).boundingBox())!.width;
    expect(focusedWidth).toBeGreaterThan(restWidth * 1.8);
    await expect(panels.nth(1).locator('.strip-label')).toHaveCSS('opacity', '1');
  });

  test('mobile strip is a snap carousel with visible labels', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile layout');
    await page.goto('/');
    const strip = page.locator('.strip');
    await expect(strip).toHaveCSS('scroll-snap-type', /x mandatory/);
    await expect(page.locator('.strip-label').first()).toHaveCSS('opacity', '1');
    const w = (await page.locator('.strip-panel').first().boundingBox())!.width;
    const vw = page.viewportSize()!.width;
    expect(Math.abs(w - vw * 0.78)).toBeLessThan(2);
  });
});
