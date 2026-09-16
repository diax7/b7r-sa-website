import { cms } from '@/lib/cms/payload';
import { INTERNAL_HEADER, internalToken, sameToken } from '@/lib/internal-token';
import { count, parseCrawl, startFlusher } from '@/modules/traffic';

export const dynamic = 'force-dynamic';

export const CRAWL_TOKEN_PURPOSE = 'traffic-crawl';

/**
 * The proxy's report of a crawler reading a page (ADR-048): accepted only with the internal
 * token the proxy derives from the same secret, so nobody outside the container can add a
 * crawl row. The body names a bot the table knows and the page it read.
 */
export async function POST(req: Request): Promise<Response> {
  const given = req.headers.get(INTERNAL_HEADER) ?? '';
  const expected = await internalToken(CRAWL_TOKEN_PURPOSE);
  if (!sameToken(given, expected)) return Response.json({ error: 'Internal' }, { status: 403 });
  const crawl = parseCrawl(await req.json().catch(() => null));
  if (!crawl) return Response.json({ error: 'a crawl: bot, path' }, { status: 400 });
  startFlusher(cms);
  count({ kind: 'crawl', source: crawl.bot, path: crawl.path });
  return new Response(null, { status: 204 });
}
