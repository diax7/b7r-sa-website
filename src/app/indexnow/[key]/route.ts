import { indexNowKey, keyFileName } from '@/lib/indexnow';

export const dynamic = 'force-dynamic';

/**
 * IndexNow key file (BRD 7.6): `/indexnow/{INDEXNOW_KEY}.txt` answers with the key; any other
 * name is a plain 404. Lives under its own segment so no root-level catch-all can soft-404
 * unknown URLs.
 */
export function GET(_req: Request, { params }: { params: Promise<{ key: string }> }) {
  return params.then(({ key }) => {
    const configured = indexNowKey();
    if (!configured || key !== keyFileName(configured)) {
      return new Response('Not found', { status: 404, headers: { 'Content-Type': 'text/plain' } });
    }
    return new Response(configured, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  });
}
