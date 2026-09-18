import { expect, test } from '@playwright/test';

test.describe('header and navigation (BRD 6.2)', () => {
  test('desktop shows six links, the switch icon and the header CTA, and no login', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'desktop layout');
    await page.goto('/');
    const nav = page.locator('header nav');
    await expect(nav.getByRole('link')).toHaveCount(6);
    await expect(nav.getByRole('link', { name: 'الرئيسية' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    // No login anywhere (ADR-044).
    await expect(page.locator('header a[href*="/login"]')).toHaveCount(0);
    expect(await page.content()).not.toContain('تسجيل الدخول');
    // The switch is an icon: no visible text, the copy-bank name, a tooltip in the target's name.
    const toEnglish = page.locator('header [data-language-switch="en"]');
    await expect(toEnglish).toHaveText('');
    await expect(toEnglish).toHaveAttribute('aria-label', 'انتقل إلى النسخة الإنجليزية');
    await expect(toEnglish).toHaveAttribute('data-tooltip', 'English');
    await expect(page.locator('header a[data-location="header"]')).toHaveAttribute(
      'href',
      /utm_campaign=header/,
    );
    // The resting header is 88 px; scrolled it shrinks to 60 (BRD 6.2 as amended).
    expect((await page.locator('header').boundingBox())!.height).toBe(88);
  });

  test('past the sentinel the header settles into the island: narrower than the page, a capsule, no blur (ADR-053)', async ({
    page,
    isMobile,
  }) => {
    await page.goto('/');
    const header = page.locator('header');
    const rest = (await header.boundingBox())!;
    await page.evaluate(() => window.scrollTo(0, 240));
    await expect(header).toHaveAttribute('data-scrolled', 'true');
    await page.waitForTimeout(900);
    const island = (await header.boundingBox())!;
    const viewport = page.viewportSize()!;
    expect(island.width).toBeLessThanOrEqual(viewport.width - 24);
    expect(island.width).toBeLessThan(rest.width);
    expect(Math.abs(island.x + island.width / 2 - viewport.width / 2)).toBeLessThan(2);
    expect(island.y).toBeGreaterThanOrEqual(8);
    expect(island.height).toBe(isMobile ? 58 : 64);
    await expect(header).toHaveCSS('border-top-left-radius', '13px');
    await expect(header).toHaveCSS('backdrop-filter', 'none');
    // The three things on a phone: the logo, the button and the burger; six links on desktop.
    await expect(header.locator('a[data-location="header"]')).toBeVisible();
    if (isMobile) {
      await expect(page.getByTestId('menu-open')).toBeVisible();
      await expect(header.locator('nav')).toBeHidden();
    } else {
      await expect(header.locator('nav a')).toHaveCount(6);
    }
    // Back at the top the bar is full width again.
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(header).not.toHaveAttribute('data-scrolled', 'true');
    await page.waitForTimeout(900);
    // Within a pixel: the settle's last frame can leave a sub-pixel on a phone's viewport.
    expect(Math.abs((await header.boundingBox())!.width - rest.width)).toBeLessThan(1);
  });

  test('mobile menu opens, traps focus, closes on Escape and restores focus', async ({
    page,
    isMobile,
    browserName,
  }) => {
    test.skip(!isMobile, 'mobile layout');
    await page.goto('/');
    const open = page.getByTestId('menu-open');
    // The phone header shows the logo and the burger only; the switch lives in the sheet.
    await expect(page.locator('header [data-language-switch]')).toBeHidden();
    await open.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    // The sheet's top bar mirrors the header: the logo, the switch, the X (ADR-044).
    await expect(dialog.getByRole('link', { name: 'بحر برنت' }).first()).toHaveAttribute(
      'href',
      '/',
    );
    await expect(dialog.locator('[data-language-switch="en"]')).toHaveAttribute('href', '/en');
    await expect(dialog.getByRole('link', { name: 'المنتجات' })).toBeVisible();
    await expect(dialog.getByRole('link', { name: 'ابدأ براندك مجاناً' })).toHaveAttribute(
      'href',
      /utm_campaign=menu/,
    );
    // No login; WhatsApp is an icon among the socials, named from the copy bank.
    await expect(dialog.locator('a[href*="/login"]')).toHaveCount(0);
    await expect(dialog.getByRole('link', { name: 'بحر برنت على واتساب' })).toHaveAttribute(
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
