import { describe, expect, it } from 'vitest';
import { blogPosts } from '@/content/blog';
import { getLegalPages } from '@/content/legal';
import { products } from '@/content/products';
import { seo } from '@/content/seo';
import { site } from '@/content/site';
import { manifest } from '@/modules/core/seo/manifest';
import { ANSWER_ENGINE_BOTS, robotsRules } from '@/modules/core/seo/robots';
import { contentDate, sitemapEntries } from '@/modules/core/seo/sitemap';

const BASE = 'https://b7r.sa';

describe('sitemap (BRD 7.5)', () => {
  const entries = sitemapEntries(BASE);
  const urls = entries.map((e) => e.url);

  it('lists every static page, every product and every published post, nothing else', () => {
    for (const page of seo) {
      expect(urls).toContain(page.route === '/' ? BASE : `${BASE}${page.route}`);
    }
    for (const p of products) expect(urls).toContain(`${BASE}/products/${p.slug}`);
    expect(urls.filter((u) => u.includes('/blog/'))).toHaveLength(blogPosts.length);
    expect(urls.some((u) => u.includes('/api') || u.includes('?') || u.endsWith('/'))).toBe(false);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it('carries a full ISO timestamp per entry and product photos as image entries', () => {
    for (const e of entries) expect(e.lastModified).toBeInstanceOf(Date);
    expect(contentDate('2026-09-13').toISOString()).toBe('2026-09-13T00:00:00.000Z');
    const hoodie = entries.find((e) => e.url.endsWith('/products/hoodie'));
    expect(hoodie?.images).toEqual(
      expect.arrayContaining([`${BASE}/images/products/hoodie/white-front.jpg`]),
    );
    expect(hoodie?.images?.length).toBe(4);
  });

  it('dates legal pages from the legal file so the visible date, JSON-LD and sitemap agree', () => {
    for (const legal of getLegalPages()) {
      const entry = entries.find((e) => e.url === `${BASE}/${legal.slug}`);
      expect(entry?.lastModified).toEqual(contentDate(legal.updatedAt));
    }
  });
});

describe('robots (BRD 7.2)', () => {
  it('disallows everything off the production origin', () => {
    expect(robotsRules(false, BASE)).toEqual({ rules: { userAgent: '*', disallow: '/' } });
  });

  it('allows the site, blocks the API, admin, hub filter and UTM variants, names the bots', () => {
    const rules = robotsRules(true, BASE);
    const list = Array.isArray(rules.rules) ? rules.rules : [rules.rules];
    expect(list[0]).toEqual({
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/', '/*?hub=', '/*&utm_'],
    });
    for (const bot of ANSWER_ENGINE_BOTS) {
      expect(list.find((r) => r.userAgent === bot)?.allow).toBe('/');
    }
    expect(rules.sitemap).toBe(`${BASE}/sitemap.xml`);
  });
});

describe('manifest (BRD 7.3)', () => {
  it('is Arabic, RTL, brand-coloured, display browser, with two icons', () => {
    const m = manifest();
    expect(m.name).toBe(site.brandName);
    expect(m.lang).toBe('ar');
    expect(m.dir).toBe('rtl');
    expect(m.display).toBe('browser');
    expect(m.theme_color?.toLowerCase()).toBe('#0058b0');
    expect(m.background_color?.toLowerCase()).toBe('#ffffff');
    expect(m.icons?.map((i) => i.sizes)).toEqual(['192x192', '512x512']);
  });
});
