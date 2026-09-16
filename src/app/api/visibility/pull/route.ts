import { createRateLimiter } from '@/lib/rate-limit';
import { adminOnly } from '@/modules/connections';
import { queuePull } from '@/modules/visibility';

export const dynamic = 'force-dynamic';

/** One pull per ten minutes: the services rate-limit, and a double click must not queue two. */
const limiter = createRateLimiter(1, 10 * 60_000);

/**
 * "Pull now" on the Score page (ADR-049): queues the nightly pull once, served by the `ai`
 * queue within the minute. Admins only.
 */
export async function POST(req: Request): Promise<Response> {
  const guard = await adminOnly(req);
  if (!guard.ok) return guard.response;
  const hit = limiter.hit('visibility-pull');
  if (!hit.allowed) {
    return Response.json(
      { error: 'A pull ran a moment ago; wait ten minutes' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(hit.retryAfterMs / 1000)) } },
    );
  }
  const job = await queuePull(guard.payload);
  return Response.json({ queued: true, jobId: job.id }, { status: 202 });
}
