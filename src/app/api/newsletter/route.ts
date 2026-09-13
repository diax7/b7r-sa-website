import { NextResponse } from 'next/server';
import { clientIp, createRateLimiter } from '@/lib/rate-limit';
import { acceptsJsonFrom } from '@/lib/request-guards';
import {
  NEWSLETTER_RATE_LIMIT,
  NEWSLETTER_WINDOW_MS,
  newsletterBodySchema,
} from '@/modules/forms/newsletter/schema';
import { getNewsletterTransport } from '@/lib/newsletter-transport';

export const dynamic = 'force-dynamic';

const limiter = createRateLimiter(NEWSLETTER_RATE_LIMIT, NEWSLETTER_WINDOW_MS);

/**
 * Newsletter subscription (BRD 6.14): JSON only, same-origin, honeypot, 5 requests per IP per
 * 10 minutes, then the configured transport. Duplicates are `ok: true`. Nothing personal is
 * logged. Errors to the client are generic; the form maps them to the BRD 4.5 copy.
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
  const parsed = newsletterBodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 });
  if (parsed.data.website) return NextResponse.json({ ok: true }); // honeypot: fool the bot

  const hit = limiter.hit(clientIp(req.headers));
  if (!hit.allowed) {
    return NextResponse.json(
      { ok: false, error: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(hit.retryAfterMs / 1000)) } },
    );
  }

  const transport = getNewsletterTransport();
  const result = await transport.subscribe(parsed.data.email);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.status === 503 ? 'not_configured' : 'failed' },
      { status: result.status },
    );
  }
  return NextResponse.json({ ok: true });
}
