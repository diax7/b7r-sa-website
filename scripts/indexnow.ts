/**
 * Submits changed URLs to IndexNow after a production deploy (BRD 7.6).
 *
 *   tsx scripts/indexnow.ts <before-sitemap.xml> <after-sitemap.xml>
 *
 * Reads `NEXT_PUBLIC_SITE_URL` and `INDEXNOW_KEY` from the environment; exits 0 without a
 * request when either is missing (the workflow is a no-op until CranL and the key exist) or
 * when nothing changed. Exit 1 when IndexNow refuses the submission.
 */
import { readFileSync } from 'node:fs';
import {
  changedUrls,
  indexNowPayload,
  isValidIndexNowKey,
  submitIndexNow,
} from '../src/lib/indexnow';

const [beforePath, afterPath] = process.argv.slice(2);
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const key = process.env['INDEXNOW_KEY'];

if (!beforePath || !afterPath) {
  console.error('usage: tsx scripts/indexnow.ts <before-sitemap.xml> <after-sitemap.xml>');
  process.exit(2);
}
if (!siteUrl || !key) {
  console.warn('indexnow: NEXT_PUBLIC_SITE_URL or INDEXNOW_KEY unset; skipping.');
  process.exit(0);
}
if (!isValidIndexNowKey(key)) {
  console.error('indexnow: INDEXNOW_KEY must be 8-128 characters of a-z, A-Z, 0-9 or -.');
  process.exit(2);
}

const urls = changedUrls(readFileSync(beforePath, 'utf8'), readFileSync(afterPath, 'utf8'));
const payload = indexNowPayload(siteUrl, key, urls);
if (payload.urlList.length === 0) {
  console.warn('indexnow: no changed URLs; nothing submitted.');
  process.exit(0);
}
const result = await submitIndexNow(payload);
console.warn(`indexnow: ${payload.urlList.length} URL(s) submitted, status ${result.status}.`);
process.exit(result.ok ? 0 : 1);
