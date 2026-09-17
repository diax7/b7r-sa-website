import { describe, expect, it } from 'vitest';
import { APP_URL, parseEnv } from '@/lib/env';

describe('env (ADR-052: the origins only)', () => {
  it('needs nothing: the app URL defaults and the site is non-production without an origin', () => {
    const e = parseEnv({});
    expect(e.appUrl).toBe(APP_URL);
    expect(e.siteUrl).toBeUndefined();
    expect(e.isProductionSite).toBe(false);
  });

  it('treats an empty SITE_URL like unset', () => {
    expect(parseEnv({ NEXT_PUBLIC_SITE_URL: '' }).isProductionSite).toBe(false);
  });

  it('is production only for the exact canonical origin', () => {
    expect(parseEnv({ NEXT_PUBLIC_SITE_URL: 'https://b7r.sa' }).isProductionSite).toBe(true);
    expect(parseEnv({ NEXT_PUBLIC_SITE_URL: 'https://preview.b7r.sa' }).isProductionSite).toBe(
      false,
    );
  });

  it('fails fast naming a malformed variable', () => {
    expect(() => parseEnv({ NEXT_PUBLIC_APP_URL: 'b7r.app' })).toThrow(/NEXT_PUBLIC_APP_URL/);
    expect(() => parseEnv({ NEXT_PUBLIC_SITE_URL: 'nope' })).toThrow(/NEXT_PUBLIC_SITE_URL/);
  });
});
