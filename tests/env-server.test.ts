import { describe, expect, it } from 'vitest';
import {
  assertProductionEnv,
  isProductionRuntime,
  missingProductionEnv,
  PRODUCTION_REQUIRED_ENV,
} from '@/lib/env-server';

const full: Record<string, string> = Object.fromEntries(
  PRODUCTION_REQUIRED_ENV.map((k) => [k, 'x']),
);
const prod: Record<string, string> = {
  ...full,
  B7R_RUNTIME: 'production',
  NEXT_PUBLIC_SITE_URL: 'https://b7r.sa',
};

describe('production env gate (BRD 8.5)', () => {
  it('is a no-op unless B7R_RUNTIME=production, so CI on the production origin never trips', () => {
    expect(isProductionRuntime({ NEXT_PUBLIC_SITE_URL: 'https://b7r.sa' })).toBe(false);
    expect(() => assertProductionEnv({ NEXT_PUBLIC_SITE_URL: 'https://b7r.sa' })).not.toThrow();
  });

  it('passes with the whole BRD 8.5 set', () => {
    expect(missingProductionEnv(prod)).toEqual([]);
    expect(() => assertProductionEnv(prod)).not.toThrow();
  });

  it('throws naming every missing variable', () => {
    const { RESEND_API_KEY: _a, INDEXNOW_KEY: _b, ...partial } = prod;
    expect(missingProductionEnv(partial)).toEqual(['RESEND_API_KEY', 'INDEXNOW_KEY']);
    expect(() => assertProductionEnv(partial)).toThrow(/RESEND_API_KEY[\s\S]*INDEXNOW_KEY/);
  });

  it('refuses test transports and a non-canonical origin in production', () => {
    expect(() => assertProductionEnv({ ...prod, NEWSLETTER_TRANSPORT: 'mock' })).toThrow(
      /NEWSLETTER_TRANSPORT/,
    );
    expect(() =>
      assertProductionEnv({ ...prod, NEXT_PUBLIC_SITE_URL: 'https://preview.b7r.sa' }),
    ).toThrow(/must be https:\/\/b7r\.sa/);
  });
});
