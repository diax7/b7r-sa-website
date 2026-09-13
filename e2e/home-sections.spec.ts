import { expect, test } from '@playwright/test';

test.describe('steps (BRD 6.4.4)', () => {
  test('three steps are readable in order without JavaScript', async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto(`${baseURL}/`);
    const titles = await page.locator('#steps .steps-item h3').allTextContents();
    expect(titles).toEqual(['صمّم منتجك', 'اربط متجرك', 'نطبع ونشحن']);
    // Without JS the pinned layout must not apply: the section is not 300 vh.
    const h = await page.locator('#steps').evaluate((el) => el.getBoundingClientRect().height);
    expect(h).toBeLessThan(2000);
    await ctx.close();
  });

  test('desktop pin maps scroll position to the active step', async ({ page, isMobile }) => {
    test.skip(isMobile, 'pinned layout is desktop only');
    await page.goto('/');
    const scrollTo = (f: number) =>
      page.evaluate((fraction) => {
        const s = document.getElementById('steps')!;
        const top = s.getBoundingClientRect().top + window.scrollY;
        // Instant: the site uses smooth scrolling, which would animate past the assertion.
        window.scrollTo({
          top: top + (s.offsetHeight - window.innerHeight) * fraction,
          behavior: 'instant',
        });
      }, f);
    for (const [fraction, step] of [
      [0.05, '0'],
      [0.45, '1'],
      [0.8, '2'],
    ] as const) {
      await scrollTo(fraction);
      await page.waitForTimeout(250);
      await expect(page.locator('#steps')).toHaveAttribute('data-active', step);
      await expect(page.locator(`#steps .steps-item[data-step="${step}"]`)).toHaveAttribute(
        'aria-current',
        'step',
      );
    }
    await expect(page.locator('#steps')).toHaveCSS('min-height', /\d{3,4}px/);
    await expect(page.getByRole('link', { name: 'اعرف أكثر عن طريقة العمل' })).toHaveAttribute(
      'href',
      '/how-it-works',
    );
  });

  test('reduced motion renders the list layout on desktop', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop only');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const h = await page.locator('#steps').evaluate((el) => el.getBoundingClientRect().height);
    expect(h).toBeLessThan(2000);
    await expect(page.locator('#steps .steps-item-icon').first()).toBeVisible();
  });
});

test.describe('video (BRD 6.4.5)', () => {
  test('poster then a controlled video after play, tracked once', async ({ page, browserName }) => {
    await page.goto('/');
    await page.locator('#video').scrollIntoViewIfNeeded();
    await expect(page.locator('#video video')).toHaveCount(0);
    const play = page.getByTestId('video-play');
    await expect(play).toBeVisible();
    await play.click();
    const video = page.getByTestId('video');
    await expect(video).toHaveAttribute('controls', '');
    await expect(video).toHaveAttribute('playsinline', '');
    await expect(video).not.toHaveAttribute('autoplay');
    await expect(video).not.toHaveAttribute('loop');
    if (browserName === 'webkit') {
      await expect
        .poll(() => video.evaluate((v: HTMLVideoElement) => !v.paused || v.currentTime > 0))
        .toBe(true);
    }
    const events = await page.evaluate(
      () => (window as { __umamiEvents?: Array<{ name: string }> }).__umamiEvents ?? [],
    );
    expect(events.filter((e) => e.name === 'video_play')).toHaveLength(1);
  });
});

test.describe('why us, testimonials, integrations (BRD 6.4.6–6.4.8)', () => {
  test('why-us cards carry the exact copy', async ({ page }) => {
    await page.goto('/');
    const titles = await page.locator('#why-us h3').allTextContents();
    expect(titles).toEqual(['بدون مخاطرة', 'كل شيء تلقائي', 'جودة محلية وسريعة']);
  });

  test('testimonials show the sample badge on preview hosts', async ({ page }) => {
    await page.goto('/');
    const cards = page.locator('#testimonials [data-placeholder]');
    await expect(cards).toHaveCount(3);
    await expect(cards.first()).toContainText('نموذج');
  });

  test('integrations show three available tiles', async ({ page }) => {
    await page.goto('/');
    const tiles = page.locator('#integrations li');
    await expect(tiles).toHaveCount(3);
    for (const name of ['سلة', 'زد', 'شوبيفاي'])
      await expect(page.locator('#integrations')).toContainText(name);
    await expect(page.locator('#integrations').getByText('متاح الآن')).toHaveCount(3);
    await expect(page.locator('#integrations a')).toHaveCount(0);
    const row = await tiles.evaluateAll(
      (els) => new Set(els.map((e) => Math.round(e.getBoundingClientRect().top))).size,
    );
    expect(row).toBe(1);
  });
});

test.describe('home FAQ (BRD 6.4.9)', () => {
  test('single-open accordion with aria-expanded and tracking', async ({ page }) => {
    await page.goto('/');
    await page.locator('#faq').scrollIntoViewIfNeeded();
    const triggers = page.locator('#faq button[aria-expanded]');
    await expect(triggers).toHaveCount(5);
    await triggers.nth(0).click();
    await expect(triggers.nth(0)).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#faq')).toContainText('لا شيء. تسجّل مجاناً');
    await triggers.nth(1).click();
    await expect(triggers.nth(1)).toHaveAttribute('aria-expanded', 'true');
    await expect(triggers.nth(0)).toHaveAttribute('aria-expanded', 'false');
    const events = await page.evaluate(
      () =>
        (window as { __umamiEvents?: Array<{ name: string; data: { question?: string } }> })
          .__umamiEvents ?? [],
    );
    expect(events.filter((e) => e.name === 'faq_open').map((e) => e.data.question)).toEqual([
      'كم أحتاج لأبدأ؟',
      'كيف أربح؟',
    ]);
    await expect(page.getByRole('link', { name: 'كل الأسئلة' })).toHaveAttribute('href', '/faq');
  });
});
