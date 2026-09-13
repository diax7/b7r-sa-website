import { createHash } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { countInRange, PASSWORD_MIN_LENGTH, passwordProblem, pwnedCount } from '@/lib/pwned';

const PASSWORD = 'correct horse battery staple';
const SHA1 = createHash('sha1').update(PASSWORD).digest('hex').toUpperCase();
const PREFIX = SHA1.slice(0, 5);
const SUFFIX = SHA1.slice(5);

function fakeFetch(body: string, status = 200) {
  const calls: Array<{ url: string; init: RequestInit | undefined }> = [];
  const impl = ((url: string, init?: RequestInit) => {
    calls.push({ url, init });
    return Promise.resolve(new Response(body, { status }));
  }) as unknown as typeof fetch;
  return { impl, calls };
}

afterEach(() => vi.restoreAllMocks());

describe('countInRange', () => {
  it('finds the suffix case-insensitively and reads its count', () => {
    const body = `0018A45C4D1DEF81644B54AB7F969B88D65:3\r\n${SUFFIX.toLowerCase()}:1571\r\nAAAA:0`;
    expect(countInRange(body, SUFFIX)).toBe(1571);
  });

  it('is zero when the suffix is absent, padded rows included', () => {
    expect(countInRange(`${SUFFIX}X:5\nBBBB:0`, SUFFIX)).toBe(0);
    expect(countInRange('', SUFFIX)).toBe(0);
  });
});

describe('pwnedCount (k-anonymity)', () => {
  it('sends only the five-character prefix, with padding requested', async () => {
    const { impl, calls } = fakeFetch(`${SUFFIX}:12`);
    expect(await pwnedCount(PASSWORD, impl)).toBe(12);
    expect(calls[0]?.url).toBe(`https://api.pwnedpasswords.com/range/${PREFIX}`);
    expect(calls[0]?.url).not.toContain(SUFFIX);
    expect(new Headers(calls[0]?.init?.headers).get('Add-Padding')).toBe('true');
  });

  it('returns null when the service answers an error or throws', async () => {
    expect(await pwnedCount(PASSWORD, fakeFetch('', 503).impl)).toBeNull();
    const failing = (() => Promise.reject(new Error('offline'))) as unknown as typeof fetch;
    expect(await pwnedCount(PASSWORD, failing)).toBeNull();
  });
});

describe('passwordProblem (admin password policy)', () => {
  it('rejects short passwords before touching the network', async () => {
    const { impl, calls } = fakeFetch(`${SUFFIX}:1`);
    expect(await passwordProblem('a'.repeat(PASSWORD_MIN_LENGTH - 1), impl)).toBe('too_short');
    expect(calls).toHaveLength(0);
  });

  it('rejects breached passwords and accepts clean ones', async () => {
    expect(await passwordProblem(PASSWORD, fakeFetch(`${SUFFIX}:1`).impl)).toBe('breached');
    expect(await passwordProblem(PASSWORD, fakeFetch('AAAA:9').impl)).toBeNull();
  });

  it('fails open with a warning when the service is unreachable', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await passwordProblem(PASSWORD, fakeFetch('', 500).impl)).toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('breach check unavailable'));
  });
});
