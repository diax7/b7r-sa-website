import { expect, test } from '@playwright/test';

/** Reduced-motion audit (BRD 0.4.11, 3.7, Phase 1b DoD). */
test.describe('prefers-reduced-motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('no hero auto-advance, static waves, list-mode steps, instant accordion', async ({
    page,
    isMobile,
  }) => {
    await page.goto('/');
    await page.mouse.move(0, 0);
    await page.waitForTimeout(6800);
    await expect(page.locator('[data-slide="0"]')).toHaveAttribute('data-active', 'true');

    const waveAnimations = await page
      .locator('section[aria-labelledby="cta-ribbon-title"] svg')
      .evaluateAll((els) => els.map((el) => getComputedStyle(el).animationName));
    expect(waveAnimations.every((a) => a === 'none')).toBe(true);

    if (!isMobile) {
      const h = await page.locator('#steps').evaluate((el) => el.getBoundingClientRect().height);
      expect(h).toBeLessThan(2000);
    }

    await page.locator('#faq').scrollIntoViewIfNeeded();
    const trigger = page.locator('#faq button[aria-expanded]').first();
    await trigger.click();
    // The panel's inner grid carries the height transition; the global rule drops it.
    const transition = await page
      .locator('#faq [data-state="open"][role="region"] > div')
      .evaluate((el) => getComputedStyle(el).transitionProperty);
    expect(transition).not.toContain('grid-template-rows');
  });

  test('designer figures change instantly (no count-up)', async ({ page }) => {
    await page.goto('/');
    await page.locator('#designer').scrollIntoViewIfNeeded();
    await page.waitForSelector('[data-designer-island] canvas', { timeout: 15_000 });
    const input = page.getByLabel('سعر البيع بالريال');
    await input.fill('120');
    await input.press('Enter');
    // Read immediately: with reduced motion the value is final on the next frame.
    await page.waitForTimeout(50);
    await expect(page.locator('[data-result="per-piece"] [data-sar-digits]')).toHaveText('75');
  });
});
