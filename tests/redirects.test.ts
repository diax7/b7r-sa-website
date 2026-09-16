import { describe, expect, it } from 'vitest';
import {
  goneExact,
  gonePrefixes,
  isGone,
  redirectRules,
  renamed,
  slashOnly,
} from '@/lib/redirects';
import { config as proxyConfig, proxy } from '@/proxy';

/** BRD 5.2 / Appendix C, the whole table. */
const OLD_TO_NEW: Array<[string, string]> = [
  ['/about/', '/about'],
  ['/showcase/', '/products'],
  ['/contact/', '/contact'],
  ['/terms-conditions/', '/terms'],
  ['/shipping/', '/shipping'],
  ['/privacy-policy/', '/privacy'],
  ['/blog/', '/blog'],
  ['/home-2/', '/'],
];

const GONE = [
  '/team/',
  '/our_services/',
  '/under-construction/',
  '/demo-design-system/',
  '/specialists/anyone',
  '/project/x',
  '/project-category/y',
  '/services/z',
  '/category/c',
  ...Array.from({ length: 12 }, (_, i) => `/post${String(i + 1).padStart(3, '0')}/`),
  '/hello-world/',
  '/feed/',
  '/wp-content/uploads/2020/a.jpg',
  '/wp-admin/',
  '/wp-json/wp/v2/posts',
  '/wp-login.php',
  '/xmlrpc.php',
];

/** Resolves an old path the way Next will: trailing-slash 308 first, then the custom map. */
function resolve(oldPath: string): string {
  const trimmed = oldPath.length > 1 && oldPath.endsWith('/') ? oldPath.slice(0, -1) : oldPath;
  return renamed.find((r) => r.source === trimmed)?.destination ?? trimmed;
}

describe('redirect map (BRD 5.2)', () => {
  it.each(OLD_TO_NEW)('%s resolves to %s', (from, to) => {
    expect(resolve(from)).toBe(to);
  });

  it('lists slash-only entries as resolved by Next, not as custom redirects', () => {
    for (const path of slashOnly) expect(renamed.some((r) => r.source === path)).toBe(false);
    expect(slashOnly.length + renamed.length).toBe(OLD_TO_NEW.length);
  });

  it('never writes a trailing slash into a source', () => {
    for (const r of redirectRules()) expect(r.source.endsWith('/')).toBe(false);
  });

  it('marks renames 301 and never redirects /en, which is a live site (ADR-043)', () => {
    for (const r of renamed) expect(r.statusCode).toBe(301);
    expect(redirectRules().some((r) => r.source.startsWith('/en'))).toBe(false);
  });
});

describe('410 list (BRD 5.2, ADR-017)', () => {
  it.each(GONE)('%s is gone', (path) => {
    expect(isGone(path)).toBe(true);
  });

  it('leaves live and unknown routes alone', () => {
    const live = ['/', '/products', '/blog/post-1', '/nope', '/post013', '/teams', '/services-x'];
    for (const path of live) expect(isGone(path), path).toBe(false);
  });

  it('the one proxy matcher covers every retired URL (ADR-048), and the map is complete', () => {
    const re = new RegExp(`^${proxyConfig.matcher[0]!.replace('/(', '/(?:')}$`);
    for (const path of GONE) expect(re.test(path), path).toBe(true);
    expect(GONE).toHaveLength(goneExact.length + gonePrefixes.length);
  });

  it('answers 410 with a cached Arabic HTML body and passes the code-owned routes', async () => {
    const res = await proxy(new Request('https://b7r.sa/wp-admin/'));
    expect(res?.status).toBe(410);
    expect(res?.headers.get('content-type')).toBe('text/html; charset=utf-8');
    expect(res?.headers.get('cache-control')).toBe('public, max-age=86400');
    const html = (await res?.text()) ?? '';
    expect(html).toContain('<html lang="ar" dir="rtl">');
    expect(html).toContain('noindex');
    expect(await proxy(new Request('https://b7r.sa/products'))).toBeUndefined();
  });
});
