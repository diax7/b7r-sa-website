import { describe, expect, it } from 'vitest';
import {
  assertProductionEnv,
  isProductionRuntime,
  missingProductionEnv,
  PAYLOAD_SECRET_MIN_LENGTH,
  PRODUCTION_REQUIRED_ENV,
} from '@/lib/env-server';

const full: Record<string, string> = Object.fromEntries(
  PRODUCTION_REQUIRED_ENV.map((k) => [k, 'x']),
);
const prod: Record<string, string> = {
  ...full,
  B7R_RUNTIME: 'production',
  NEXT_PUBLIC_SITE_URL: 'https://b7r.sa',
  PAYLOAD_PUBLIC_SERVER_URL: 'https://b7r.sa',
  PAYLOAD_SECRET: 'a'.repeat(PAYLOAD_SECRET_MIN_LENGTH),
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

  it('requires the CMS set: database, a long secret, same-origin server URL, S3 (BRD 9.2)', () => {
    for (const name of ['DATABASE_URL', 'PAYLOAD_SECRET', 'S3_BUCKET', 'S3_SECRET_ACCESS_KEY']) {
      expect(PRODUCTION_REQUIRED_ENV).toContain(name);
    }
    expect(() => assertProductionEnv({ ...prod, PAYLOAD_SECRET: 'short' })).toThrow(
      /PAYLOAD_SECRET must be at least 32/,
    );
    expect(() =>
      assertProductionEnv({ ...prod, PAYLOAD_PUBLIC_SERVER_URL: 'https://cms.b7r.sa' }),
    ).toThrow(/PAYLOAD_PUBLIC_SERVER_URL must be https:\/\/b7r\.sa/);
  });
});
