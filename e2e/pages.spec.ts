import { expect, type Page, test } from '@playwright/test';

/** The progress line's extent along the track's axis (height on phones, width from lg). */
async function progressExtent(page: Page) {
  return page.locator('[data-flow] .flow-track').evaluate((track) => {
    const line = track.querySelector('.flow-progress')!.getBoundingClientRect();
    const box = track.getBoundingClientRect();
    const inline = box.width > box.height;
    return { line: inline ? line.width : line.height, track: inline ? box.width : box.height };
  });
}

/** Scrolls so the track's start edge sits 40 px above the bottom of the viewport. */
async function scrollToTrackEntry(page: Page) {
  await page.locator('[data-flow] .flow-track').evaluate((el) => {
    window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - window.innerHeight + 40);
  });
  await page.waitForTimeout(300);
}

test.describe('how it works (BRD 6.7)', () => {
  test('five steps, the profit equation and the mini FAQ', async ({ page }) => {
    await page.goto('/how-it-works');
    await expect(page.locator('ol li h2')).toHaveCount(5);
    await expect(page.locator('ol li h2').first()).toHaveText('أنشئ حسابك مجاناً');
    // The connected path: one track with a progress line, five numbered icons.
    await expect(page.locator('[data-flow] .flow-track .flow-progress')).toHaveCount(1);
    await expect(page.locator('[data-flow] .flow-number')).toHaveText(['1', '2', '3', '4', '5']);
    const equation = page.locator('[data-equation]');
    await expect(equation).toContainText('سعر البيع');
    await expect(equation).toContainText('ربحك');
    // The example line renders 89, 45 and 44 as SarAmount.
    const digits = page.locator('[aria-labelledby="profit-title"] [data-sar-digits]');
    await expect(digits).toHaveText(['89', '45', '44']);
    await expect(page.getByRole('link', { name: 'كل الأسئلة' })).toHaveAttribute('href', '/faq');
    await expect(page.locator('[data-block="faqList"]')).toContainText('كيف أربح؟');
  });

  test('the progress line fills as the track scrolls through the viewport', async ({
    page,
    browserName,
  }) => {
    // Playwright's Linux WebKit claims support but evaluates the timeline once at load and
    // not on a programmatic scroll (the line stayed at 12 % on the runner); Chromium is the
    // engine that proves the progress moves. The reduced-motion test below runs everywhere.
    test.skip(browserName === 'webkit', 'headless WebKit does not advance scroll timelines');
    await page.goto('/how-it-works');
    const supported = await page.evaluate(() => CSS.supports('animation-timeline: view()'));
    test.skip(!supported, 'no scroll-driven animations in this browser: the line is simply full');
    await scrollToTrackEntry(page);
    const entering = await progressExtent(page);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(300);
    const passed = await progressExtent(page);
    expect(entering.line).toBeLessThan(passed.line);
    expect(Math.abs(passed.line - passed.track)).toBeLessThanOrEqual(1);
  });

  test('the progress line is full and static under reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/how-it-works');
    await scrollToTrackEntry(page);
    const entering = await progressExtent(page);
    expect(Math.abs(entering.line - entering.track)).toBeLessThanOrEqual(1);
    const animation = await page
      .locator('[data-flow] .flow-progress')
      .evaluate((el) => getComputedStyle(el).animationName);
    expect(animation).toBe('none');
  });
});

test.describe('about (BRD 6.8)', () => {
  test('story, three cards, the Misk block and the location line', async ({ page }) => {
    await page.goto('/about');
    await expect(page.locator('h2', { hasText: 'حكاية بدأت' })).toBeVisible();
    for (const title of ['رسالتنا', 'رؤيتنا', 'قيمنا']) {
      await expect(page.locator('h2', { hasText: title })).toBeAttached();
    }
    await expect(page.locator('img[alt="Misk Foundation"]')).toBeAttached();
    await expect(page.getByText('نطبع ونشحن من جدة إلى كل مدن المملكة.')).toBeVisible();
    // Decorative photo only: alt="" and never a product link.
    await expect(page.locator('img[src*="lifestyle"]')).toHaveAttribute('alt', '');
    // Facts band: the welcome credit and the three why-us pairs (title over text), no new copy.
    const facts = page.locator('section.bg-navy');
    await expect(facts).toHaveAttribute('aria-label', 'لماذا يختارنا التجار؟');
    await expect(facts.locator('[data-sar-digits]')).toHaveText('30');
    for (const [title, text] of [
      ['بدون مخاطرة', 'صفر رأس مال، صفر مخزون، بدون حد أدنى للطلبات.'],
      ['كل شيء تلقائي', 'الطلبات تتزامن من متجرك وتُنفّذ بدون تدخل منك.'],
      ['جودة محلية وسريعة', 'طباعة في جدة وتوصيل لكل المملكة خلال 5 أيام.'],
    ]) {
      await expect(facts.getByText(title!, { exact: true })).toBeVisible();
      await expect(facts.getByText(text!, { exact: true })).toBeVisible();
    }
  });
});

test.describe('FAQ page (BRD 6.10)', () => {
  test('groups as H2s with accordions, a group nav on desktop, the WhatsApp line', async ({
    page,
    isMobile,
  }) => {
    await page.goto('/faq');
    const groups = page.locator('section[id^="faq-group-"]');
    await expect(groups).toHaveCount(5);
    await expect(groups.first().locator('h2')).toHaveText('البداية');
    const nav = page.getByRole('navigation', { name: 'أقسام الأسئلة' });
    if (isMobile) {
      await expect(nav).toBeHidden();
    } else {
      await expect(nav).toBeVisible();
      await expect(nav.locator('a')).toHaveCount(5);
      await nav.locator('a').nth(2).click();
      await expect(page).toHaveURL(/#faq-group-3$/);
    }
    // Accordion mounts near the viewport and opens one item at a time.
    const first = groups.first();
    await first.scrollIntoViewIfNeeded();
    const trigger = first.getByRole('button', { name: 'كم أحتاج لأبدأ؟' });
    await expect(trigger).toBeVisible({ timeout: 10_000 });
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const wa = page.locator('a[data-track="whatsapp_click"][data-location="contact"]');
    await expect(wa).toHaveAttribute('href', 'https://wa.me/966501699572');
    // No FAQPage schema (rich results discontinued).
    const graph = await page.locator('script[type="application/ld+json"]').textContent();
    expect(graph).not.toContain('FAQPage');
  });
});

test.describe('legal pages (BRD 6.12)', () => {
  test('render Appendix B with numbered H2s, the updated line and the on-this-page list', async ({
    page,
    isMobile,
  }) => {
    await page.goto('/terms');
    await expect(page.locator('h1')).toHaveText('الشروط والأحكام');
    await expect(page.getByText(/آخر تحديث:/)).toBeVisible();
    const headings = page.locator('.prose h2');
    await expect(headings).toHaveCount(9);
    await expect(headings.first()).toHaveAttribute('id', 'legal-section-1');
    await expect(headings.first()).toContainText('1. التعاريف والطرفان');
    const nav = page.getByRole('navigation', { name: 'في هذه الصفحة' });
    if (isMobile) {
      await expect(nav).toBeHidden();
    } else {
      await expect(nav.locator('a')).toHaveCount(9);
      await nav.locator('a').nth(5).click();
      await expect(page).toHaveURL(/#legal-section-6$/);
    }
    // The visible date equals the JSON-LD dateModified.
    const graph = JSON.parse(
      (await page.locator('script[type="application/ld+json"]').textContent()) ?? '{}',
    ) as { '@graph': Array<{ '@type': string; dateModified?: string }> };
    const webPage = graph['@graph'].find((n) => n['@type'] === 'WebPage');
    await expect(page.locator('time')).toHaveAttribute('datetime', webPage?.dateModified ?? '');
  });

  test('shipping and privacy share the template', async ({ page }) => {
    await page.goto('/shipping');
    await expect(page.locator('h1')).toHaveText('الشحن والتوصيل');
    await page.goto('/privacy');
    await expect(page.locator('h1')).toHaveText('سياسة الخصوصية');
    await expect(page.locator('.prose h2').first()).toBeAttached();
  });
});

test.describe('blog (BRD 6.11, 10.1)', () => {
  test('index: the newest post featured, the hub pages, the search island, the newsletter', async ({
    page,
  }) => {
    await page.goto('/blog');
    const cards = page.locator('[data-post-listing] [data-post-card]');
    await expect(cards).toHaveCount(3);
    await expect(page.locator('[data-post-card="featured"]')).toHaveCount(1);
    // Hub chips are links to the hub pages (ADR-041): no query string, every page static.
    await page.locator('[data-hub-chips] a[href="/blog/category/pricing-profit"]').click();
    await expect(page).toHaveURL(/\/blog\/category\/pricing-profit$/);
    await expect(page.locator('h1')).toHaveText('التسعير والربح');
    await expect(page.locator('[data-post-grid] li')).toHaveCount(1);
    await expect(page.locator('[data-post-grid] li').first()).toContainText('كيف تسعّر تيشيرت');
    await page.locator('[data-hub-chips] a[href="/blog/category/seasons"]').click();
    await expect(page.locator('[data-hub-empty]')).toBeVisible();
    await page.locator('[data-hub-chips] a[href="/blog"]').click();
    await expect(cards).toHaveCount(3);
    // The search island: results in place of the listing, the URL carries `q`, a deep link works.
    const search = page.locator('[data-blog-search] input');
    await search.fill('تسعير');
    await expect(page.locator('[data-blog-results] a')).toHaveCount(1);
    await expect(page.locator('[data-post-listing]')).toBeHidden();
    await expect(page).toHaveURL(/\?q=/);
    await search.fill('xyzxyz');
    await expect(page.locator('[data-blog-results]')).toContainText('لا نتائج');
    await page.goto('/blog?q=الطباعة');
    await expect(page.locator('[data-blog-results] a')).toHaveCount(1);
    await expect(
      page.locator('[aria-labelledby="blog-newsletter-title"] [data-testid="newsletter-form"]'),
    ).toBeAttached();
    // Pagination is static: page 1 is `/blog`, an out-of-range page is a 404.
    expect((await page.request.get('/blog/page/1')).status()).toBe(404);
    expect((await page.request.get('/blog/page/99')).status()).toBe(404);
    expect((await page.request.get('/blog/category/nope')).status()).toBe(404);
  });

  test('author page and feed', async ({ page, request }) => {
    await page.goto('/author/dhia');
    await expect(page.locator('h1')).toHaveText('ضياء');
    await expect(page.locator('[data-post-grid] li')).toHaveCount(3);
    const feed = await request.get('/feed.xml');
    expect(feed.status()).toBe(200);
    expect(feed.headers()['content-type']).toContain('application/rss+xml');
    const xml = await feed.text();
    expect(xml).toContain('<rss version="2.0"');
    expect((xml.match(/<item>/g) ?? []).length).toBe(3);
    expect(xml).toContain('<content:encoded><![CDATA[<p>');
    // Every link inside the feed is absolute (a reader shows the post off-site).
    expect(xml).not.toMatch(/href="\//);
    expect(xml).toContain('href="https://b7r.sa/products/tee-essential"');
    // The cover is an enclosure with its real size (RSS 2.0), never a zero length.
    expect(xml).toMatch(
      /<enclosure url="https:\/\/b7r\.sa\/[^"]+" type="image\/jpeg" length="[1-9]\d+" \/>/,
    );
  });

  test('post template: takeaways, table of contents, in-post CTA after the second H2, share, author, related', async ({
    page,
    browserName,
    isMobile,
  }) => {
    await page.goto('/blog/what-is-print-on-demand-saudi-examples');
    // The table of contents: a rail beside the body on a desktop, a folded list on a phone,
    // both pointing at the `section-n` ids the renderer gives the H2s.
    const toc = page.locator(isMobile ? '[data-toc="folded"]' : '[data-toc="rail"]');
    await expect(toc.locator('a')).toHaveCount(4);
    await expect(toc.locator('a').first()).toHaveAttribute('href', '#section-1');
    await expect(page.locator('article h2#section-1')).toBeAttached();
    await expect(page.locator('h1')).toHaveText(
      'ما هي الطباعة عند الطلب؟ شرح مبسط بالأمثلة السعودية',
    );
    await expect(page.locator('article header')).toContainText(
      'كتبه ضياء · 13 سبتمبر 2026 · دقيقة قراءة',
    );
    await expect(page.locator('[aria-labelledby="post-takeaways-title"] li')).toHaveCount(3);
    // CTA sits after the second H2 and before the third.
    const order = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll('article .prose h2, article [data-post-cta]')];
      return nodes.map((n) => (n.hasAttribute('data-post-cta') ? 'cta' : 'h2'));
    });
    expect(order.slice(0, 3)).toEqual(['h2', 'h2', 'cta']);
    await expect(page.locator('[data-post-cta] a')).toHaveAttribute('href', /b7r\.app\/register/);
    const share = page.locator('[data-share]');
    await expect(share.getByRole('link', { name: 'شارك على واتساب' })).toHaveAttribute(
      'href',
      /wa\.me\/\?text=/,
    );
    await expect(share.getByRole('link', { name: 'شارك على X' })).toHaveAttribute(
      'href',
      /x\.com\/intent\/post/,
    );
    if (browserName === 'chromium') {
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
      await share.getByRole('button', { name: 'انسخ الرابط' }).click();
      await expect(share.locator('[data-share-copied]')).toHaveText('نُسخ الرابط');
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
        'https://b7r.sa/blog/what-is-print-on-demand-saudi-examples',
      );
    }
    await expect(page.locator('[data-author] a[href="/author/dhia"]')).toHaveText('ضياء');
    await expect(page.locator('[aria-labelledby="related-title"] a[href^="/blog/"]')).toHaveCount(
      2,
    );
  });
});
