import { expect, test } from '@playwright/test';

test.describe('header and navigation (BRD 6.2)', () => {
  test('desktop shows six links, login, and the header CTA', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop layout');
    await page.goto('/');
    const nav = page.locator('header nav');
    await expect(nav.getByRole('link')).toHaveCount(6);
    await expect(nav.getByRole('link', { name: 'الرئيسية' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(
      page.locator('header').getByRole('link', { name: 'تسجيل الدخول' }),
    ).toHaveAttribute('href', 'https://b7r.app/login');
    await expect(page.locator('header a[data-location="header"]')).toHaveAttribute(
      'href',
      /utm_campaign=header/,
    );
  });

  test('mobile menu opens, traps focus, closes on Escape and restores focus', async ({
    page,
    isMobile,
    browserName,
  }) => {
    test.skip(!isMobile, 'mobile layout');
    await page.goto('/');
    const open = page.getByTestId('menu-open');
    await open.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('link', { name: 'المنتجات' })).toBeVisible();
    await expect(dialog.getByRole('link', { name: 'ابدأ براندك مجانًا' })).toHaveAttribute(
      'href',
      /utm_campaign=menu/,
    );
    await expect(dialog.getByRole('link', { name: 'تواصل معنا عبر واتساب' })).toHaveAttribute(
      'href',
      /wa\.me\/966501699572/,
    );
    // Page scroll is locked while open (Radix intercepts wheel/touch scrolling).
    if (browserName !== 'webkit') {
      // Mobile WebKit has no wheel events in Playwright; Chromium covers the lock assertion.
      const y0 = await page.evaluate(() => window.scrollY);
      await page.mouse.wheel(0, 600);
      await page.waitForTimeout(200);
      expect(await page.evaluate(() => window.scrollY)).toBe(y0);
    }
    // Focus stays inside the dialog.
    for (let i = 0; i < 12; i++) await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))).toBe(
      true,
    );
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(open).toBeFocused();
  });

  test('skip link is the first focusable element', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'WebKit does not move focus to links with Tab by default');
    await page.goto('/');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'تخطَّ إلى المحتوى' })).toBeFocused();
  });
});
