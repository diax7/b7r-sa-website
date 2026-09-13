import { expect, test } from '@playwright/test';

const PREFILLED = 'مرحباً، أرغب بمعرفة المزيد عن بحر برنت.';

test.describe('WhatsApp widget (BRD 6.15)', () => {
  test('sits at the bottom-left, opens a panel above it without moving, closes on Escape', async ({
    page,
  }) => {
    await page.goto('/');
    const button = page.getByTestId('whatsapp-button');
    await expect(button).toBeVisible({ timeout: 5000 });
    const box = (await button.boundingBox())!;
    expect(box.x).toBeLessThan(40); // inline end = the left edge in RTL (BRD 6.15, 2026-09-13)
    await button.click();
    const panel = page.getByTestId('whatsapp-panel');
    await expect(panel).toBeVisible();
    // The panel anchors above the button; the button itself stays put (its centre is
    // compared because a tap leaves the hover scale on touch browsers).
    const after = (await button.boundingBox())!;
    expect(Math.abs(after.x + after.width / 2 - (box.x + box.width / 2))).toBeLessThan(1);
    expect(Math.abs(after.y + after.height / 2 - (box.y + box.height / 2))).toBeLessThan(1);
    const panelBox = (await panel.boundingBox())!;
    expect(panelBox.y + panelBox.height).toBeLessThanOrEqual(box.y + 1);
    await expect(panel).toContainText('فريق الدعم');
    await expect(panel).toContainText('أهلاً 👋 كيف نقدر نساعدك؟');
    const link = panel.getByRole('link', { name: /ابدأ المحادثة/ });
    await expect(link).toHaveAttribute(
      'href',
      `https://wa.me/966501699572?text=${encodeURIComponent(PREFILLED)}`,
    );
    await expect(link).toHaveAttribute('target', '_blank');
    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
    await expect(panel).toHaveCount(0);
    // No hours, no reply-time promise, no online indicator.
    await button.click();
    await expect(panel).not.toContainText(/متصل|دقائق|ساعات/);
  });

  test('lifts above the designer results bar on phones', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile only');
    await page.goto('/');
    await expect(page.getByTestId('whatsapp-button')).toBeVisible({ timeout: 5000 });
    await page.locator('#designer').scrollIntoViewIfNeeded();
    await page.waitForSelector('[data-designer-island] canvas', { timeout: 15_000 });
    // Scroll so the section is in view but the results card is not.
    await page.locator('[data-designer-island] fieldset').first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await expect(page.locator('[data-sticky-results]')).toHaveCSS('opacity', '1');
    const dock = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--bottom-dock').trim(),
    );
    expect(dock).toBe('72px');
    const bar = (await page.locator('[data-sticky-results]').boundingBox())!;
    const btn = (await page.getByTestId('whatsapp-button').boundingBox())!;
    expect(btn.y + btn.height).toBeLessThanOrEqual(bar.y + 1);
  });
});

test.describe('consent and analytics (BRD 6.16)', () => {
  test('defaults are denied in the initial HTML and Umami loads without consent', async ({
    page,
  }) => {
    const res = await page.goto('/');
    const html = (await res?.text()) ?? '';
    expect(html).toContain("gtag('consent','default'");
    expect(html).toContain("analytics_storage:'denied'");
    expect(html).toContain('umami-test.js');
    await expect
      .poll(() => page.evaluate(() => typeof (window as { umami?: unknown }).umami))
      .toBe('object');
  });

  test('accept sets the cookie for 180 days, loads GA once, and the bar never returns', async ({
    page,
    context,
    browserName,
  }) => {
    const ga: string[] = [];
    page.on('request', (r) => {
      if (r.url().includes('googletagmanager.com')) ga.push(r.url());
    });
    await page.goto('/');
    const bar = page.getByTestId('consent-bar');
    await expect(bar).toBeVisible({ timeout: 5000 });
    expect(ga).toHaveLength(0);
    await page.getByTestId('consent-accept').click();
    await expect(bar).toHaveCount(0);
    await expect.poll(() => ga.length).toBeGreaterThan(0);
    const cookie = (await context.cookies()).find((c) => c.name === 'b7r_consent');
    expect(cookie?.value).toBe('granted');
    // WebKit's cookie API reports document.cookie SameSite=Lax as None; Chromium is exact.
    if (browserName === 'chromium') expect(cookie?.sameSite).toBe('Lax');
    const days = ((cookie?.expires ?? 0) - Date.now() / 1000) / 86400;
    expect(days).toBeGreaterThan(178);
    expect(days).toBeLessThan(181);
    // Return visit: no bar, GA loads from the cookie alone.
    const gaAfter: string[] = [];
    page.on('request', (r) => {
      if (r.url().includes('googletagmanager.com')) gaAfter.push(r.url());
    });
    await page.goto('/');
    await page.waitForTimeout(1500);
    await expect(page.getByTestId('consent-bar')).toHaveCount(0);
    expect(gaAfter.length).toBeGreaterThan(0);
  });

  test('reject sets the cookie and GA never loads', async ({ page, context }) => {
    const ga: string[] = [];
    page.on('request', (r) => {
      if (r.url().includes('googletagmanager.com')) ga.push(r.url());
    });
    await page.goto('/');
    await page.getByTestId('consent-reject').click({ timeout: 5000 });
    await expect(page.getByTestId('consent-bar')).toHaveCount(0);
    await page.waitForTimeout(1200);
    expect(ga).toHaveLength(0);
    expect((await context.cookies()).find((c) => c.name === 'b7r_consent')?.value).toBe('denied');
    await page.goto('/');
    await page.waitForTimeout(1200);
    await expect(page.getByTestId('consent-bar')).toHaveCount(0);
    expect(ga).toHaveLength(0);
  });

  test('server-rendered CTA clicks and app links become events', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      // Keep the page: cancel navigation for the click under test.
      document.addEventListener('click', (e) => e.preventDefault(), { capture: false });
    });
    await page.locator('section.hero a[data-location="hero"]').click();
    const events = await page.evaluate(
      () =>
        (window as { __umamiEvents?: Array<{ name: string; data: Record<string, unknown> }> })
          .__umamiEvents ?? [],
    );
    expect(events).toEqual(
      expect.arrayContaining([
        { name: 'cta_click', data: { location: 'hero' } },
        { name: 'outbound_app_click', data: { href: '/register' } },
      ]),
    );
    // Exactly one cta_click per click: only the delegated listener fires, never an inline
    // handler on top of it.
    expect(events.filter((e) => e.name === 'cta_click')).toHaveLength(1);
  });
});
