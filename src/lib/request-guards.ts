import { env } from '@/lib/env';

/**
 * Shared checks for the JSON API routes (newsletter, contact; the Level 4 webhook next):
 * the body must be JSON, and a browser-sent `Origin` must match the site (the configured
 * origin in production, the request's own host otherwise). No `Origin` header passes so
 * server-to-server and same-origin `fetch` calls without one still work.
 */
export function isJsonRequest(req: Request): boolean {
  return req.headers.get('content-type')?.includes('application/json') ?? false;
}

export function originAllowed(req: Request): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return true;
  const allowed = env.siteUrl ? new URL(env.siteUrl).host : req.headers.get('host');
  try {
    return new URL(origin).host === allowed;
  } catch {
    return false;
  }
}

/** True when a JSON API route may proceed. */
export function acceptsJsonFrom(req: Request): boolean {
  return isJsonRequest(req) && originAllowed(req);
}
