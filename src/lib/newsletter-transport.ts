import 'server-only';
import { Resend } from 'resend';
import { newsletterEnv } from '@/lib/env-server';

export type SubscribeResult = { ok: true; duplicate: boolean } | { ok: false; status: 500 | 503 };

export interface NewsletterTransport {
  kind: 'live' | 'mock' | 'off';
  subscribe(email: string): Promise<SubscribeResult>;
}

/**
 * Resend answers an existing contact with a 4xx `validation_error` whose message mentions
 * the duplicate; a 5xx is never treated as "already subscribed" (BRD 6.14: idempotent).
 */
export function isDuplicateError(
  error: { name?: string; statusCode?: number | null; message?: string } | null,
): boolean {
  if (!error) return false;
  const status = error.statusCode ?? 0;
  if (status < 400 || status >= 500) return false;
  return error.name === 'validation_error' && /already|exist/i.test(error.message ?? '');
}

const mockStore = new Set<string>();

function mockTransport(): NewsletterTransport {
  return {
    kind: 'mock',
    async subscribe(email) {
      const duplicate = mockStore.has(email);
      mockStore.add(email);
      return { ok: true, duplicate };
    },
  };
}

let cachedClient: { key: string; client: Resend } | null = null;

function resendClient(apiKey: string): Resend {
  if (cachedClient?.key !== apiKey) cachedClient = { key: apiKey, client: new Resend(apiKey) };
  return cachedClient.client;
}

function liveTransport(apiKey: string, audienceId: string): NewsletterTransport {
  const resend = resendClient(apiKey);
  return {
    kind: 'live',
    async subscribe(email) {
      // `audienceId` is Resend's legacy (still supported) audience model that the BRD names;
      // RUNBOOK notes the segments migration.
      const { error } = await resend.contacts.create({ email, audienceId, unsubscribed: false });
      if (!error) return { ok: true, duplicate: false };
      if (isDuplicateError(error)) return { ok: true, duplicate: true };
      return { ok: false, status: 500 };
    },
  };
}

/**
 * Picks the newsletter transport (BRD 6.14, ADR-015). The mock is honoured only when
 * `NEWSLETTER_TRANSPORT=mock` AND no Resend key exists, so a stray flag can never fake
 * success in production; `/api/health` reports which one is active.
 */
export function getNewsletterTransport(): NewsletterTransport {
  const env = newsletterEnv();
  if (env.resendApiKey && env.resendAudienceId)
    return liveTransport(env.resendApiKey, env.resendAudienceId);
  if (env.transportOverride === 'mock' && !env.resendApiKey) return mockTransport();
  return {
    kind: 'off',
    async subscribe() {
      return { ok: false, status: 503 };
    },
  };
}
