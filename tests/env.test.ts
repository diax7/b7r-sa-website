import { describe, expect, it } from 'vitest';
import { parseEnv } from '@/lib/env';

const good = { NEXT_PUBLIC_APP_URL: 'https://b7r.app', NEXT_PUBLIC_WHATSAPP: '966501699572' };

describe('env', () => {
  it('parses the minimal 1a set and marks non-production when SITE_URL is unset', () => {
    const e = parseEnv(good);
    expect(e.appUrl).toBe('https://b7r.app');
    expect(e.siteUrl).toBeUndefined();
    expect(e.isProductionSite).toBe(false);
  });

  it('treats an empty SITE_URL like unset', () => {
    expect(parseEnv({ ...good, NEXT_PUBLIC_SITE_URL: '' }).isProductionSite).toBe(false);
  });

  it('is production only for the exact canonical origin', () => {
    expect(parseEnv({ ...good, NEXT_PUBLIC_SITE_URL: 'https://b7r.sa' }).isProductionSite).toBe(
      true,
    );
    expect(
      parseEnv({ ...good, NEXT_PUBLIC_SITE_URL: 'https://preview.b7r.sa' }).isProductionSite,
    ).toBe(false);
  });

  it('fails fast naming the missing variable', () => {
    expect(() => parseEnv({ NEXT_PUBLIC_WHATSAPP: '966501699572' })).toThrow(/NEXT_PUBLIC_APP_URL/);
    expect(() =>
      parseEnv({ NEXT_PUBLIC_APP_URL: 'https://b7r.app', NEXT_PUBLIC_WHATSAPP: '+966 50' }),
    ).toThrow(/NEXT_PUBLIC_WHATSAPP/);
  });
});
