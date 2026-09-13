import type { PayloadRequest } from 'payload';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  indexablePaths,
  indexNowTask,
  INDEXNOW_TASK,
  queueIndexNow,
  shouldPing,
} from '@/modules/cms/jobs/indexnow';

const KEY = 'a1b2c3d4e5f6g7h8';

function fakeReq() {
  const queue = vi.fn(async () => ({ id: 1 }));
  const warn = vi.fn();
  const req = { payload: { jobs: { queue }, logger: { warn } } } as unknown as PayloadRequest;
  return { req, queue, warn };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('IndexNow job (BRD 7.6, ADR-033)', () => {
  it('keeps only page paths: no sitemap, manifest or API routes, no duplicates', () => {
    expect(
      indexablePaths([
        '/',
        '/products/hoodie',
        '/sitemap.xml',
        '/manifest.webmanifest',
        '/api/pages/slugs',
        '/',
        '/faq',
      ]),
    ).toEqual(['/', '/products/hoodie', '/faq']);
  });

  it('pings only on the production runtime with a valid key', () => {
    expect(shouldPing({ B7R_RUNTIME: 'production', INDEXNOW_KEY: KEY })).toBe(false); // key read from process.env
    vi.stubEnv('INDEXNOW_KEY', KEY);
    expect(shouldPing({ B7R_RUNTIME: 'production' })).toBe(true);
    expect(shouldPing({ B7R_RUNTIME: 'preview' })).toBe(false);
    expect(shouldPing({})).toBe(false);
    vi.stubEnv('INDEXNOW_KEY', 'short');
    expect(shouldPing({ B7R_RUNTIME: 'production' })).toBe(false);
  });

  it('queues one job with absolute URLs on production, nothing elsewhere, never throws', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://b7r.sa');
    const { req, queue } = fakeReq();
    await queueIndexNow(req, ['/', '/faq']);
    expect(queue).not.toHaveBeenCalled();

    vi.stubEnv('B7R_RUNTIME', 'production');
    vi.stubEnv('INDEXNOW_KEY', KEY);
    await queueIndexNow(req, ['/', '/faq', '/sitemap.xml']);
    expect(queue).toHaveBeenCalledWith({
      task: INDEXNOW_TASK,
      input: { urls: ['https://b7r.sa', 'https://b7r.sa/faq'] },
    });

    const failing = fakeReq();
    failing.queue.mockRejectedValueOnce(new Error('db down'));
    await expect(queueIndexNow(failing.req, ['/'])).resolves.toBeUndefined();
    expect(failing.warn).toHaveBeenCalledTimes(1);
  });

  it('the handler posts the payload with the key location and fails the job on a bad answer', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://b7r.sa');
    vi.stubEnv('INDEXNOW_KEY', KEY);
    const fetch = vi.fn(async () => new Response('', { status: 202 }));
    vi.stubGlobal('fetch', fetch);
    const handler = indexNowTask.handler as (args: { input: { urls: string[] } }) => Promise<{
      output: { status: number };
    }>;
    const result = await handler({ input: { urls: ['https://b7r.sa/faq', 'https://evil.com/x'] } });
    expect(result.output.status).toBe(202);
    const body = JSON.parse(
      (fetch.mock.calls[0] as unknown as [string, { body: string }])[1].body,
    ) as {
      key: string;
      keyLocation: string;
      urlList: string[];
    };
    expect(body.key).toBe(KEY);
    expect(body.keyLocation).toBe(`https://b7r.sa/indexnow/${KEY}.txt`);
    expect(body.urlList).toEqual(['https://b7r.sa/faq']);

    fetch.mockResolvedValueOnce(new Response('', { status: 429 }));
    await expect(handler({ input: { urls: ['https://b7r.sa/faq'] } })).rejects.toThrow(/429/);
    expect(indexNowTask.retries).toEqual({
      attempts: 3,
      backoff: { type: 'exponential', delay: 60_000 },
    });
  });
});
