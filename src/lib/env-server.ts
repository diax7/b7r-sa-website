import 'server-only';
import { isProductionRuntime } from '@/lib/cms/env';

/**
 * Server-only environment (BRD 8.5). Read lazily so a missing key surfaces as a clear
 * `not_configured` API response (and an `off` in `/api/health`) rather than a crash at
 * import; the client never sees these.
 *
 * The one place that fails hard is `assertProductionEnv()`, run from `instrumentation.ts`
 * at server start and only when `B7R_RUNTIME=production` — a signal set solely in the CranL
 * app, never in CI (which builds and serves on the production origin for the noindex checks).
 * Throwing there fails the container's health check so CranL keeps the previous image.
 */
export interface NewsletterEnv {
  resendApiKey: string | undefined;
  resendAudienceId: string | undefined;
  /** `mock` enables the in-memory transport for tests — only ever honoured without a key. */
  transportOverride: string | undefined;
}

export function newsletterEnv(): NewsletterEnv {
  return {
    resendApiKey: process.env.RESEND_API_KEY || undefined,
    resendAudienceId: process.env.RESEND_AUDIENCE_ID || undefined,
    transportOverride: process.env.NEWSLETTER_TRANSPORT || undefined,
  };
}

export interface ContactEnv {
  resendApiKey: string | undefined;
  /** `بحر برنت <no-reply@b7r.sa>` */
  resendFrom: string | undefined;
  contactTo: string | undefined;
  turnstileSecretKey: string | undefined;
  /** `mock` keeps messages in memory for tests — only ever honoured without a key. */
  transportOverride: string | undefined;
}

export function contactEnv(): ContactEnv {
  return {
    resendApiKey: process.env.RESEND_API_KEY || undefined,
    resendFrom: process.env['RESEND_FROM'] || undefined,
    contactTo: process.env['CONTACT_TO'] || undefined,
    turnstileSecretKey: process.env['TURNSTILE_SECRET_KEY'] || undefined,
    transportOverride: process.env['CONTACT_TRANSPORT'] || undefined,
  };
}

/** Cal.com link for the booking card; empty until Dhia creates it (BRD 6.9). */
export function bookingUrl(): string | undefined {
  return process.env['BOOKING_URL'] || undefined;
}

/** Search Console and Bing verification tokens (BRD 7.3). */
export function verificationTokens(): { google?: string; bing?: string } {
  const google = process.env['GOOGLE_SITE_VERIFICATION'];
  const bing = process.env['BING_SITE_VERIFICATION'];
  return { ...(google ? { google } : {}), ...(bing ? { bing } : {}) };
}

/**
 * BRD 8.5 "required in prod", extended by the CMS set (BRD 9.2) and the Turnstile pair: with
 * the admin login gated by it (ADR-034), a production boot without the keys would run the
 * login open.
 */
export const PRODUCTION_REQUIRED_ENV = [
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_WHATSAPP',
  'NEXT_PUBLIC_GA_ID',
  'NEXT_PUBLIC_UMAMI_SRC',
  'NEXT_PUBLIC_UMAMI_ID',
  'RESEND_API_KEY',
  'RESEND_FROM',
  'CONTACT_TO',
  'RESEND_AUDIENCE_ID',
  'INDEXNOW_KEY',
  'NEXT_PUBLIC_TURNSTILE_SITE_KEY',
  'TURNSTILE_SECRET_KEY',
  'GOOGLE_SITE_VERIFICATION',
  'BING_SITE_VERIFICATION',
  'DATABASE_URL',
  'PAYLOAD_SECRET',
  'PAYLOAD_PUBLIC_SERVER_URL',
  'S3_BUCKET',
  'S3_REGION',
  'S3_ENDPOINT',
  'S3_ACCESS_KEY_ID',
  'S3_SECRET_ACCESS_KEY',
] as const;

/** Payload signs sessions with it; anything shorter is guessable. */
export const PAYLOAD_SECRET_MIN_LENGTH = 32;

export type RawEnv = Record<string, string | undefined>;

export { isProductionRuntime };

export function missingProductionEnv(raw: RawEnv = process.env): string[] {
  return PRODUCTION_REQUIRED_ENV.filter((name) => !raw[name]);
}

/**
 * Fails the process when the production runtime is missing a required variable, or when a
 * test-only transport override is set there. No-op outside `B7R_RUNTIME=production`.
 */
export function assertProductionEnv(raw: RawEnv = process.env): void {
  if (!isProductionRuntime(raw)) return;
  const problems = missingProductionEnv(raw).map((name) => `${name} is required in production`);
  for (const name of ['NEWSLETTER_TRANSPORT', 'CONTACT_TRANSPORT']) {
    if (raw[name]) problems.push(`${name} must not be set in production`);
  }
  if (raw['NEXT_PUBLIC_SITE_URL'] && raw['NEXT_PUBLIC_SITE_URL'] !== 'https://b7r.sa') {
    problems.push('NEXT_PUBLIC_SITE_URL must be https://b7r.sa in production');
  }
  if (raw['PAYLOAD_PUBLIC_SERVER_URL'] && raw['PAYLOAD_PUBLIC_SERVER_URL'] !== 'https://b7r.sa') {
    problems.push('PAYLOAD_PUBLIC_SERVER_URL must be https://b7r.sa in production (same origin)');
  }
  if (raw['PAYLOAD_SECRET'] && raw['PAYLOAD_SECRET'].length < PAYLOAD_SECRET_MIN_LENGTH) {
    problems.push(`PAYLOAD_SECRET must be at least ${PAYLOAD_SECRET_MIN_LENGTH} characters`);
  }
  if (problems.length > 0) {
    throw new Error(
      `Production environment invalid (see .env.example):\n  ${problems.join('\n  ')}`,
    );
  }
}
