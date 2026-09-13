import { NextResponse } from 'next/server';
import { getContactTransport } from '@/lib/contact-transport';
import { contactEnv } from '@/lib/env-server';
import { indexNowKey } from '@/lib/indexnow';
import { getNewsletterTransport } from '@/lib/newsletter-transport';

export const dynamic = 'force-dynamic';

/** Liveness endpoint for the container health check (BRD 8.6, 8.11). */
export function GET() {
  return NextResponse.json({
    ok: true,
    version: process.env.APP_VERSION ?? 'dev',
    time: new Date().toISOString(),
    // Which integrations are live, so a mocked or unconfigured production is visible at a glance.
    newsletter: getNewsletterTransport().kind,
    contact: getContactTransport().kind,
    turnstile: contactEnv().turnstileSecretKey ? 'on' : 'off',
    indexnow: indexNowKey() ? 'on' : 'off',
  });
}
