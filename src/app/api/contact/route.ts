import { NextResponse } from 'next/server';
import type { Payload } from 'payload';
import { getContactTransport, type SendResult } from '@/lib/contact-transport';
import { getSiteSettings } from '@/lib/cms';
import { cms } from '@/lib/cms/payload';
import { contactEnv } from '@/lib/env-server';
import { clientIp, createRateLimiter } from '@/lib/rate-limit';
import { acceptsJsonFrom } from '@/lib/request-guards';
import { verifyTurnstile } from '@/lib/turnstile';
import {
  CONTACT_RATE_LIMIT,
  CONTACT_WINDOW_MS,
  type ContactBody,
  contactBodySchema,
} from '@/modules/contact';
import { type IncomingMessage, markEmailed, originOf, storeMessage } from '@/modules/inbox';

export const dynamic = 'force-dynamic';

const limiter = createRateLimiter(CONTACT_RATE_LIMIT, CONTACT_WINDOW_MS);

/**
 * The row first, the e-mail second (ADR-061): the inbox is the record and the e-mail a
 * copy, so a transport that is down or unconfigured loses nothing. A failed store is
 * logged without a personal field and the e-mail is still tried; a failed send leaves the
 * row with `emailed: false` and names the row's id, nothing else.
 */
async function storeThenSend(
  payload: Payload,
  message: IncomingMessage,
): Promise<{ stored: number | null; sent: SendResult }> {
  let stored: number | null = null;
  try {
    stored = await storeMessage(payload, message);
  } catch (error) {
    payload.logger.error({ err: error, msg: 'contact: the message could not be stored' });
  }
  // The recipient is the contact address in the site settings (ADR-052).
  const to = (await getSiteSettings('ar')).contact.email;
  const sent = await getContactTransport(to).send(message);
  if (stored === null) return { stored, sent };
  if (sent.ok) await markEmailed(payload, stored);
  else {
    payload.logger.warn({
      msg: `contact: message ${stored} stored, the notification e-mail did not go out (${sent.status})`,
    });
  }
  return { stored, sent };
}

/**
 * Contact form (BRD 6.9), in this order: JSON + same-origin → zod → honeypot (200 to fool
 * the bot, nothing stored) → rate limit 5/10 min/IP → Turnstile `siteverify` when a secret
 * is configured → the inbox row → the e-mail. The answer is 200 once the row exists, whether
 * or not the e-mail went out; a submission that could be neither stored nor sent is 503
 * without a transport and 500 otherwise. Message bodies are never logged; client errors
 * are generic.
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

  const { stored, sent } = await storeThenSend(await cms(), incoming(parsed.data, req));
  if (stored === null && !sent.ok) {
    return NextResponse.json(
      { ok: false, error: sent.status === 503 ? 'not_configured' : 'failed' },
      { status: sent.status },
    );
  }
  return NextResponse.json({ ok: true });
}

/** The inbox row from the validated body: the form's fields and where the form was. */
function incoming(data: ContactBody, req: Request): IncomingMessage {
  const { name, phone, email, inquiry, message, locale } = data;
  return {
    name,
    phone,
    email,
    inquiry,
    message,
    locale,
    ...originOf(data, req.headers.get('referer')),
  };
}
