import { env } from '@/lib/env';

/**
 * Shared checks for the JSON API routes (newsletter, contact; the Level 4 webhook next):
 * the body must be JSON, and a browser-sent `Origin` must be the site itself: the request's
 * own host (the classic same-origin check) or the configured production origin (the site
 * behind a proxy that rewrites `Host`). CI serves the production build on localhost, which
 * is why both are accepted. No `Origin` header passes so server-to-server and same-origin
 * `fetch` calls without one still work.
 */
export function isJsonRequest(req: Request): boolean {
  return req.headers.get('content-type')?.includes('application/json') ?? false;
}

export function originAllowed(req: Request): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return true;
  const allowed = new Set([req.headers.get('host'), env.siteUrl && new URL(env.siteUrl).host]);
  try {
    return allowed.has(new URL(origin).host);
  } catch {
    return false;
  }
}

/** True when a JSON API route may proceed. */
export function acceptsJsonFrom(req: Request): boolean {
  return isJsonRequest(req) && originAllowed(req);
}
