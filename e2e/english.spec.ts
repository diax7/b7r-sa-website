import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/** Every English route of 5a (the blog follows in 5b). */
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
    // The blog exists in Arabic only in 5a: no pair, no English link.
    const blog = await (await request.get('/blog')).text();
    expect(blog).not.toContain('<link rel="alternate" hrefLang="en"');
  });

  test('the sitemap lists both languages with alternates on the pairs', async ({ request }) => {
    const xml = await (await request.get('/sitemap.xml')).text();
    expect(xml).toContain('<loc>https://b7r.sa/en</loc>');
    expect(xml).toContain('<loc>https://b7r.sa/en/products/tee-essential</loc>');
    expect(xml).toContain('hreflang="x-default" href="https://b7r.sa"');
    expect(xml).toContain('hreflang="en" href="https://b7r.sa/en/products/tee-essential"');
    expect(xml).not.toContain('<loc>https://b7r.sa/en/blog');
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
    await expect(toArabic).toHaveText('العربية');
    await expect(toArabic).toHaveAttribute('hreflang', 'ar');
    await expect(toArabic).toHaveAttribute('href', '/products/hoodie');
    await toArabic.click();
    await expect(page).toHaveURL('/products/hoodie');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    const toEnglish = (await openSwitch()).and(page.locator('[data-language-switch="en"]'));
    await expect(toEnglish).toHaveText('English');
    await expect(toEnglish).toHaveAttribute('href', '/en/products/hoodie');
    // A page without an English twin sends the switch to the English home.
    await page.goto('/blog');
    const fromBlog = (await openSwitch()).and(page.locator('[data-language-switch="en"]'));
    await expect(fromBlog).toHaveAttribute('href', '/en');
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
    // /en/blog waits for 5b.
    expect((await request.get('/en/blog')).status()).toBe(404);
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

  test('axe reports no serious or critical violations on the English home and a product', async ({
    page,
  }) => {
    for (const path of ['/en', '/en/products/tee-essential']) {
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
