import { expect, test } from '@playwright/test';

const SLIDES = [
  'علامتك التجارية تبدأ من قطعة واحدة',
  'بدون رأس مال، بدون مخزون',
  'من جدة إلى كل المملكة خلال 5 أيام',
  'متجرك في سلة أو زد؟ اربطه بضغطة',
];

test.describe('hero (BRD 6.4.1)', () => {
  test('renders one H1 and all four slide strings without JavaScript', async ({
    browser,
    baseURL,
  }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto(`${baseURL}/`);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText(SLIDES[0]!);
    const html = await page.content();
    for (const s of SLIDES) expect(html).toContain(s);
    // Content is visible without the html.js hook (Reveal never hides it).
    await expect(page.locator('section.hero')).toBeVisible();
    await ctx.close();
  });

  test('requests exactly one hero image per viewport and preloads it', async ({ page }) => {
    const heroImages: string[] = [];
    // The hero photos come from the CMS media library (seeded as hero-set-*.jpg).
    page.on('request', (r) => {
      if (/hero-set-[ab]-(desktop|mobile)/.test(r.url())) heroImages.push(r.url());
    });
    await page.goto('/');
    await page.waitForLoadState('load');
    expect(heroImages, heroImages.join('\n')).toHaveLength(1);
    // One media-gated preload per breakpoint (React may also emit early hints for them).
    expect(
      await page.locator('link[rel="preload"][as="image"][media="(min-width: 768px)"]').count(),
    ).toBeGreaterThanOrEqual(1);
    expect(
      await page.locator('link[rel="preload"][as="image"][media="(max-width: 767px)"]').count(),
    ).toBeGreaterThanOrEqual(1);
  });

  test('header never overlaps the H1 and does not shift layout when it shrinks', async ({
    page,
  }) => {
    await page.goto('/');
    const header = page.locator('header');
    const h1 = page.locator('h1');
    const hb = await header.boundingBox();
    const tb = await h1.boundingBox();
    expect(hb && tb && hb.y + hb.height <= tb.y).toBe(true);

    const before = await h1.boundingBox();
    await page.evaluate(() => window.scrollTo(0, 120));
    await page.waitForTimeout(400);
    await expect(header).toHaveAttribute('data-scrolled', 'true');
    const after = await h1.boundingBox();
    // The H1 moved by exactly the scroll amount: the header shrink reserved its own space.
    expect(Math.abs(before!.y - after!.y - 120)).toBeLessThan(1);
  });

  test('dots and the pause control work from the keyboard', async ({ page }) => {
    await page.goto('/');
    const dots = page.getByRole('button', { name: /الشريحة \d من 4/ });
    await expect(dots).toHaveCount(4);
    await dots.nth(2).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-slide="2"]')).toHaveAttribute('data-active', 'true');
    await expect(page.locator('h1')).toHaveText(SLIDES[0]!);

    const pause = page.getByRole('button', { name: 'إيقاف التبديل التلقائي' });
    await pause.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: 'استئناف التبديل التلقائي' })).toBeVisible();
  });

  test('does not auto-advance under reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.mouse.move(0, 0);
    await page.waitForTimeout(6800);
    await expect(page.locator('[data-slide="0"]')).toHaveAttribute('data-active', 'true');
    await page.getByRole('button', { name: 'الشريحة 2 من 4' }).click();
    await expect(page.locator('[data-slide="1"]')).toHaveAttribute('data-active', 'true');
  });

  test('the overlay and the chips come from the admin (ADR-044)', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-hero-overlay]')).toHaveAttribute(
      'data-hero-overlay',
      '#ffffff',
    );
    // Three chips in the seed; the row is one list of chips under the copy.
    await expect(page.locator('section.hero .hero-copy ul li')).toHaveCount(3);
  });

  test('CTA links carry the hero utm campaign', async ({ page }) => {
    await page.goto('/');
    const cta = page.locator('section.hero a[data-location="hero"]');
    await expect(cta).toHaveAttribute('href', /utm_campaign=hero/);
    await expect(cta).toHaveText('ابدأ براندك مجانًا');
  });

  // Beyond Full HD the hero is a card of the photo's width under the header (a 32 px gutter
  // a side just past the threshold), and the photo is fetched at its own width, never an
  // upscaled candidate (ADR-051).
  for (const [width, path] of [
    [1940, '/'],
    [2560, '/'],
    [3440, '/en'],
  ] as const) {
    test(`at ${width} px the hero is a card of the photo's width and the photo is not upscaled (${path})`, async ({
      browser,
      baseURL,
    }) => {
      const ctx = await browser.newContext({ viewport: { width, height: 1440 } });
      const page = await ctx.newPage();
      await page.goto(`${baseURL}${path}`);
      const hero = page.locator('section.hero');
      await expect(hero).toBeVisible();
      const box = (await hero.boundingBox())!;
      const cardWidth = Math.min(1920, width - 64);
      expect(box.width).toBe(cardWidth);
      expect(box.x).toBe((width - cardWidth) / 2);
      expect(box.y).toBeGreaterThanOrEqual(88);
      expect(box.height).toBeLessThanOrEqual(1080);
      await expect(hero).toHaveCSS('border-radius', '20px');
      const image = page.locator('[data-hero-image="0"]');
      await expect
        .poll(() => image.evaluate((el: HTMLImageElement) => el.naturalWidth))
        .toBeLessThanOrEqual(1920);
      await expect(image).toHaveAttribute('sizes', '100vw');
      await expect(
        page.locator('link[rel="preload"][as="image"][media="(min-width: 768px)"]').first(),
      ).toHaveAttribute('imagesizes', '(min-width: 1921px) 1920px, 100vw');
      await expect(
        page.locator('section.hero source[media="(min-width: 768px)"]').first(),
      ).toHaveAttribute('sizes', '(min-width: 1921px) 1920px, 100vw');
      await ctx.close();
    });
  }
});
