import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/** Every English route: the designed pages (5a) and the blog (5b). */
const ROUTES = [
  '/en',
  '/en/products',
  '/en/products/tee-essential',
  '/en/products/tote-bag',
  '/en/how-it-works',
  '/en/about',
  '/en/contact',
  '/en/faq',
  '/en/terms',
  '/en/shipping',
  '/en/privacy',
  '/en/blog',
  '/en/blog/how-to-price-printed-tshirt-saudi',
  '/en/blog/category/pricing-profit',
  '/en/author/dhia',
];

const ARABIC = /[؀-ۿ]/;
/** One client IP per run for the contact post: the limiter allows five per ten minutes. */
const RUN = Date.now() % 65_536;
const CLIENT_IP = { 'x-forwarded-for': `10.${RUN >> 8}.${RUN & 255}.40` };
/** Arabic that may appear on an English page: the language's own name in the switch, the riyal's name. */
const ALLOWED_ARABIC = ['العربية', 'ريال سعودي'];

function mainText(html: string): string {
  const start = html.indexOf('<main');
  const end = html.indexOf('</main>');
  const main = html.slice(start, end).replace(/<script[\s\S]*?<\/script>/g, '');
  const attrs = (main.match(/(?:alt|aria-label|title|placeholder)="([^"]*)"/g) ?? []).join(' ');
  return `${main.replace(/<[^>]+>/g, ' ')} ${attrs}`;
}

test.describe('the English site (Level 5a, ADR-043)', () => {
  test('every English route is a static English document with no Arabic prose', async ({
    request,
  }) => {
    for (const path of ROUTES) {
      const res = await request.get(path);
      expect(res.status(), path).toBe(200);
      expect(res.headers()['content-language'], path).toBe('en');
      const html = await res.text();
      expect(html, path).toContain('<html lang="en" dir="ltr"');
      expect(html, path).toContain('<meta http-equiv="content-language" content="en"');
      expect(html, path).not.toContain('__next_error__');
      const text = mainText(html);
      const leaked = text
        .split(/\s+/)
        .filter((w) => ARABIC.test(w) && !ALLOWED_ARABIC.some((ok) => w.includes(ok)));
      expect(leaked, `${path}: Arabic in the English document`).toEqual([]);
    }
    // Prerendered like its twin (constitution II).
    const cached = await request.get('/en');
    expect(cached.headers()['x-nextjs-cache']).toMatch(/HIT|STALE/);
  });

  test('hreflang pairs point both ways, x-default on the Arabic, each language canonical to itself', async ({
    request,
  }) => {
    for (const [ar, en] of [
      ['/', '/en'],
      ['/products', '/en/products'],
      ['/products/hoodie', '/en/products/hoodie'],
      ['/faq', '/en/faq'],
      ['/blog', '/en/blog'],
      ['/blog/how-to-price-printed-tshirt-saudi', '/en/blog/how-to-price-printed-tshirt-saudi'],
      ['/blog/category/design', '/en/blog/category/design'],
      ['/author/dhia', '/en/author/dhia'],
    ]) {
      const arHtml = await (await request.get(ar!)).text();
      const enHtml = await (await request.get(en!)).text();
      const arUrl = `https://b7r.sa${ar === '/' ? '' : ar}`;
      const enUrl = `https://b7r.sa${en}`;
      for (const html of [arHtml, enHtml]) {
        expect(html, ar).toContain(`<link rel="alternate" hrefLang="ar" href="${arUrl}"/>`);
        expect(html, ar).toContain(`<link rel="alternate" hrefLang="en" href="${enUrl}"/>`);
        expect(html, ar).toContain(`<link rel="alternate" hrefLang="x-default" href="${arUrl}"/>`);
      }
      expect(arHtml).toContain(`<link rel="canonical" href="${arUrl}"/>`);
      expect(enHtml).toContain(`<link rel="canonical" href="${enUrl}"/>`);
      expect(arHtml).toContain('<meta property="og:locale" content="ar_SA"/>');
      expect(arHtml).toContain('<meta property="og:locale:alternate" content="en_US"/>');
      expect(enHtml).toContain('<meta property="og:locale" content="en_US"/>');
      expect(enHtml).toContain('<meta property="og:locale:alternate" content="ar_SA"/>');
    }
    // Each document announces its own language's feed.
    const arHome = await (await request.get('/')).text();
    const enHome = await (await request.get('/en')).text();
    expect(arHome).toContain('type="application/rss+xml" href="https://b7r.sa/feed.xml"');
    expect(enHome).toContain('type="application/rss+xml" href="https://b7r.sa/en/feed.xml"');
  });

  test('the sitemap lists both languages with alternates on the pairs', async ({ request }) => {
    const xml = await (await request.get('/sitemap.xml')).text();
    expect(xml).toContain('<loc>https://b7r.sa/en</loc>');
    expect(xml).toContain('<loc>https://b7r.sa/en/products/tee-essential</loc>');
    expect(xml).toContain('hreflang="x-default" href="https://b7r.sa"');
    expect(xml).toContain('hreflang="en" href="https://b7r.sa/en/products/tee-essential"');
    expect(xml).toContain('<loc>https://b7r.sa/en/blog</loc>');
    expect(xml).toContain(
      'hreflang="en" href="https://b7r.sa/en/blog/how-to-price-printed-tshirt-saudi"',
    );
    expect(xml).toContain('<loc>https://b7r.sa/en/blog/category/seasons</loc>');
    expect(xml).toContain('<loc>https://b7r.sa/en/author/dhia</loc>');
  });

  test('the English feed lists the English posts under the English prefix (5b)', async ({
    request,
  }) => {
    const res = await request.get('/en/feed.xml');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('application/rss+xml');
    const xml = await res.text();
    expect(xml).toContain('<language>en</language>');
    expect(xml).toContain('<link>https://b7r.sa/en/blog</link>');
    expect(xml).toContain('<atom:link href="https://b7r.sa/en/feed.xml" rel="self"');
    expect(xml).toContain('<link>https://b7r.sa/en/blog/how-to-price-printed-tshirt-saudi</link>');
    expect(xml).toContain('<title>How to price a printed T-shirt in Saudi Arabia</title>');
    expect(xml).toContain('href="https://b7r.sa/en/products/tee-essential"');
    expect(xml).not.toMatch(/[؀-ۿ]/);
    // The Arabic feed is untouched by the English one.
    const ar = await (await request.get('/feed.xml')).text();
    expect(ar).toContain('<link>https://b7r.sa/blog</link>');
    expect(ar).not.toContain('/en/');
  });

  test('the English post: English body, links and meta line; the pair links both ways (5b)', async ({
    request,
  }) => {
    const html = await (await request.get('/en/blog/how-to-price-printed-tshirt-saudi')).text();
    expect(html).toContain(
      '<title>How to price a printed T-shirt in Saudi Arabia | B7R Print</title>',
    );
    expect(html).toContain('"@type":"BlogPosting"');
    expect(html).toContain('"inLanguage":"en"');
    expect(html).toContain('href="/en/products/tee-essential"');
    expect(html).toContain('href="/en/how-it-works"');
    expect(html).toContain('min read');
    expect(html).toContain('<meta property="og:type" content="article"/>');
    // The English index and hub pages carry the English titles and hub names.
    const index = await (await request.get('/en/blog')).text();
    expect(index).toContain('Pricing and profit');
    expect(index).toContain('Start a clothing brand in Saudi Arabia with no factory and no stock');
    const hub = await (await request.get('/en/blog/category/pricing-profit')).text();
    expect(hub).toContain('<h1');
    expect(hub).toContain('How to price a printed T-shirt in Saudi Arabia');
    // Beyond the last page and an unknown post: 404 as on the Arabic side.
    expect((await request.get('/en/blog/page/2')).status()).toBe(404);
    expect((await request.get('/en/blog/no-such-post')).status()).toBe(404);
    expect((await request.get('/en/blog/category/no-such-hub')).status()).toBe(404);
  });

  test('English metadata and JSON-LD carry the English titles, template and language', async ({
    request,
  }) => {
    const html = await (await request.get('/en/products/tee-essential')).text();
    expect(html).toContain('<title>Essential T-shirt for print on demand | B7R Print</title>');
    expect(html).toContain('"url":"https://b7r.sa/en/products/tee-essential"');
    expect(html).toContain('Merchant cost');
    const faq = await (await request.get('/en/faq')).text();
    expect(faq).toContain('"inLanguage":"en"');
    // The English FAQ page carries its own FAQPage node (ADR-050), the English questions.
    expect(faq).toContain('"@id":"https://b7r.sa/en/faq#faq"');
    expect(faq).toMatch(/"@type":"Question","name":"[^"]*\?"/);
    expect(faq).toContain('"@id":"https://b7r.sa/en/faq#webpage"');
    const home = await (await request.get('/en')).text();
    expect(home).toContain('<title>B7R Print: print on demand in Saudi Arabia</title>');
    expect(home).toContain('"availableLanguage":["ar","en"]');
  });

  test('the switch links the twin in the other language, in its own name', async ({
    page,
    isMobile,
  }) => {
    // Phones carry the switch inside the menu; the desktop header shows it inline.
    const openSwitch = async () => {
      if (!isMobile) return page.locator('header [data-language-switch]');
      await page.getByTestId('menu-open').click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      return dialog.locator('[data-language-switch]');
    };
    await page.goto('/en/products/hoodie');
    const toArabic = (await openSwitch()).and(page.locator('[data-language-switch="ar"]'));
    // An icon (ADR-044): the target language's name is the tooltip, the copy bank the label.
    await expect(toArabic).toHaveText('');
    await expect(toArabic).toHaveAttribute('data-tooltip', 'العربية');
    await expect(toArabic).toHaveAttribute('aria-label', 'Switch to the Arabic site');
    await expect(toArabic).toHaveAttribute('hreflang', 'ar');
    await expect(toArabic).toHaveAttribute('href', '/products/hoodie');
    await toArabic.click();
    await expect(page).toHaveURL('/products/hoodie');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    const toEnglish = (await openSwitch()).and(page.locator('[data-language-switch="en"]'));
    await expect(toEnglish).toHaveAttribute('data-tooltip', 'English');
    await expect(toEnglish).toHaveAttribute('href', '/en/products/hoodie');
    // The blog has its twin too (5b).
    await page.goto('/blog/how-to-price-printed-tshirt-saudi');
    const fromPost = (await openSwitch()).and(page.locator('[data-language-switch="en"]'));
    await expect(fromPost).toHaveAttribute('href', '/en/blog/how-to-price-printed-tshirt-saudi');
  });

  test('the switch follows client-side navigation instead of pointing at the first page (ADR-044)', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'the desktop header keeps the switch mounted across navigations');
    await page.goto('/');
    const toEnglish = page.locator('header [data-language-switch="en"]');
    await expect(toEnglish).toHaveAttribute('href', '/en');
    await page.locator('header nav').getByRole('link', { name: 'المنتجات' }).click();
    await expect(page).toHaveURL('/products');
    await expect(toEnglish).toHaveAttribute('href', '/en/products');
    await page.locator('header nav').getByRole('link', { name: 'المدونة' }).click();
    await expect(page).toHaveURL('/blog');
    await expect(toEnglish).toHaveAttribute('href', '/en/blog');
    await toEnglish.click();
    await expect(page).toHaveURL('/en/blog');
    const toArabic = page.locator('header [data-language-switch="ar"]');
    await page.locator('header nav').getByRole('link', { name: 'Products' }).click();
    await expect(page).toHaveURL('/en/products');
    await expect(toArabic).toHaveAttribute('href', '/products');
  });

  test('the English hero mirrors the layout with its own photos (ADR-044)', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'desktop composition');
    await page.goto('/en');
    const width = page.viewportSize()!.width;
    const h1 = (await page.locator('h1').boundingBox())!;
    expect(h1.x).toBeLessThan(width / 4);
    // The English photos are the `hero-en-*` media, not the Arabic set.
    const img = page.locator('[data-hero-image="0"]');
    await expect(img).toHaveAttribute('src', /hero-en-set-a-mobile/);
    // The overlay carries the admin's colour and sits at the start edge.
    await expect(page.locator('[data-hero-overlay]')).toHaveAttribute(
      'data-hero-overlay',
      '#ffffff',
    );
    // Two rows of headline, one of subline at 1280 (the strings and the size are set for it).
    const lineHeight = await page
      .locator('h1')
      .evaluate((el) => parseFloat(getComputedStyle(el).lineHeight));
    expect(Math.round(h1.height / lineHeight)).toBe(2);
    // The dots row is full width; its list sits at the start edge (the left in English).
    const dots = (await page.locator('.hero-dots ul').boundingBox())!;
    expect(dots.x + dots.width / 2).toBeLessThan(width / 4);
  });

  test('the layout mirrors: the logo sits at the start of the header in both documents', async ({
    page,
  }) => {
    const width = page.viewportSize()!.width;
    await page.goto('/en');
    const logo = page.locator('header a[aria-label]').first();
    const box = (await logo.boundingBox())!;
    expect(box.x).toBeLessThan(width / 4);
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    await page.goto('/');
    const arBox = (await page.locator('header a[aria-label]').first().boundingBox())!;
    expect(arBox.x + arBox.width).toBeGreaterThan((width * 3) / 4);
  });

  test('an unknown English URL is the one bilingual 404 document, never the bare shell', async ({
    request,
  }) => {
    for (const path of ['/en/no-such-page', '/en/nope-123']) {
      const res = await request.get(path);
      expect(res.status(), path).toBe(404);
      const html = await res.text();
      expect(html, path).toContain('<html lang="ar" dir="rtl"');
      expect(html, path).not.toContain('__next_error__');
      expect(html, path).toContain('الصفحة غير موجودة');
      expect(html, path).toContain('data-not-found-en');
      expect(html, path).toContain('Page not found');
      expect(html, path).toContain('href="/en"');
    }
    // An unknown product under /en behaves like its Arabic twin (ADR-030).
    expect((await request.get('/en/products/no-such-product')).status()).toBe(404);
  });

  test('the contact form works in English and posts its locale', async ({ page }) => {
    await page.setExtraHTTPHeaders(CLIENT_IP);
    await page.goto('/en/contact');
    await expect(page.locator('h1')).toHaveText('Contact us');
    await page.getByRole('button', { name: 'Send the message' }).click();
    await expect(page.getByText('Enter your name')).toBeVisible();
    const posted = page.waitForRequest(
      (r) => r.url().endsWith('/api/contact') && r.method() === 'POST',
    );
    const form = page.getByTestId('contact-form');
    await form.locator('input[name="name"]').fill('Jane Tester');
    await form.locator('input[name="phone"]').fill('0501234567');
    await form.locator('input[name="email"]').fill('jane@example.com');
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Merchant' }).click();
    await page.locator('textarea[name="message"]').fill('Hello from the English site.');
    await page.getByRole('button', { name: 'Send the message' }).click();
    const body = (await posted).postDataJSON() as { locale: string; inquiry: string };
    expect(body.locale).toBe('en');
    expect(body.inquiry).toBe('Merchant');
    await expect(page.getByTestId('contact-success')).toContainText('We received your message.');
  });

  test('axe reports no serious or critical violations on the English home, a product, the blog and a post', async ({
    page,
  }) => {
    for (const path of [
      '/en',
      '/en/products/tee-essential',
      '/en/blog',
      '/en/blog/how-to-price-printed-tshirt-saudi',
    ]) {
      await page.goto(path);
      await page.waitForLoadState('load');
      if (path === '/en') {
        // Mount the lazy islands and let the steps reveal, as the Arabic scan does.
        await page.locator('#designer').scrollIntoViewIfNeeded();
        await page.waitForSelector('[data-designer-island] canvas', { timeout: 15_000 });
        await page.locator('#video').scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        await page.evaluate(() => window.scrollTo(0, 0));
      }
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .exclude('[data-designer-island]')
        .analyze();
      const serious = results.violations.filter((v) =>
        ['serious', 'critical'].includes(v.impact ?? ''),
      );
      expect(
        serious.map((v) => `${v.id}: ${v.nodes.length}`),
        path,
      ).toEqual([]);
    }
  });
});
