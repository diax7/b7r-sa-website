import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { RESERVED_PAGE_SLUGS } from '@/content/schema';
import { createSlugCache, SLUG_SHAPE } from '@/lib/page-slugs';
import {
  CODE_TOP_LEVEL,
  isEnglishPath,
  localeSlug,
  NOT_FOUND_PREFIX,
  PROXY_MATCHER,
  topLevelSlug,
} from '@/lib/site-routes';
import { FORBIDDEN_PAGE_SLUGS, pageSlugProblem } from '@/modules/cms/collections/pages';
import { config as proxyConfig } from '@/proxy';

/** The route folders of a root layout: every one must be a code-owned segment the proxy leaves alone. */
function routeFolders(...group: string[]): string[] {
  return readdirSync(join(process.cwd(), 'src', 'app', ...group), { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('['))
    .map((d) => d.name);
}
const siteFolders = () => routeFolders('(site)');
const englishFolders = () => routeFolders('(en)', 'en');
const pageFolders = (folders: string[]) => folders.filter((f) => !f.includes('.')).toSorted();

describe('B0: the proxy and the (site) routes agree on the code-owned segments (ADR-032)', () => {
  it('every (site) folder is in CODE_TOP_LEVEL, and the proxy matches every page request', () => {
    for (const folder of siteFolders()) expect(CODE_TOP_LEVEL, folder).toContain(folder);
    expect(proxyConfig.matcher).toEqual([PROXY_MATCHER]);
    // The one pattern: pages and machine files in, the API, the admin and the assets out.
    const re = new RegExp(`^${PROXY_MATCHER.replace('/(', '/(?:')}$`);
    for (const path of ['/', '/en', '/products/hoodie', '/creators', '/llms.txt', '/wp-admin/x']) {
      expect(re.test(path), path).toBe(true);
    }
    for (const path of [
      '/api/health',
      '/admin',
      '/admin/login',
      '/_next/static/a.js',
      '/media/x.jpg',
    ]) {
      expect(re.test(path), path).toBe(false);
    }
  });

  it('the English root layout mirrors every Arabic route folder (ADR-043)', () => {
    // The Arabic feed lives outside the group (`app/feed.xml`); the English one under `/en`.
    expect(pageFolders(englishFolders())).toEqual(pageFolders(siteFolders()));
    expect(englishFolders()).toContain('feed.xml');
  });

  it('classifies paths in both locales (ADR-043)', () => {
    expect(localeSlug('/creators')).toEqual({ locale: 'ar', slug: 'creators' });
    expect(localeSlug('/en/creators')).toEqual({ locale: 'en', slug: 'creators' });
    expect(localeSlug('/en/creators/')).toEqual({ locale: 'en', slug: 'creators' });
    expect(localeSlug('/en')).toBeNull();
    expect(localeSlug('/en/products')).toBeNull();
    expect(localeSlug('/en/products/hoodie')).toBeNull();
    expect(localeSlug('/en/file.txt')).toBeNull();
    expect(localeSlug('/english')).toEqual({ locale: 'ar', slug: 'english' });
    expect(isEnglishPath('/en')).toBe(true);
    expect(isEnglishPath('/en/faq')).toBe(true);
    expect(isEnglishPath('/english')).toBe(false);
    expect(isEnglishPath('/')).toBe(false);
  });

  it('the seven designed pages are reserved and none of them is a forbidden slug', () => {
    for (const slug of RESERVED_PAGE_SLUGS) {
      expect(CODE_TOP_LEVEL).toContain(slug);
      expect(FORBIDDEN_PAGE_SLUGS).not.toContain(slug);
    }
    for (const forbidden of FORBIDDEN_PAGE_SLUGS) {
      expect(topLevelSlug(`/${forbidden}`), forbidden).toBeNull();
    }
  });

  it('classifies paths: code-owned and nested paths pass, one clean segment is a candidate', () => {
    expect(topLevelSlug('/about')).toBeNull();
    expect(topLevelSlug('/products/hoodie')).toBeNull();
    expect(topLevelSlug('/sitemap.xml')).toBeNull();
    expect(topLevelSlug('/')).toBeNull();
    expect(topLevelSlug('/creators')).toBe('creators');
    expect(topLevelSlug('/creators/')).toBe('creators');
    expect(topLevelSlug('/no-such-page')).toBe('no-such-page');
    expect(NOT_FOUND_PREFIX).toBe('/__404/');
  });

  it('refuses page slugs that are malformed, reserved by the code, or the 404 target', () => {
    expect(pageSlugProblem('creators')).toBeNull();
    expect(pageSlugProblem('Creators')?.en).toMatch(/lowercase/);
    expect(pageSlugProblem('Creators')?.ar).toMatch(/حروف لاتينية صغيرة/);
    expect(pageSlugProblem('a'.repeat(65))?.en).toMatch(/64/);
    expect(pageSlugProblem('products')?.en).toMatch(/reserved/);
    expect(pageSlugProblem('products')?.ar).toMatch(/محجوز/);
    expect(pageSlugProblem('en')?.en).toMatch(/reserved/);
    expect(pageSlugProblem('__404')).not.toBeNull();
    expect(pageSlugProblem(undefined)).not.toBeNull();
    expect(SLUG_SHAPE.test('no-such-page')).toBe(true);
    expect(SLUG_SHAPE.test('nope_123')).toBe(false);
  });
});

describe('slug cache: fresh, stale-while-revalidate, fail open', () => {
  it('fetches once, serves stale while refreshing, and answers null when nothing was ever read', async () => {
    let now = 0;
    const fetchSlugs = vi.fn(async () => ['creators']);
    const cache = createSlugCache({ fetchSlugs, ttlMs: 20_000, now: () => now });
    expect(await cache.knows('creators')).toBe(true);
    expect(await cache.knows('nope')).toBe(false);
    expect(fetchSlugs).toHaveBeenCalledTimes(1);
    now = 25_000;
    fetchSlugs.mockResolvedValueOnce(['creators', 'partners']);
    // Stale: a hit is served from the old list while a refresh runs; a miss waits for it.
    expect(await cache.knows('creators')).toBe(true);
    expect(await cache.knows('partners')).toBe(true);
    expect(fetchSlugs).toHaveBeenCalledTimes(2);

    const failing = createSlugCache({
      fetchSlugs: async () => {
        throw new Error('down');
      },
      ttlMs: 1,
    });
    expect(await failing.knows('anything')).toBeNull();
  });

  it('re-reads on a miss, at most once per window, so a page just published answers', async () => {
    let now = 0;
    const fetchSlugs = vi.fn(async () => ['creators']);
    const cache = createSlugCache({
      fetchSlugs,
      ttlMs: 20_000,
      missRefreshMs: 2_000,
      now: () => now,
    });
    expect(await cache.knows('creators')).toBe(true);
    fetchSlugs.mockResolvedValue(['creators', 'partners']);
    now = 1_000;
    expect(await cache.knows('partners')).toBe(false); // inside the window: no re-read
    expect(fetchSlugs).toHaveBeenCalledTimes(1);
    now = 3_000;
    expect(await cache.knows('partners')).toBe(true); // the miss triggered a re-read
    expect(fetchSlugs).toHaveBeenCalledTimes(2);
    now = 4_000;
    expect(await cache.knows('nope')).toBe(false);
    expect(fetchSlugs).toHaveBeenCalledTimes(2); // one re-read per window
  });

  it('keeps the last good list when a refresh fails', async () => {
    let now = 0;
    const fetchSlugs = vi.fn(async () => ['creators']);
    const cache = createSlugCache({ fetchSlugs, ttlMs: 10, now: () => now });
    expect(await cache.knows('creators')).toBe(true);
    now = 100;
    fetchSlugs.mockRejectedValueOnce(new Error('down'));
    expect(await cache.knows('creators')).toBe(true);
    await new Promise((r) => setTimeout(r, 0));
    expect(await cache.knows('creators')).toBe(true);
  });
});
