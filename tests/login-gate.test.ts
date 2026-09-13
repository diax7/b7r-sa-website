import { describe, expect, it } from 'vitest';
import {
  LOGIN_GATE_COOKIE,
  LOGIN_GATE_TTL_MS,
  loginGateCookie,
  makeLoginGate,
  readCookie,
  verifyLoginGate,
} from '@/lib/login-gate';
import { loginAllowed } from '@/modules/cms/auth/login-gate';

const SECRET = 'a-very-long-payload-secret-for-tests-0123456789';
const IP = '203.0.113.7';

describe('login gate (ADR-034): a signed ten-minute cookie stands in for the Turnstile token', () => {
  it('a fresh gate verifies; an expired, tampered, foreign or relocated one does not', () => {
    const now = 1_700_000_000_000;
    const gate = makeLoginGate(SECRET, IP, now);
    expect(verifyLoginGate(gate, SECRET, IP, now + 1_000)).toBe(true);
    expect(verifyLoginGate(gate, SECRET, IP, now + LOGIN_GATE_TTL_MS + 1)).toBe(false);
    expect(verifyLoginGate(gate, 'another-secret-of-the-same-length-0123456789012', IP, now)).toBe(
      false,
    );
    // The signature covers the address: a cookie solved elsewhere is worthless here.
    expect(verifyLoginGate(gate, SECRET, '198.51.100.9', now)).toBe(false);
    const [exp, mac] = gate.split('.');
    expect(verifyLoginGate(`${Number(exp) + 60_000}.${mac}`, SECRET, IP, now)).toBe(false);
    expect(verifyLoginGate(`${exp}.${mac?.slice(1)}x`, SECRET, IP, now)).toBe(false);
    expect(verifyLoginGate('garbage', SECRET, IP, now)).toBe(false);
    expect(verifyLoginGate(undefined, SECRET, IP, now)).toBe(false);
  });

  it('the cookie is HttpOnly, Lax, scoped to the CMS API and Secure in production', () => {
    const cookie = loginGateCookie('v', true);
    expect(cookie).toContain(`${LOGIN_GATE_COOKIE}=v`);
    expect(cookie).toContain('Path=/api/payload');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain('Secure');
    expect(cookie).toContain(`Max-Age=${LOGIN_GATE_TTL_MS / 1000}`);
    expect(loginGateCookie('v', false)).not.toContain('Secure');
  });

  it('reads the named cookie out of a header', () => {
    expect(readCookie(`a=1; ${LOGIN_GATE_COOKIE}=x.y; b=2`, LOGIN_GATE_COOKIE)).toBe('x.y');
    expect(readCookie('a=1', LOGIN_GATE_COOKIE)).toBeUndefined();
    expect(readCookie(null, LOGIN_GATE_COOKIE)).toBeUndefined();
  });

  it('the login operation is open without a Turnstile secret and gated with one', () => {
    const now = 1_700_000_000_000;
    const gate = makeLoginGate(SECRET, IP, now);
    const header = `${LOGIN_GATE_COOKIE}=${gate}`;
    const base = { ip: IP, secret: SECRET, turnstileSecret: 'ts', now };
    expect(loginAllowed({ ...base, cookieHeader: null, turnstileSecret: undefined })).toBe(true);
    expect(loginAllowed({ ...base, cookieHeader: null })).toBe(false);
    expect(loginAllowed({ ...base, cookieHeader: header })).toBe(true);
    expect(loginAllowed({ ...base, cookieHeader: header, ip: '198.51.100.9' })).toBe(false);
    expect(loginAllowed({ ...base, cookieHeader: header, now: now + LOGIN_GATE_TTL_MS + 1 })).toBe(
      false,
    );
  });
});
