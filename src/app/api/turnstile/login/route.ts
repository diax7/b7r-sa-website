import { NextResponse } from 'next/server';
import { cmsEnv } from '@/lib/cms/env';
import { contactEnv } from '@/lib/env-server';
import { loginGateCookie, makeLoginGate } from '@/lib/login-gate';
import { clientIp, createRateLimiter } from '@/lib/rate-limit';
import { acceptsJsonFrom } from '@/lib/request-guards';
import { verifyTurnstile } from '@/lib/turnstile';

export const dynamic = 'force-dynamic';

/** Ten verifications per ten minutes per IP: a login page renders one widget. */
const limiter = createRateLimiter(10, 10 * 60 * 1000);

/**
 * The admin login gate (ADR-034): the widget on the login page posts its Turnstile token
 * here; a verified token becomes a signed, HttpOnly, ten-minute cookie that the login
 * operation checks. Without a secret the gate is open (204, no cookie) so a fresh install
 * can still sign in; `/api/health` shows `turnstile: off`.
 */
export async function POST(req: Request) {
  if (!acceptsJsonFrom(req)) return NextResponse.json({ ok: false }, { status: 403 });
  const { turnstileSecretKey } = contactEnv();
  if (!turnstileSecretKey) return new NextResponse(null, { status: 204 });
  const ip = clientIp(req.headers);
  if (!limiter.hit(ip).allowed) return NextResponse.json({ ok: false }, { status: 429 });
  let token: unknown;
  try {
    token = ((await req.json()) as { token?: unknown }).token;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (typeof token !== 'string' || !(await verifyTurnstile(token, turnstileSecretKey, ip))) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }
  const res = new NextResponse(null, { status: 204 });
  res.headers.set(
    'Set-Cookie',
    loginGateCookie(makeLoginGate(cmsEnv().secret), process.env.NODE_ENV === 'production'),
  );
  return res;
}
