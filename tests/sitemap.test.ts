import { describe, expect, it } from 'vitest';
import { pages } from '@/content/seed/pages';
import { products } from '@/content/seed/products';
import { seo } from '@/content/seed/seo';
import { site } from '@/content/seed/site';
import { manifest } from '@/modules/core/seo/manifest';
import { ANSWER_ENGINE_BOTS, robotsRules } from '@/modules/core/seo/robots';
import { contentDate, sitemapEntries } from '@/modules/core/seo/sitemap';

const BASE = 'https://b7r.sa';

describe('sitemap (BRD 7.5)', () => {
  // The code-owned routes stay in seo-defaults; the seven designed pages are `pages` rows.
  const codeRoutes = seo.filter((s) => ['/', '/products', '/blog'].includes(s.route));
  const blog = {
    posts: [
      { slug: 'first-post', publishedAt: '2026-09-13T09:00:00.000Z', contentUpdatedAt: null },
      {
        slug: 'second-post',
        publishedAt: '2026-09-14T09:00:00.000Z',
        contentUpdatedAt: '2026-10-01T09:00:00.000Z',
      },
    ],
    hubs: [{ slug: 'pricing-profit' }],
    authors: [{ slug: 'dhia' }],
  };
  const entries = sitemapEntries(BASE, [{ locale: 'ar', seo: codeRoutes, pages, products, blog }]);
  const urls = entries.map((e) => e.url);

  it('pairs the routes that exist in both languages with hreflang alternates (ADR-043)', () => {
    const both = sitemapEntries(BASE, [
      { locale: 'ar', seo: codeRoutes, pages, products, blog },
      { locale: 'en', seo: codeRoutes, pages: pages.slice(0, 1), products },
    ]);
    const urlsOfBoth = both.map((e) => e.url);
    expect(urlsOfBoth).toContain(`${BASE}/en`);
    expect(urlsOfBoth).toContain(`${BASE}/en/products/${products[0]!.slug}`);
    // The Arabic home and its English twin point at each other, x-default on the Arabic.
    const home = both.find((e) => e.url === BASE);
    expect(home?.alternates?.languages).toEqual({ ar: BASE, en: `${BASE}/en`, 'x-default': BASE });
    const enHome = both.find((e) => e.url === `${BASE}/en`);
    expect(enHome?.alternates?.languages).toEqual(home?.alternates?.languages);
    // A page without an English twin carries no alternates; the blog exists in Arabic only.
    const only = both.find((e) => e.url === `${BASE}/${pages[1]!.slug}`);
    expect(only?.alternates).toBeUndefined();
    expect(urlsOfBoth.filter((u) => u.startsWith(`${BASE}/en/blog/`))).toEqual([]);
    expect(new Set(urlsOfBoth).size).toBe(urlsOfBoth.length);
  });

  it('lists every static page, product, post, hub and author, nothing else', () => {
    for (const page of codeRoutes) {
      expect(urls).toContain(page.route === '/' ? BASE : `${BASE}${page.route}`);
    }
    for (const page of pages) expect(urls).toContain(`${BASE}/${page.slug}`);
    for (const p of products) expect(urls).toContain(`${BASE}/products/${p.slug}`);
    expect(urls).toContain(`${BASE}/blog/first-post`);
    expect(urls).toContain(`${BASE}/blog/category/pricing-profit`);
    expect(urls).toContain(`${BASE}/author/dhia`);
    expect(urls.some((u) => u.includes('/page/'))).toBe(false);
    const second = entries.find((e) => e.url.endsWith('/blog/second-post'));
    expect(second?.lastModified).toEqual(new Date('2026-10-01T09:00:00.000Z'));
    expect(urls.some((u) => u.includes('/api') || u.includes('?') || u.endsWith('/'))).toBe(false);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it('carries a full ISO timestamp per dated entry and product photos as image entries', () => {
    for (const e of entries) {
      if (e.lastModified !== undefined) expect(e.lastModified).toBeInstanceOf(Date);
    }
    expect(contentDate('2026-09-13').toISOString()).toBe('2026-09-13T00:00:00.000Z');
    const hoodie = entries.find((e) => e.url.endsWith('/products/hoodie'));
    expect(hoodie?.images).toEqual(
      expect.arrayContaining([`${BASE}/images/products/hoodie/white-front.jpg`]),
    );
    expect(hoodie?.images?.length).toBe(4);
  });

  it('dates legal pages from the legal body so the visible date, JSON-LD and sitemap agree', () => {
    for (const legal of pages.filter((p) => p.blocks[0]?.blockType === 'legalBody')) {
      const entry = entries.find((e) => e.url === `${BASE}/${legal.slug}`);
      expect(entry?.lastModified).toEqual(contentDate(legal.updatedAt));
    }
  });
});

describe('robots (BRD 7.2)', () => {
  it('disallows everything off the production origin', () => {
    expect(robotsRules(false, BASE)).toEqual({ rules: { userAgent: '*', disallow: '/' } });
  });

  it('allows the site, blocks the API, admin, the search query and UTM variants, names the bots', () => {
    const rules = robotsRules(true, BASE);
    const list = Array.isArray(rules.rules) ? rules.rules : [rules.rules];
    expect(list[0]).toEqual({
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/', '/*?q=', '/*&utm_'],
    });
    for (const bot of ANSWER_ENGINE_BOTS) {
      expect(list.find((r) => r.userAgent === bot)?.allow).toBe('/');
    }
    expect(rules.sitemap).toBe(`${BASE}/sitemap.xml`);
  });
});

describe('manifest (BRD 7.3)', () => {
  it('is Arabic, RTL, brand-coloured, display browser, with two icons', () => {
    const m = manifest(site);
    expect(m.name).toBe(site.brandName);
    expect(m.lang).toBe('ar');
    expect(m.dir).toBe('rtl');
    expect(m.display).toBe('browser');
    expect(m.theme_color?.toLowerCase()).toBe('#0058b0');
    expect(m.background_color?.toLowerCase()).toBe('#ffffff');
    expect(m.icons?.map((i) => i.sizes)).toEqual(['192x192', '512x512']);
  });
});
