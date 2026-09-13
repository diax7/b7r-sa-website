import { describe, expect, it } from 'vitest';
import { acceptsJsonFrom, isJsonRequest, originAllowed } from '@/lib/request-guards';

const req = (headers: Record<string, string>) =>
  new Request('http://localhost:3004/api/x', { method: 'POST', headers });

describe('request guards (BRD 8.10: API hygiene)', () => {
  it('requires a JSON content type', () => {
    expect(isJsonRequest(req({ 'content-type': 'application/json' }))).toBe(true);
    expect(isJsonRequest(req({ 'content-type': 'application/json; charset=utf-8' }))).toBe(true);
    expect(isJsonRequest(req({ 'content-type': 'text/plain' }))).toBe(false);
    expect(isJsonRequest(req({}))).toBe(false);
  });

  it('accepts a missing Origin and the request host; refuses a foreign origin', () => {
    expect(originAllowed(req({}))).toBe(true);
    expect(originAllowed(req({ origin: 'http://localhost:3004', host: 'localhost:3004' }))).toBe(
      true,
    );
    expect(originAllowed(req({ origin: 'https://evil.example', host: 'localhost:3004' }))).toBe(
      false,
    );
    expect(originAllowed(req({ origin: 'not a url', host: 'localhost:3004' }))).toBe(false);
  });

  it('combines both', () => {
    expect(
      acceptsJsonFrom(req({ 'content-type': 'application/json', host: 'localhost:3004' })),
    ).toBe(true);
    expect(
      acceptsJsonFrom(req({ 'content-type': 'application/json', origin: 'https://evil.example' })),
    ).toBe(false);
  });
});
