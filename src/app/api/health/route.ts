import { NextResponse } from 'next/server';
import { cmsEnv } from '@/lib/cms/env';
import { databaseStatus, failedJobs, jobsStatus, mediaStorage } from '@/lib/cms/health';
import { getContactTransport } from '@/lib/contact-transport';
import { contactEnv } from '@/lib/env-server';
import { indexNowKey } from '@/lib/indexnow';
import { getNewsletterTransport } from '@/lib/newsletter-transport';

export const dynamic = 'force-dynamic';

/**
 * Liveness endpoint for the container health check (BRD 8.6, 8.11): `ok` is true whenever
 * the process answers; the other fields say what is wired so a mocked, unconfigured or
 * disconnected production is visible at a glance.
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    version: process.env.APP_VERSION ?? 'dev',
    time: new Date().toISOString(),
    db: await databaseStatus(),
    media: mediaStorage(),
    newsletter: getNewsletterTransport().kind,
    contact: getContactTransport().kind,
    turnstile: contactEnv().turnstileSecretKey ? 'on' : 'off',
    indexnow: indexNowKey() ? 'on' : 'off',
    email: cmsEnv().email ? 'resend' : 'console',
    jobs: await jobsStatus(),
    jobsFailed: await failedJobs(),
  });
}
