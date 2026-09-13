import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * The «معاينة» link (ADR-039): `/api/preview?path=…&token=<exp>.<hmac>` signed over the
 * path and its expiry with the Payload secret, one hour. A bearer by design, staff share
 * it, and never a guessable URL. Pure; unit-tested.
 */
export const PREVIEW_TTL_MS = 60 * 60 * 1000;

/** A site path: root, or lowercase segments of letters, digits and hyphens; no `//`. */
export const SITE_PATH = /^\/(?:[a-z0-9-]+(?:\/[a-z0-9-]+)*)?$/;

export function isSitePath(path: string): boolean {
  return SITE_PATH.test(path);
}

function sign(path: string, exp: number, secret: string): string {
  return createHmac('sha256', secret).update(`preview:${exp}:${path}`).digest('base64url');
}

export function signPreview(path: string, secret: string, now = Date.now()): string {
  const exp = now + PREVIEW_TTL_MS;
  return `${exp}.${sign(path, exp, secret)}`;
}

export function verifyPreview(
  path: string,
  token: string | null | undefined,
  secret: string,
  now = Date.now(),
): boolean {
  if (!token || !isSitePath(path)) return false;
  const [expText, mac] = token.split('.');
  if (!expText || !mac) return false;
  const exp = Number(expText);
  if (!Number.isFinite(exp) || exp < now) return false;
  const expected = sign(path, exp, secret);
  if (expected.length !== mac.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(mac));
}

export function previewUrl(serverUrl: string, path: string, secret: string, now = Date.now()) {
  const url = new URL('/api/preview', serverUrl);
  url.searchParams.set('path', path);
  url.searchParams.set('token', signPreview(path, secret, now));
  return url.toString();
}
