import { describe, expect, it } from 'vitest';
import {
  isSitePath,
  PREVIEW_TTL_MS,
  previewUrl,
  signPreview,
  verifyPreview,
} from '@/lib/preview-token';

const SECRET = 'a-very-long-payload-secret-for-tests-0123456789';
const now = 1_700_000_000_000;

describe('preview token (ADR-039)', () => {
  it('accepts site paths only', () => {
    for (const ok of ['/', '/about', '/products/tee-essential', '/creators-2'])
      expect(isSitePath(ok), ok).toBe(true);
    for (const bad of [
      '',
      'about',
      '//evil.com',
      '/a//b',
      '/Admin',
      '/a b',
      '/x?y=1',
      '/a/',
      '/../x',
    ])
      expect(isSitePath(bad), bad).toBe(false);
  });

  it('a token verifies for its path and hour; not for another path, later, tampered, or bare', () => {
    const token = signPreview('/about', SECRET, now);
    expect(verifyPreview('/about', token, SECRET, now + 1_000)).toBe(true);
    expect(verifyPreview('/contact', token, SECRET, now + 1_000)).toBe(false);
    expect(verifyPreview('/about', token, SECRET, now + PREVIEW_TTL_MS + 1)).toBe(false);
    expect(
      verifyPreview('/about', token, 'other-secret-of-the-same-length-0123456789012', now),
    ).toBe(false);
    const [exp, mac] = token.split('.');
    expect(verifyPreview('/about', `${Number(exp) + 60_000}.${mac}`, SECRET, now)).toBe(false);
    expect(verifyPreview('/about', `${exp}.${mac?.slice(1)}x`, SECRET, now)).toBe(false);
    expect(verifyPreview('/about', 'garbage', SECRET, now)).toBe(false);
    expect(verifyPreview('/about', undefined, SECRET, now)).toBe(false);
    expect(verifyPreview('//evil.com', signPreview('//evil.com', SECRET, now), SECRET, now)).toBe(
      false,
    );
  });

  it('builds the link on the configured server URL', () => {
    const url = new URL(previewUrl('https://b7r.sa', '/about', SECRET, now));
    expect(url.origin + url.pathname).toBe('https://b7r.sa/api/preview');
    expect(url.searchParams.get('path')).toBe('/about');
    expect(verifyPreview('/about', url.searchParams.get('token'), SECRET, now)).toBe(true);
  });
});
