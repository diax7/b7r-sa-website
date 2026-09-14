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
    // The content engine's mock provider is for tests only (ADR-042).
    expect(() => assertProductionEnv({ ...prod, AI_CONTENT_MOCK: '1' })).toThrow(/AI_CONTENT_MOCK/);
    // The English-off switch proves a build before the English seed; never a production state (ADR-043).
    expect(() => assertProductionEnv({ ...prod, SITE_ENGLISH: 'off' })).toThrow(/SITE_ENGLISH/);
    expect(() =>
      assertProductionEnv({ ...prod, NEXT_PUBLIC_SITE_URL: 'https://preview.b7r.sa' }),
    ).toThrow(/must be https:\/\/b7r\.sa/);
  });

  it('requires the CMS set: database, a long secret, same-origin server URL, S3 (BRD 9.2)', () => {
    for (const name of [
      'DATABASE_URL',
      'PAYLOAD_SECRET',
      'S3_BUCKET',
      'S3_SECRET_ACCESS_KEY',
      // The login gate (ADR-034) must not boot open in production.
      'NEXT_PUBLIC_TURNSTILE_SITE_KEY',
      'TURNSTILE_SECRET_KEY',
    ]) {
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

describe('the admin e-mail adapter (ADR-034)', async () => {
  const { cmsEnv, parseFrom } = await import('@/lib/cms/env');
  const base = { DATABASE_URL: 'postgres://x', PAYLOAD_SECRET: 'a'.repeat(40) };

  it('parses «name <address>» and bare addresses; refuses anything else', () => {
    expect(parseFrom('بحر برنت <no-reply@b7r.sa>')).toEqual({
      fromName: 'بحر برنت',
      fromAddress: 'no-reply@b7r.sa',
    });
    expect(parseFrom('no-reply@b7r.sa')).toEqual({
      fromName: 'بحر برنت',
      fromAddress: 'no-reply@b7r.sa',
    });
    expect(parseFrom('not an address')).toBeUndefined();
    expect(parseFrom(undefined)).toBeUndefined();
  });

  it('is on only with a key and a valid sender', () => {
    expect(cmsEnv(base).email).toBeUndefined();
    expect(cmsEnv({ ...base, RESEND_API_KEY: 're_x' }).email).toBeUndefined();
    expect(
      cmsEnv({ ...base, RESEND_API_KEY: 're_x', RESEND_FROM: 'بحر برنت <a@b7r.sa>' }).email,
    ).toEqual({
      apiKey: 're_x',
      fromName: 'بحر برنت',
      fromAddress: 'a@b7r.sa',
    });
  });
});
