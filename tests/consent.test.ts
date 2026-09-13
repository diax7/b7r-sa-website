import { describe, expect, it } from 'vitest';
import { parseConsent, readConsent, serializeConsent, writeConsent } from '@/lib/consent';

describe('consent cookie (BRD 6.16)', () => {
  it('parses granted/denied and ignores other values', () => {
    expect(parseConsent('a=1; b7r_consent=granted; c=2')).toBe('granted');
    expect(parseConsent('b7r_consent=denied')).toBe('denied');
    expect(parseConsent('b7r_consent=maybe')).toBeNull();
    expect(parseConsent('')).toBeNull();
  });

  it('serialises a 180-day, Lax, path-wide cookie, Secure on https', () => {
    expect(serializeConsent('granted', false)).toBe(
      'b7r_consent=granted; Max-Age=15552000; Path=/; SameSite=Lax',
    );
    expect(serializeConsent('denied', true)).toContain('; Secure');
  });

  it('round-trips through document.cookie', () => {
    writeConsent('denied');
    expect(readConsent()).toBe('denied');
    writeConsent('granted');
    expect(readConsent()).toBe('granted');
  });
});
