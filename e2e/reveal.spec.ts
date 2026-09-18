import { expect, test } from '@playwright/test';

/**
 * Scroll reveal on every section (BRD 3.7, ADR-055): what is below the fold is hidden until it
 * enters and fades up once; what is in view at load is never hidden; nothing is hidden
 * without JavaScript or under reduced motion.
 */
test.describe('scroll reveal (ADR-055)', () => {
  test('sections below the fold are hidden until scrolled into view; the fold is never hidden', async ({
    page,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('load');
    const sections = page.locator('section[data-reveal]');
    expect(await sections.count()).toBeGreaterThan(3);
    // The hero is not a Section and carries no reveal.
    await expect(page.locator('section.hero[data-reveal]')).toHaveCount(0);
    const hidden = page.locator('section[data-reveal].is-hidden');
    expect(await hidden.count()).toBeGreaterThan(0);
    // Every hidden section starts below the viewport.
    const height = page.viewportSize()!.height;
    for (const box of await hidden.evaluateAll((els) =>
      els.map((el) => el.getBoundingClientRect().top),
    )) {
      expect(box).toBeGreaterThan(height * 0.9);
    }
    const first = hidden.first();
    await first.scrollIntoViewIfNeeded();
    await expect(first).toHaveClass(/is-visible/);
    await expect(first).not.toHaveClass(/is-hidden/);
  });

  test('a grid staggers its children', async ({ page }) => {
    await page.goto('/products');
    const cards = page.locator('[data-reveal-stagger] > *');
    expect(await cards.count()).toBeGreaterThan(1);
    await expect(cards.nth(1)).toHaveAttribute('data-reveal', '');
    expect(await cards.nth(1).evaluate((el) => el.style.getPropertyValue('--i'))).toBe('1');
  });

  test('nothing is hidden without JavaScript', async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto(`${baseURL}/`);
    await expect(page.locator('.is-hidden')).toHaveCount(0);
    for (const opacity of await page
      .locator('section[data-reveal]')
      .evaluateAll((els) => els.map((el) => getComputedStyle(el).opacity))) {
      expect(opacity).toBe('1');
    }
    await ctx.close();
  });

  test('nothing is hidden under reduced motion', async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(`${baseURL}/`);
    await page.waitForLoadState('load');
    await expect(page.locator('.is-hidden')).toHaveCount(0);
    await ctx.close();
  });
});
