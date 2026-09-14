import { adminOnly, jsonBody, queueGeneratePost } from '@/modules/ai-content';

/**
 * "Generate now" (BRD 10.2.7): queues one run for the given topic, or the best of the
 * backlog when none is given. Manual, so the publish hour does not apply; the switch and the
 * caps still do (the run records a skip). Admins only.
 */
export async function POST(req: Request): Promise<Response> {
  const guard = await adminOnly(req);
  if (!guard.ok) return guard.response;
  const body = (await jsonBody(req)) ?? {};
  const topicId = typeof body['topicId'] === 'number' ? body['topicId'] : undefined;
  const job = await queueGeneratePost(guard.payload, {
    ...(topicId ? { topicId } : {}),
    manual: true,
  });
  return Response.json({ queued: true, jobId: job.id }, { status: 202 });
}
