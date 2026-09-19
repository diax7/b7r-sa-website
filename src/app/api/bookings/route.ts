import { NextResponse } from 'next/server';
import { cms } from '@/lib/cms/payload';
import { contactEnv } from '@/lib/env-server';
import { clientIp, createRateLimiter } from '@/lib/rate-limit';
import { acceptsJsonFrom } from '@/lib/request-guards';
import { verifyTurnstile } from '@/lib/turnstile';
import {
  book,
  BOOKING_RATE_LIMIT,
  BOOKING_WINDOW_MS,
  bookingBodySchema,
  bookingPorts,
  routeFailure,
} from '@/modules/bookings';

export const dynamic = 'force-dynamic';

const limiter = createRateLimiter(BOOKING_RATE_LIMIT, BOOKING_WINDOW_MS);

/**
 * A booking (ADR-062), in the contact route's order: JSON + same origin → zod → honeypot
 * (200 to fool the bot) → rate limit 5/10 min/IP → Turnstile when a secret is configured →
 * the service (the grid rule, the free slots re-checked inside the write, the row, the
 * calendar event, the e-mails). Client errors are generic; nothing personal is logged.
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
  const parsed = bookingBodySchema.safeParse(body);
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

  const { name, email, phone, note, start, locale, page, utm } = parsed.data;
  const payload = await cms();
  try {
    const ports = await bookingPorts(payload);
    const result = await book(ports, {
      name,
      email,
      phone,
      note,
      start,
      locale,
      page: page ?? '/book',
      utm: {
        ...(utm?.source ? { source: utm.source } : {}),
        ...(utm?.medium ? { medium: utm.medium } : {}),
        ...(utm?.campaign ? { campaign: utm.campaign } : {}),
      },
    });
    if (result.status === 201) {
      return NextResponse.json({ ok: true, booking: result.booking }, { status: 201 });
    }
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  } catch (error) {
    // Rule 18: the error's name alone; its message would carry the merchant's fields.
    return routeFailure(payload.logger, 'POST /api/bookings', error);
  }
}
