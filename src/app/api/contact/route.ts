import { NextResponse } from 'next/server';
import { getContactTransport } from '@/lib/contact-transport';
import { contactEnv } from '@/lib/env-server';
import { clientIp, createRateLimiter } from '@/lib/rate-limit';
import { acceptsJsonFrom } from '@/lib/request-guards';
import { verifyTurnstile } from '@/lib/turnstile';
import { CONTACT_RATE_LIMIT, CONTACT_WINDOW_MS, contactBodySchema } from '@/modules/contact';

export const dynamic = 'force-dynamic';

const limiter = createRateLimiter(CONTACT_RATE_LIMIT, CONTACT_WINDOW_MS);

/**
 * Contact form (BRD 6.9), in this order: JSON + same-origin → zod → honeypot (200 to fool
 * the bot) → rate limit 5/10 min/IP → Turnstile `siteverify` when a secret is configured →
 * email transport. Message bodies are never logged; client errors are generic.
 */
export async function POST(req: Request) {
  if (!acceptsJsonFrom(req)) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 });
  }
  const parsed = contactBodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 });
  if (parsed.data.website) return NextResponse.json({ ok: true });

  const ip = clientIp(req.headers);
  const hit = limiter.hit(ip);
  if (!hit.allowed) {
    return NextResponse.json(
      { ok: false, error: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(hit.retryAfterMs / 1000)) } },
    );
  }

  const { turnstileSecretKey } = contactEnv();
  if (turnstileSecretKey) {
    const token = parsed.data.turnstileToken;
    if (!token || !(await verifyTurnstile(token, turnstileSecretKey, ip))) {
      return NextResponse.json({ ok: false, error: 'challenge_failed' }, { status: 400 });
    }
  }

  const { name, phone, email, inquiry, message, locale } = parsed.data;
  const result = await getContactTransport().send({
    name,
    phone,
    email,
    inquiry,
    message,
    locale,
  });
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.status === 503 ? 'not_configured' : 'failed' },
      { status: result.status },
    );
  }
  return NextResponse.json({ ok: true });
}
