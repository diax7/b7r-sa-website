import type { PayloadRequest, TaskConfig } from 'payload';
import { isProductionRuntime } from '@/lib/cms/env';
import { indexNowKey, indexNowPayload, submitIndexNow } from '@/lib/indexnow';
import { siteBase } from '@/lib/env';

export const INDEXNOW_TASK = 'indexnow-ping' as const;

/** Paths worth telling search engines about: pages, never the sitemap, the manifest or an API. */
export function indexablePaths(paths: Iterable<string>): string[] {
  return [...new Set(paths)].filter(
    (p) => p.startsWith('/') && !p.includes('.') && !p.startsWith('/api/'),
  );
}

/**
 * Whether a publish should queue a ping (ADR-033): only on the production runtime — the
 * `B7R_RUNTIME` flag set solely in the CranL production app, never the origin alone — and
 * only when the key exists. CI and previews never reach IndexNow.
 */
export function shouldPing(raw: Record<string, string | undefined> = process.env): boolean {
  return isProductionRuntime(raw) && Boolean(indexNowKey());
}

/**
 * Queues one `indexnow-ping` job for the given paths from a publish hook. Never throws into
 * the hook: a queue failure is logged and the publish stands (the next deploy's sitemap
 * submission covers it).
 */
export async function queueIndexNow(req: PayloadRequest, paths: Iterable<string>): Promise<void> {
  if (!shouldPing()) return;
  const urls = indexablePaths(paths).map((p) => `${siteBase()}${p === '/' ? '' : p}`);
  if (urls.length === 0) return;
  try {
    await req.payload.jobs.queue({ task: INDEXNOW_TASK, input: { urls } });
  } catch (error) {
    req.payload.logger.warn(`indexnow: could not queue a ping (${String(error)})`);
  }
}

/**
 * The job (BRD 7.6, ADR-033): one POST to IndexNow per publish, retried three times with
 * backoff when the endpoint fails; `submitIndexNow` accepts 200 and 202.
 */
export const indexNowTask: TaskConfig<{ input: { urls: string[] }; output: { status: number } }> = {
  slug: INDEXNOW_TASK,
  label: 'IndexNow ping',
  inputSchema: [{ name: 'urls', type: 'json', required: true }],
  outputSchema: [{ name: 'status', type: 'number' }],
  retries: { attempts: 3, backoff: { type: 'exponential', delay: 60_000 } },
  handler: async ({ input }) => {
    const key = indexNowKey();
    if (!key) return { output: { status: 204 } };
    const result = await submitIndexNow(indexNowPayload(siteBase(), key, input.urls));
    if (!result.ok) throw new Error(`IndexNow answered ${result.status}`);
    return { output: { status: result.status } };
  },
};
