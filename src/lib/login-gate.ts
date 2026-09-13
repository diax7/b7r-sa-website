import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * The admin login gate (BRD 9.3 "Turnstile on the login form", ADR-034). The widget on the
 * login page verifies one Turnstile token through `/api/turnstile/login`, which answers with
 * a short-lived signed cookie; the login operation then admits a request that carries a
 * valid cookie without another network call. Tokens are single-use, so a verified cookie
 * — not a token per attempt — is what lets a mistyped password be retried. The signature
 * covers the client address, so one solved challenge cannot be handed to a farm; a visitor
 * whose address changes mid-flow solves it once more. Pure functions here (unit-tested);
 * the cookie name is shared with the endpoint and the hook.
 */
export const LOGIN_GATE_COOKIE = 'b7r_login_ok';
export const LOGIN_GATE_TTL_MS = 10 * 60 * 1000;

function sign(exp: number, ip: string, secret: string): string {
  return createHmac('sha256', secret).update(`login-gate:${exp}:${ip}`).digest('base64url');
}

/** `<exp>.<hmac>`: the expiry in ms since the epoch and the client address, signed. */
export function makeLoginGate(
  secret: string,
  ip: string,
  now = Date.now(),
  ttlMs = LOGIN_GATE_TTL_MS,
): string {
  const exp = now + ttlMs;
  return `${exp}.${sign(exp, ip, secret)}`;
}

/** True when the value is well-formed, signed for this address with this secret, and live. */
export function verifyLoginGate(
  value: string | undefined,
  secret: string,
  ip: string,
  now = Date.now(),
): boolean {
  if (!value) return false;
  const [expText, mac] = value.split('.');
  if (!expText || !mac) return false;
  const exp = Number(expText);
  if (!Number.isFinite(exp) || exp < now) return false;
  const expected = sign(exp, ip, secret);
  if (expected.length !== mac.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(mac));
}

/** The named cookie's value from a `Cookie` header, or undefined. */
export function readCookie(header: string | null | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) return decodeURIComponent(rest.join('='));
  }
  return undefined;
}

/** The `Set-Cookie` value for a fresh gate: HttpOnly, Lax, scoped to the CMS API. */
export function loginGateCookie(value: string, secure: boolean): string {
  return [
    `${LOGIN_GATE_COOKIE}=${value}`,
    'Path=/api/payload',
    `Max-Age=${Math.floor(LOGIN_GATE_TTL_MS / 1000)}`,
    'HttpOnly',
    'SameSite=Lax',
    secure ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ');
}
