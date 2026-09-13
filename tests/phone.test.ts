import { describe, expect, it } from 'vitest';
import { formatSaudiPhone, isSaudiMobile, normalisePhone, normaliseSaudiPhone } from '@/lib/phone';

describe('normaliseSaudiPhone (BRD 4.11)', () => {
  it.each([
    ['0501699572', '966501699572'],
    ['501699572', '966501699572'],
    ['+966501699572', '966501699572'],
    ['00966501699572', '966501699572'],
    ['966501699572', '966501699572'],
    ['050 169 9572', '966501699572'],
    ['+966 50-169-9572', '966501699572'],
  ])('%s becomes %s', (input, expected) => {
    expect(normaliseSaudiPhone(input)).toBe(expected);
  });

  it.each(['', '05016995', '05016995723', '0401699572', '+971501699572', 'abc', '05O1699572'])(
    'rejects %s',
    (input) => {
      expect(normaliseSaudiPhone(input)).toBeNull();
    },
  );

  it('accepts international numbers for partners and investors, canonicalising Saudi ones', () => {
    expect(normalisePhone('0501699572')).toBe('966501699572');
    expect(normalisePhone('+971 50 123 4567')).toBe('+971501234567');
    expect(normalisePhone('0044 20 7946 0958')).toBe('+442079460958');
    expect(normalisePhone('12345678')).toBe('12345678');
    expect(normalisePhone('1234567')).toBeNull();
    expect(normalisePhone('+1 (555) 019-2834 ext')).toBeNull();
    expect(normalisePhone('abc')).toBeNull();
    expect(isSaudiMobile('966501699572')).toBe(true);
    expect(isSaudiMobile('+971501234567')).toBe(false);
  });

  it('formats the canonical form for display and leaves anything else alone', () => {
    expect(formatSaudiPhone('966501699572')).toBe('050 169 9572');
    expect(formatSaudiPhone('x')).toBe('x');
  });
});
