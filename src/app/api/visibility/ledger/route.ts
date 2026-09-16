import { createRateLimiter } from '@/lib/rate-limit';
import { adminOnly } from '@/modules/connections';
import { queueLedger } from '@/modules/visibility';

export const dynamic = 'force-dynamic';

/** One batch per ten minutes from the button; the run itself refuses a connection asked within the hour. */
const limiter = createRateLimiter(1, 10 * 60_000);

/**
 * "Run now" on the Score page (ADR-049 D5): queues the citation ledger once, served by the
 * `ai` queue within the minute. Admins only.
 */
export async function POST(req: Request): Promise<Response> {
  const guard = await adminOnly(req);
  if (!guard.ok) return guard.response;
  const hit = limiter.hit('citation-ledger');
  if (!hit.allowed) {
    return Response.json(
      { error: 'A ledger run was queued a moment ago; wait ten minutes' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(hit.retryAfterMs / 1000)) } },
    );
  }
  const job = await queueLedger(guard.payload);
  return Response.json({ queued: true, jobId: job.id }, { status: 202 });
}
