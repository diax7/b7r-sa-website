import 'server-only';

/**
 * Server-only environment (BRD 8.5). Read lazily so a missing key surfaces as a clear
 * `not_configured` API response rather than a crash at import; the client never sees these.
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
