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
    // The arming runs after hydration and says so on the root.
    await expect(page.locator('html[data-reveal-armed]')).toHaveCount(1);
    const sections = page.locator('section[data-reveal]');
    expect(await sections.count()).toBeGreaterThan(3);
    // The hero is not a Section and carries no reveal, and its image (the LCP) has no hidden
    // ancestor.
    await expect(page.locator('section.hero[data-reveal]')).toHaveCount(0);
    expect(
      await page
        .locator('section.hero img')
        .first()
        .evaluate((el) => el.closest('.is-hidden') !== null),
    ).toBe(false);
    const hidden = page.locator('section[data-reveal].is-hidden');
    expect(await hidden.count()).toBeGreaterThan(0);
    // Every hidden section starts below the viewport.
    const height = page.viewportSize()!.height;
    for (const box of await hidden.evaluateAll((els) =>
      els.map((el) => el.getBoundingClientRect().top),
    )) {
      expect(box).toBeGreaterThan(height * 0.9);
    }
    // Pin one section by id: `hidden.first()` re-resolves once it reveals.
    const id = await hidden.first().getAttribute('id');
    const first = page.locator(`section#${id}`);
    await first.scrollIntoViewIfNeeded();
    await expect(first).toHaveClass(/is-visible/);
    await expect(first).not.toHaveClass(/is-hidden/);
  });

  test('a grid staggers its children', async ({ page }) => {
    await page.goto('/products');
    await expect(page.locator('html[data-reveal-armed]')).toHaveCount(1);
    const cards = page.locator('[data-reveal-stagger] > *');
    expect(await cards.count()).toBeGreaterThan(1);
    await expect(cards.nth(1)).toHaveAttribute('data-reveal', '');
    expect(await cards.nth(1).evaluate((el) => el.style.getPropertyValue('--i'))).toBe('1');
  });

  test('a page reached by client navigation is armed too', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html[data-reveal-armed]')).toHaveCount(1);
    // The footer's link is visible on every layout (the header's sits in the phone menu).
    await page.locator('footer a[href="/products"]').first().click();
    await expect(page).toHaveURL(/\/products$/);
    const cards = page.locator('[data-reveal-stagger] > *');
    await expect(cards.first()).toHaveAttribute('data-armed', '');
    expect(await page.locator('[data-reveal][data-armed]').count()).toBeGreaterThan(3);
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
    // Hydrated (the WhatsApp island has mounted, 1.5 s after the extras) and nothing armed.
    await expect(page.getByTestId('whatsapp-button')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('html[data-reveal-armed]')).toHaveCount(0);
    await expect(page.locator('.is-hidden')).toHaveCount(0);
    await ctx.close();
  });
});
