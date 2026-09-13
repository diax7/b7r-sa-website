import { draftMode } from 'next/headers';
import { NextResponse } from 'next/server';
import { cmsEnv } from '@/lib/cms/env';
import { isSitePath, verifyPreview } from '@/lib/preview-token';

export const dynamic = 'force-dynamic';

/**
 * Turns a signed «معاينة» link into Next draft mode and lands on the page (ADR-039). The
 * cookie makes the site read drafts until `/api/preview/exit`; the proxy lets requests that
 * carry it through the published-slug allowlist.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const path = url.searchParams.get('path') ?? '';
  if (!isSitePath(path) || !verifyPreview(path, url.searchParams.get('token'), cmsEnv().secret)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }
  (await draftMode()).enable();
  return NextResponse.redirect(new URL(path, url), 307);
}
