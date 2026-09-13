import { NextResponse } from 'next/server';
import { getNewsletterTransport } from '@/lib/newsletter-transport';

export const dynamic = 'force-dynamic';

/** Liveness endpoint for the container health check (BRD 8.6, 8.11). */
export function GET() {
  return NextResponse.json({
    ok: true,
    version: process.env.APP_VERSION ?? 'dev',
    time: new Date().toISOString(),
    // Which newsletter transport is active, so a mocked production is visible at a glance.
    newsletter: getNewsletterTransport().kind,
  });
}
