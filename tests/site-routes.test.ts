import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { RESERVED_PAGE_SLUGS } from '@/content/schema';
import { createSlugCache, SLUG_SHAPE } from '@/lib/page-slugs';
import {
  ADMIN_PREFIX,
  CODE_TOP_LEVEL,
  isEnglishPath,
  localeSlug,
  NOT_FOUND_PREFIX,
  PROXY_MATCHER,
  topLevelSlug,
} from '@/lib/site-routes';
import { FORBIDDEN_PAGE_SLUGS, pageSlugProblem } from '@/modules/cms/collections/pages';
import { config as proxyConfig, proxy } from '@/proxy';

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
    // The one pattern: pages, machine files and the admin in; the API and the assets out.
    const re = new RegExp(`^${PROXY_MATCHER.replace('/(', '/(?:')}$`);
    for (const path of [
      '/',
      '/en',
      '/products/hoodie',
      '/creators',
      '/llms.txt',
      '/wp-admin/x',
      '/admin',
      '/admin/login',
    ]) {
      expect(re.test(path), path).toBe(true);
    }
    for (const path of [
      '/api/health',
      '/api/payload/pages/1',
      '/_next/static/a.js',
      '/media/x.jpg',
    ]) {
      expect(re.test(path), path).toBe(false);
    }
  });

  it('the admin drops a stray ?locale= with a 307 to the same URL and passes every other admin request (ADR-057, PR C)', async () => {
    const stray = await proxy(
      new Request(`https://b7r.sa${ADMIN_PREFIX}/collections/pages/1?locale=en&foo=bar`),
    );
    // The Location keeps the request's own origin, whatever it is (Next's adapter refuses a
    // relative one and relativises an absolute one on the request's host, so the browser
    // gets `/admin/...` in the container too, where `request.url` names the bind address).
    expect(stray?.status).toBe(307);
    expect(stray?.headers.get('location')).toBe(
      `https://b7r.sa${ADMIN_PREFIX}/collections/pages/1?foo=bar`,
    );
    const root = await proxy(new Request(`http://0.0.0.0:3004${ADMIN_PREFIX}?locale=ar`));
    expect(root?.status).toBe(307);
    expect(root?.headers.get('location')).toBe(`http://0.0.0.0:3004${ADMIN_PREFIX}`);
    for (const path of [
      ADMIN_PREFIX,
      `${ADMIN_PREFIX}/collections/pages/1`,
      `${ADMIN_PREFIX}/login?redirect=%2Fadmin`,
    ]) {
      expect(await proxy(new Request(`https://b7r.sa${path}`)), path).toBeUndefined();
    }
    // A site path that merely starts with the letters is not the admin (a code-owned one
    // here, so the allowlist is never read).
    expect(await proxy(new Request('https://b7r.sa/admin-tools/x?locale=en'))).toBeUndefined();
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
    // The app icons have no extension, so they are named (spec 010).
    expect(topLevelSlug('/apple-icon')).toBeNull();
    expect(topLevelSlug('/icon')).toBeNull();
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
    expect(pageSlugProblem('apple-icon')?.en).toMatch(/reserved/);
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
