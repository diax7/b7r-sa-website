import { draftMode } from 'next/headers';
import { NextResponse } from 'next/server';
import { isSitePath } from '@/lib/preview-token';

export const dynamic = 'force-dynamic';

/** Leaves draft mode and returns to the page the bar was on (same origin), else home. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  let path = '/';
  const referer = req.headers.get('referer');
  if (referer) {
    try {
      const from = new URL(referer);
      if (from.origin === url.origin && isSitePath(from.pathname)) path = from.pathname;
    } catch {
      // A malformed referer is ignored.
    }
  }
  (await draftMode()).disable();
  return NextResponse.redirect(new URL(path, url), 307);
}
