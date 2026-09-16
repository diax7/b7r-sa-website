import { botOf } from '@/lib/traffic/bots';
import { type Crawl, crawlPath } from '@/lib/traffic/landing';

/**
 * Whether a request is a crawler reading a page (ADR-048): a document GET (no `rsc` and no
 * `next-router-prefetch` header, no `_rsc` query: a crawler that renders JS fires one RSC
 * request per link in view, each with its user agent), on a page path or a machine file,
 * from a user agent the bot table knows. Pure: the proxy calls it, the unit test feeds it
 * requests. Retired URLs are not passed here (a 410 is not "what they read").
 */
export function crawlOf(request: Request): Crawl | null {
  if (request.method !== 'GET') return null;
  if (request.headers.has('rsc') || request.headers.has('next-router-prefetch')) return null;
  const url = new URL(request.url);
  if (url.searchParams.has('_rsc')) return null;
  const path = crawlPath(url.pathname);
  if (!path) return null;
  const bot = botOf(request.headers.get('user-agent'));
  return bot ? { bot: bot.key, path } : null;
}
