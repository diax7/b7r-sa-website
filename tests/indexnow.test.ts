import { describe, expect, it, vi } from 'vitest';
import {
  changedUrls,
  indexNowPayload,
  isValidIndexNowKey,
  keyFileName,
  keyLocation,
  parseSitemap,
  submitIndexNow,
} from '@/lib/indexnow';

const KEY = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4';

function sitemap(entries: Array<[string, string]>): string {
  const urls = entries
    .map(([loc, lastmod]) => `<url><loc>${loc}</loc><lastmod>${lastmod}</lastmod></url>`)
    .join('');
  return `<?xml version="1.0"?><urlset>${urls}</urlset>`;
}

describe('IndexNow (BRD 7.6)', () => {
  it('validates the key format', () => {
    expect(isValidIndexNowKey(KEY)).toBe(true);
    expect(isValidIndexNowKey('short')).toBe(false);
    expect(isValidIndexNowKey('has space here')).toBe(false);
  });

  it('serves the key under /indexnow and names that location in the payload', () => {
    expect(keyFileName(KEY)).toBe(`${KEY}.txt`);
    expect(keyLocation('https://b7r.sa', KEY)).toBe(`https://b7r.sa/indexnow/${KEY}.txt`);
    const payload = indexNowPayload('https://b7r.sa', KEY, [
      'https://b7r.sa/products',
      'https://b7r.sa/products',
      'https://elsewhere.example/x',
    ]);
    expect(payload).toEqual({
      host: 'b7r.sa',
      key: KEY,
      keyLocation: `https://b7r.sa/indexnow/${KEY}.txt`,
      urlList: ['https://b7r.sa/products'],
    });
  });

  it('diffs two sitemaps by new URL or changed lastmod', () => {
    const before = sitemap([
      ['https://b7r.sa', '2026-09-01T00:00:00.000Z'],
      ['https://b7r.sa/products', '2026-09-01T00:00:00.000Z'],
    ]);
    const after = sitemap([
      ['https://b7r.sa', '2026-09-01T00:00:00.000Z'],
      ['https://b7r.sa/products', '2026-09-13T00:00:00.000Z'],
      ['https://b7r.sa/blog/new-post', '2026-09-13T00:00:00.000Z'],
    ]);
    expect(parseSitemap(before)).toHaveLength(2);
    expect(changedUrls(before, after)).toEqual([
      'https://b7r.sa/products',
      'https://b7r.sa/blog/new-post',
    ]);
    expect(changedUrls(after, after)).toEqual([]);
  });

  it('posts JSON and accepts 200 or 202; skips the request for an empty list', async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 202 }));
    const payload = indexNowPayload('https://b7r.sa', KEY, ['https://b7r.sa/faq']);
    await expect(submitIndexNow(payload, fetchImpl as unknown as typeof fetch)).resolves.toEqual({
      ok: true,
      status: 202,
    });
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.indexnow.org/indexnow');
    expect(JSON.parse(String(init.body))).toEqual(payload);
    await expect(
      submitIndexNow({ ...payload, urlList: [] }, fetchImpl as unknown as typeof fetch),
    ).resolves.toEqual({ ok: true, status: 204 });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
