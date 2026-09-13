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

describe('login gate (ADR-034): a signed ten-minute cookie stands in for the Turnstile token', () => {
  it('a fresh gate verifies; an expired, tampered or foreign one does not', () => {
    const now = 1_700_000_000_000;
    const gate = makeLoginGate(SECRET, now);
    expect(verifyLoginGate(gate, SECRET, now + 1_000)).toBe(true);
    expect(verifyLoginGate(gate, SECRET, now + LOGIN_GATE_TTL_MS + 1)).toBe(false);
    expect(verifyLoginGate(gate, 'another-secret-of-the-same-length-0123456789012', now)).toBe(
      false,
    );
    const [exp, mac] = gate.split('.');
    expect(verifyLoginGate(`${Number(exp) + 60_000}.${mac}`, SECRET, now)).toBe(false);
    expect(verifyLoginGate(`${exp}.${mac?.slice(1)}x`, SECRET, now)).toBe(false);
    expect(verifyLoginGate('garbage', SECRET, now)).toBe(false);
    expect(verifyLoginGate(undefined, SECRET, now)).toBe(false);
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
    const gate = makeLoginGate(SECRET, now);
    const header = `${LOGIN_GATE_COOKIE}=${gate}`;
    expect(loginAllowed({ cookieHeader: null, secret: SECRET, turnstileSecret: undefined })).toBe(
      true,
    );
    expect(loginAllowed({ cookieHeader: null, secret: SECRET, turnstileSecret: 'ts', now })).toBe(
      false,
    );
    expect(loginAllowed({ cookieHeader: header, secret: SECRET, turnstileSecret: 'ts', now })).toBe(
      true,
    );
    expect(
      loginAllowed({
        cookieHeader: header,
        secret: SECRET,
        turnstileSecret: 'ts',
        now: now + LOGIN_GATE_TTL_MS + 1,
      }),
    ).toBe(false);
  });
});
