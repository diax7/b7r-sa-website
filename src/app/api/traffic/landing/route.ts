import { cms } from '@/lib/cms/payload';
import { clientIp, createRateLimiter } from '@/lib/rate-limit';
import { isJsonRequest, originAllowed } from '@/lib/request-guards';
import { count, looksLikeBot, parseLanding, sourceOf, startFlusher } from '@/modules/traffic';

export const dynamic = 'force-dynamic';

/** Sixty landings a minute per client address; the address is a key in memory, never stored. */
const limiter = createRateLimiter(60, 60_000);
const NO_CONTENT = new Response(null, { status: 204 });

/**
 * The landing beacon's endpoint (ADR-048), in this order: JSON with an `Origin` present and
 * matching the site (a browser always sends one on a POST; a bare script call is refused), a
 * user agent that is not a bot (the crawler counter already saw it: nothing stored), a body
 * that parses, the rate limit, then one hit for the day, the source and the page. The site's
 * own host as a referrer is an internal move the client missed: nothing stored either.
 */
export async function POST(req: Request): Promise<Response> {
  if (!isJsonRequest(req) || !req.headers.get('origin') || !originAllowed(req)) {
    return Response.json({ error: 'JSON from this site only' }, { status: 403 });
  }
  if (looksLikeBot(req.headers.get('user-agent'))) return NO_CONTENT;
  const landing = parseLanding(await req.json().catch(() => null));
  if (!landing)
    return Response.json({ error: 'a landing: path, referrer, utmSource' }, { status: 400 });
  const hit = limiter.hit(clientIp(req.headers));
  if (!hit.allowed) {
    return new Response(null, {
      status: 429,
      headers: { 'Retry-After': String(Math.ceil(hit.retryAfterMs / 1000)) },
    });
  }
  const source = sourceOf({
    referrer: landing.referrer,
    utmSource: landing.utmSource,
    siteHost: req.headers.get('host') ?? '',
  });
  if (source === null) return NO_CONTENT;
  startFlusher(cms);
  count({ kind: 'landing', source, path: landing.path });
  return NO_CONTENT;
}
