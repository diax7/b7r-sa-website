import { expect, test } from '@playwright/test';

test.describe('products listing (BRD 6.5)', () => {
  test('shows five linked cards with name, price, two swatches and sizes', async ({ page }) => {
    await page.goto('/products');
    // The admin suite may be creating a temporary product in parallel, so the five seed
    // products are asserted by slug rather than by an exact count.
    const cards = page.locator('[data-product-grid] [data-product-card]');
    for (const slug of ['tee-essential', 'tee-oversize', 'hoodie', 'baby-onesie', 'tote-bag']) {
      await expect(page.locator(`[data-product-card="${slug}"]`)).toHaveCount(1);
    }
    expect(await page.locator('[data-product-grid] a[href^="/products/"]').count()).toBe(
      await cards.count(),
    );
    const first = cards.first();
    await expect(first).toContainText('تيشيرت أساسي');
    await expect(first.getByRole('link')).toHaveAccessibleName('تيشيرت أساسي');
    await expect(first).toContainText('يبدأ من');
    await expect(first.locator('[data-sar-digits]')).toHaveText('45');
    await expect(first.locator('button[data-swatch]')).toHaveCount(2);
    // Touch targets (BRD 3.13): swatches and the gallery pills are at least 44 px.
    const swatch = (await first.locator('button[data-swatch]').first().boundingBox())!;
    expect(Math.min(swatch.width, swatch.height)).toBeGreaterThanOrEqual(44);
    await expect(first).toContainText('S – 2XL');
  });

  test('swatches preview and set the colour; hovering the photo flips to the back', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'hover interactions');
    await page.goto('/products');
    const card = page.locator('[data-product-card="tee-essential"]');
    const photo = card.locator('[data-card-photo]');
    await expect(photo).toHaveAttribute('data-card-photo', 'black');
    const white = card.locator('button[data-swatch="white"]');
    await white.hover();
    await expect(photo).toHaveAttribute('data-card-photo', 'white');
    await card.locator('h2').hover();
    await expect(photo).toHaveAttribute('data-card-photo', 'black');
    await white.click();
    await expect(white).toHaveAttribute('aria-pressed', 'true');
    await card.locator('h2').hover();
    await expect(photo).toHaveAttribute('data-card-photo', 'white');
    await expect(page).toHaveURL(/\/products$/);
    const back = photo.locator('img').nth(1);
    await page.mouse.move(0, 0);
    await expect(back).toHaveCSS('opacity', '0', { timeout: 10_000 });
    // Hovering the card flips; hovering a swatch previews without flipping.
    await card.locator('h2').hover();
    await expect(back).toHaveCSS('opacity', '1');
    await white.hover();
    await expect(back).toHaveCSS('opacity', '0');
    // The whole card is the link (stretched from the name): a click on the price line
    // navigates too. `force` skips the stability wait while the hover lift is animating.
    await card.getByText('يبدأ من').click({ force: true });
    await expect(page).toHaveURL(/\/products\/tee-essential$/);
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
    await expect(page.locator('[data-size-chart-unit]')).toHaveText('القياسات بالسنتيمتر');
    // Breadcrumb and footer contact links are 44 px tall hit areas (BRD 6.17, audit item 18).
    const crumb = (await page.locator('nav[aria-label] ol a').first().boundingBox())!;
    expect(crumb.height).toBeGreaterThanOrEqual(44);
    const mail = (await page.locator('footer a[href^="mailto:"]').boundingBox())!;
    expect(mail.height).toBeGreaterThanOrEqual(44);
    // Three other products in catalogue order, wrapping around.
    const related = page.locator('[aria-labelledby="product-related-title"]').getByRole('link');
    await expect(related).toHaveCount(3);
    await expect(related.nth(0)).toHaveAttribute('href', '/products/tee-oversize');
  });

  test('the tote bag has no size chart and keeps the section alternation', async ({ page }) => {
    await page.goto('/products/tote-bag');
    await expect(page.locator('table')).toHaveCount(0);
    await expect(page.locator('[data-gallery-view]')).toHaveCount(0);
    const tones = await page
      .locator('section[data-tone]')
      .evaluateAll((els) => els.map((el) => el.getAttribute('data-tone')));
    for (let i = 1; i < tones.length; i++)
      expect(tones[i], tones.join(' → ')).not.toBe(tones[i - 1]);
  });

  test('gallery: the photo flips to the back on hover, tap and arrow keys; swatches switch the colour', async ({
    page,
    isMobile,
  }) => {
    await page.goto('/products/tee-essential');
    const gallery = page.locator('[data-gallery]');
    const photo = gallery.locator('[data-gallery-photo]');
    await expect(photo).toHaveAttribute('data-gallery-photo', 'white');
    await expect(photo).toHaveAttribute('data-gallery-side', 'front');
    // No counter, no thumbnail strip: one photo, the swatches, a hidden live region.
    await expect(gallery.locator('img')).toHaveCount(2);
    await expect(gallery.getByText(/صورة \d+ من/)).toHaveCount(0);
    const state = gallery.locator('[aria-live="polite"]');
    await expect(state).toHaveText('أبيض، الواجهة الأمامية');
    // The visible toggle works everywhere; hover and keys are extras on desktop.
    const pill = (await gallery.locator('[data-gallery-view="back"]').boundingBox())!;
    expect(pill.height).toBeGreaterThanOrEqual(44);
    await gallery.locator('[data-gallery-view="back"]').click();
    await expect(photo).toHaveAttribute('data-gallery-side', 'back');
    await expect(gallery.locator('[data-gallery-view="back"]')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await gallery.locator('[data-gallery-view="front"]').click();
    await expect(photo).toHaveAttribute('data-gallery-side', 'front');
    if (isMobile) {
      await photo.tap();
    } else {
      await photo.hover();
      await expect(photo).toHaveAttribute('data-gallery-side', 'back');
      await page.mouse.move(0, 0);
      await expect(photo).toHaveAttribute('data-gallery-side', 'front');
      await photo.focus();
      await page.keyboard.press('ArrowLeft');
    }
    await expect(photo).toHaveAttribute('data-gallery-side', 'back');
    await expect(state).toHaveText('أبيض، الواجهة الخلفية');
    // Swatch: that colour's front. The visible 44 px label is the tap target (the radio is
    // visually hidden; a forced click on it lands nowhere under load on mobile WebKit).
    await gallery.locator('label[title="أسود"]').click();
    await expect(gallery.getByLabel('اللون أسود')).toBeChecked();
    await expect(photo).toHaveAttribute('data-gallery-photo', 'black');
    await expect(photo).toHaveAttribute('data-gallery-side', 'front');
  });

  test('the description sits under the name; specs and the size chart share one section', async ({
    page,
  }) => {
    await page.goto('/products/tee-essential');
    const hero = page.locator('section[aria-labelledby="product-title"]');
    await expect(hero.getByText('تيشيرت كلاسيكي بياقة دائرية', { exact: false })).toBeVisible();
    const details = page.locator('[data-product-details]');
    await expect(details).toHaveCount(1);
    await expect(details.locator('h2')).toHaveCount(2);
    await expect(details.locator('dl')).toHaveCount(1);
    await expect(details.locator('table')).toHaveCount(1);
    await expect(page.locator('table')).toHaveCount(1);
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

  test('no page lays out wider than a 360 px phone', async ({ browser, baseURL, isMobile }) => {
    test.skip(!isMobile, 'phone widths');
    // The size-chart table once widened the layout viewport to 438 px and the browser zoomed
    // the page out (site audit 2026-09-18, blocker 2); a widened viewport is a class of
    // defect, so the home, a post and the FAQ page are held to the same width.
    const ctx = await browser.newContext({
      viewport: { width: 360, height: 740 },
      isMobile: true,
      hasTouch: true,
      locale: 'ar-SA',
    });
    const page = await ctx.newPage();
    for (const path of [
      '/products/tee-essential',
      '/products/baby-onesie',
      '/en/products/tee-essential',
      '/',
      '/blog/how-to-price-printed-tshirt-saudi',
      '/faq',
    ]) {
      await page.goto(`${baseURL}${path}`);
      const width = await page.evaluate(() => ({
        inner: window.innerWidth,
        scroll: document.documentElement.scrollWidth,
      }));
      expect(width.inner, path).toBe(360);
      expect(width.scroll, path).toBeLessThanOrEqual(width.inner);
    }
    await ctx.close();
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
