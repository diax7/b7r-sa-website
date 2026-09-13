import { expect, test } from '@playwright/test';

test.describe('products listing (BRD 6.5)', () => {
  test('shows five linked cards with name, price, colours and sizes', async ({ page }) => {
    await page.goto('/products');
    const cards = page.locator('[data-product-grid] a[href^="/products/"]');
    await expect(cards).toHaveCount(5);
    const first = cards.first();
    await expect(first).toContainText('تيشيرت أساسي');
    await expect(first).toContainText('يبدأ من');
    await expect(first.locator('[data-sar-digits]')).toHaveText('45');
    await expect(first.locator('li[title]')).toHaveCount(2);
    await expect(first).toContainText('S – 2XL');
  });
});

test.describe('product detail (BRD 6.6)', () => {
  test('renders the price block, CTAs with UTM, specs and the size chart', async ({ page }) => {
    await page.goto('/products/tee-essential');
    await expect(page.locator('h1')).toHaveText('تيشيرت أساسي');
    await expect(page.locator('[data-profit] [data-sar-digits]')).toHaveText('44');
    const cta = page.locator('a[data-location="product"]').first();
    await expect(cta).toHaveAttribute('href', /utm_campaign=product/);
    await expect(cta).toHaveAttribute('href', /utm_content=tee-essential/);
    await expect(page.getByRole('link', { name: 'جرّب تصميمك عليه' })).toHaveAttribute(
      'href',
      '/#designer?product=tee-essential',
    );
    await expect(page.locator('dl').nth(1)).toContainText('قطن ناعم عالي الجودة');
    const chart = page.locator('table');
    await expect(chart).toHaveCount(1);
    await expect(chart.locator('tbody tr')).toHaveCount(5);
    await expect(chart.locator('th[scope="col"]')).toHaveCount(4);
    // Three other products in catalogue order, wrapping around.
    const related = page.locator('[aria-labelledby="product-related-title"] a[href^="/products/"]');
    await expect(related).toHaveCount(3);
    await expect(related.nth(0)).toHaveAttribute('href', '/products/tee-oversize');
  });

  test('the tote bag has no size chart and keeps the section alternation', async ({ page }) => {
    await page.goto('/products/tote-bag');
    await expect(page.locator('table')).toHaveCount(0);
    const tones = await page
      .locator('section[data-tone]')
      .evaluateAll((els) => els.map((el) => el.getAttribute('data-tone')));
    for (let i = 1; i < tones.length; i++)
      expect(tones[i], tones.join(' → ')).not.toBe(tones[i - 1]);
  });

  test('gallery: thumbnails, swatches, arrows and a polite counter', async ({ page, isMobile }) => {
    await page.goto('/products/tee-essential');
    const gallery = page.locator('[data-gallery]');
    const counter = gallery.locator('[aria-live="polite"]');
    await expect(counter).toHaveText('صورة 1 من 4');
    await expect(gallery.locator('img[alt]:not([alt=""])')).toHaveCount(1);
    // Second thumbnail: white back.
    await gallery.getByRole('button', { name: /أبيض، الواجهة الخلفية/ }).click();
    await expect(counter).toHaveText('صورة 2 من 4');
    // Swatch jumps to that colour's front.
    await gallery.getByLabel('اللون أسود').check({ force: true });
    await expect(counter).toHaveText('صورة 3 من 4');
    if (!isMobile) {
      // Arrow keys on any gallery button; ArrowLeft advances in RTL.
      await gallery.getByRole('button', { name: 'الصورة التالية' }).focus();
      await page.keyboard.press('ArrowLeft');
      await expect(counter).toHaveText('صورة 4 من 4');
      await page.keyboard.press('ArrowLeft');
      await expect(counter).toHaveText('صورة 1 من 4');
      await page.keyboard.press('ArrowRight');
      await expect(counter).toHaveText('صورة 4 من 4');
    }
  });

  test('mobile sticky bar appears after the CTA scrolls out and lifts the widgets', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'mobile only');
    await page
      .context()
      .addCookies([{ name: 'b7r_consent', value: 'denied', url: 'http://localhost:3004' }]);
    await page.goto('/products/hoodie');
    const bar = page.locator('[data-product-sticky]');
    await expect(bar).toHaveAttribute('aria-hidden', 'true');
    await page.locator('#product-related-title').scrollIntoViewIfNeeded();
    await expect(bar).toHaveAttribute('aria-hidden', 'false');
    await expect(bar.locator('[data-sar-digits]')).toHaveText('95');
    // The dock variable is written in an effect after the state change: poll rather than read.
    await expect
      .poll(() =>
        page.evaluate(() =>
          getComputedStyle(document.documentElement).getPropertyValue('--bottom-dock').trim(),
        ),
      )
      .toBe('72px');
  });

  test('fires product_view once on mount, even before the Umami script is ready', async ({
    page,
  }) => {
    await page.goto('/products/baby-onesie');
    const events = () =>
      page.evaluate(
        () =>
          (window as { __umamiEvents?: Array<{ name: string; data: { slug?: string } }> })
            .__umamiEvents ?? [],
      );
    await expect
      .poll(async () => (await events()).filter((e) => e.name === 'product_view'), {
        timeout: 8000,
      })
      .toEqual([{ name: 'product_view', data: { slug: 'baby-onesie' } }]);
  });
});
