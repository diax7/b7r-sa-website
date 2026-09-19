import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/** Every Level 1 route (BRD 5.1) with the H1 the copy bank gives it. */
export const ROUTES: Array<[string, string]> = [
  ['/', 'علامتك التجارية تبدأ من قطعة واحدة'],
  ['/products', 'المنتجات'],
  ['/products/tee-essential', 'تيشيرت أساسي'],
  ['/products/tote-bag', 'حقيبة قماشية'],
  ['/how-it-works', 'كيف تعمل الطباعة عند الطلب مع بحر؟'],
  ['/about', 'من نحن'],
  ['/contact', 'تواصل معنا'],
  ['/faq', 'الأسئلة الشائعة'],
  ['/blog', 'مدونة بحر'],
  ['/blog/how-to-price-printed-tshirt-saudi', 'كيف تسعّر تيشيرت مطبوع في السعودية؟'],
  ['/terms', 'الشروط والأحكام'],
  ['/shipping', 'الشحن والتوصيل'],
  ['/privacy', 'سياسة الخصوصية'],
];

test.describe('routes (BRD 5.1, 7.1, 7.4)', () => {
  for (const [path, h1] of ROUTES) {
    test(`${path} answers 200 with one H1, one JSON-LD graph, canonical and Content-Language`, async ({
      page,
    }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      expect(res?.headers()['content-language']).toBe('ar');
      expect(res?.headers()['content-security-policy']).toContain("default-src 'self'");
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('h1').first()).toContainText(h1);
      const scripts = page.locator('script[type="application/ld+json"]');
      await expect(scripts).toHaveCount(1);
      const graph = JSON.parse((await scripts.first().textContent()) ?? '{}') as {
        '@context': string;
        '@graph': Array<{ '@type': string }>;
      };
      expect(graph['@context']).toBe('https://schema.org');
      expect(graph['@graph'].length).toBeGreaterThan(0);
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(canonical).toBe(`https://b7r.sa${path === '/' ? '' : path}`);
      await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
      // Internal linking (BRD 5.3): every page reaches /products and the register URL.
      await expect(page.locator('a[href="/products"]').first()).toBeAttached();
      await expect(page.locator('a[href*="b7r.app/register"]').first()).toBeAttached();
    });
  }

  test('og:image declares the size the image really has', async ({ request }) => {
    // A render is 1200×630; a post's cover is the CMS JPEG served through the optimizer at
    // 1200 wide with its size scaled to match (site audit 2026-09-18, item 15; ADR-029,
    // amended 2026-09-19). The English home takes its own render, not the Arabic one.
    const og = async (path: string) => {
      const html = await (await request.get(path)).text();
      const read = (name: string) =>
        new RegExp(`<meta property="og:image${name}" content="([^"]+)"`).exec(html)?.[1];
      return { url: read(''), width: read(':width'), height: read(':height') };
    };
    expect(await og('/products/hoodie')).toEqual({
      url: 'https://b7r.sa/og/products/hoodie.png',
      width: '1200',
      height: '630',
    });
    const post = await og('/blog/how-to-price-printed-tshirt-saudi');
    expect(post.url).toMatch(
      /^https:\/\/b7r\.sa\/_next\/image\?url=.*cover-pricing.*&amp;w=1200&amp;q=82$/,
    );
    expect(post.width).toBe('1200');
    expect(post.height).toBe('675');
    // The share image itself answers as a JPEG under 300 KB to a scraper without an Accept header.
    const share = await request.get(
      post.url!.replace('https://b7r.sa', '').replaceAll('&amp;', '&'),
      {
        headers: { accept: '*/*' },
      },
    );
    expect(share.status()).toBe(200);
    expect(share.headers()['content-type']).toBe('image/jpeg');
    expect((await share.body()).byteLength).toBeLessThan(300 * 1024);
    expect((await og('/en')).url).toBe('https://b7r.sa/og/en/default.png');
  });

  test('the home graph is OnlineStore + WebSite; a product page carries Product + Offer', async ({
    request,
  }) => {
    const types = async (path: string) => {
      const html = await (await request.get(path)).text();
      const json = /<script type="application\/ld\+json">([^<]+)<\/script>/.exec(html)?.[1] ?? '{}';
      return (JSON.parse(json) as { '@graph': Array<{ '@type': string }> })['@graph'].map(
        (n) => n['@type'],
      );
    };
    expect(await types('/')).toEqual(['OnlineStore', 'WebSite']);
    expect(await types('/products/hoodie')).toEqual(['Product', 'BreadcrumbList']);
    expect(await types('/products')).toEqual(['ItemList', 'BreadcrumbList']);
    expect(await types('/blog/how-to-price-printed-tshirt-saudi')).toEqual([
      'BlogPosting',
      'BreadcrumbList',
    ]);
    // The FAQ page adds FAQPage (ADR-050).
    expect(await types('/faq')).toEqual(['WebPage', 'BreadcrumbList', 'FAQPage']);
  });
});

test.describe('accessibility on every route (BRD 3.13)', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop project is enough for axe');
  for (const [path] of ROUTES.filter(([p]) => p !== '/')) {
    test(`axe reports no serious or critical violations on ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('load');
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
        .analyze();
      const serious = results.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical',
      );
      expect(
        serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
      ).toEqual([]);
    });
  }
});
