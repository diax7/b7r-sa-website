/**
 * IndexNow (BRD 7.6): the key is served at `/indexnow/{key}.txt` and every submission names
 * that `keyLocation`, so the key never has to sit at the site root. Level 1 submits from a
 * GitHub Actions step after a production deploy (`scripts/indexnow.ts`); Level 2 moves it to
 * a publish hook. Server only.
 */
import { createHash } from 'node:crypto';

export const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

/** IndexNow keys are 8–128 characters of `a-zA-Z0-9-`. */
const KEY_PATTERN = /^[a-zA-Z0-9-]{8,128}$/;

export function isValidIndexNowKey(key: string): boolean {
  return KEY_PATTERN.test(key);
}

/**
 * The site's IndexNow key: `INDEXNOW_KEY` when set, else 32 hex characters derived from
 * `PAYLOAD_SECRET` (ADR-052: one variable fewer; the key is public by design, served at
 * `/indexnow/{key}.txt`, and a hash reveals nothing of the secret). None without either.
 */
export function indexNowKey(): string | undefined {
  const key = process.env['INDEXNOW_KEY'] || undefined;
  if (key) return isValidIndexNowKey(key) ? key : undefined;
  const secret = process.env['PAYLOAD_SECRET'];
  if (!secret) return undefined;
  return createHash('sha256').update(`indexnow:${secret}`).digest('hex').slice(0, 32);
}

export function keyFileName(key: string): string {
  return `${key}.txt`;
}

export function keyLocation(siteUrl: string, key: string): string {
  return `${siteUrl}/indexnow/${keyFileName(key)}`;
}

export interface IndexNowPayload {
  host: string;
  key: string;
  keyLocation: string;
  urlList: string[];
}

export function indexNowPayload(siteUrl: string, key: string, urls: string[]): IndexNowPayload {
  return {
    host: new URL(siteUrl).host,
    key,
    keyLocation: keyLocation(siteUrl, key),
    urlList: [...new Set(urls)].filter((u) => u.startsWith(siteUrl)),
  };
}

/** POSTs the payload; 200 and 202 are accepted (202 = queued). */
export async function submitIndexNow(
  payload: IndexNowPayload,
  fetchImpl: typeof fetch = fetch,
): Promise<{ ok: boolean; status: number }> {
  if (payload.urlList.length === 0) return { ok: true, status: 204 };
  const res = await fetchImpl(INDEXNOW_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  });
  return { ok: res.status === 200 || res.status === 202, status: res.status };
}

interface SitemapUrl {
  loc: string;
  lastmod: string | undefined;
}

/** Minimal sitemap reader: `<url><loc>…</loc><lastmod>…</lastmod></url>` pairs. */
export function parseSitemap(xml: string): SitemapUrl[] {
  const out: SitemapUrl[] = [];
  for (const block of xml.match(/<url>[\s\S]*?<\/url>/g) ?? []) {
    const loc = /<loc>([^<]+)<\/loc>/.exec(block)?.[1]?.trim();
    if (!loc) continue;
    out.push({ loc, lastmod: /<lastmod>([^<]+)<\/lastmod>/.exec(block)?.[1]?.trim() });
  }
  return out;
}

/** URLs that are new or whose `lastmod` changed between two sitemaps. */
export function changedUrls(beforeXml: string, afterXml: string): string[] {
  const before = new Map(parseSitemap(beforeXml).map((u) => [u.loc, u.lastmod]));
  return parseSitemap(afterXml)
    .filter((u) => !before.has(u.loc) || before.get(u.loc) !== u.lastmod)
    .map((u) => u.loc);
}
