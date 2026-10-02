import 'server-only';
import { Resend } from 'resend';
import { newsletterEnv } from '@/lib/env-server';

export type SubscribeResult = { ok: true } | { ok: false; status: 500 | 503 };

export interface NewsletterTransport {
  kind: 'live' | 'mock' | 'off';
  subscribe(email: string): Promise<SubscribeResult>;
}

function mockTransport(): NewsletterTransport {
  return {
    kind: 'mock',
    async subscribe() {
      return { ok: true };
    },
  };
}

let cachedClient: { key: string; client: Resend } | null = null;

function resendClient(apiKey: string): Resend {
  if (cachedClient?.key !== apiKey) cachedClient = { key: apiKey, client: new Resend(apiKey) };
  return cachedClient.client;
}

function liveTransport(apiKey: string, segmentId: string): NewsletterTransport {
  const resend = resendClient(apiKey);
  return {
    kind: 'live',
    async subscribe(email) {
      // Resend's contacts are one per address across the account and `create` upserts: an
      // address it already holds (a repeat, a contact of the app) answers 201 and joins the
      // segment, so a repeat is `ok` like the first (BRD 6.14: idempotent).
      const { error } = await resend.contacts.create({
        email,
        unsubscribed: false,
        segments: [{ id: segmentId }],
      });
      return error ? { ok: false, status: 500 } : { ok: true };
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
  if (env.resendApiKey && env.resendSegmentId)
    return liveTransport(env.resendApiKey, env.resendSegmentId);
  if (env.transportOverride === 'mock' && !env.resendApiKey) return mockTransport();
  return {
    kind: 'off',
    async subscribe() {
      return { ok: false, status: 503 };
    },
  };
}
