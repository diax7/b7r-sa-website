import { adminOnly, jsonBody, queueGeneratePost } from '@/modules/ai-content';

/**
 * "Regenerate" on an engine post (BRD 10.2.5): a new run from the post's topic that
 * replaces the content under the same slug and cover. Admins only.
 */
export async function POST(req: Request): Promise<Response> {
  const guard = await adminOnly(req);
  if (!guard.ok) return guard.response;
  const body = (await jsonBody(req)) ?? {};
  const postId = typeof body['postId'] === 'number' ? body['postId'] : null;
  if (!postId) return Response.json({ error: 'postId required' }, { status: 400 });
  const job = await queueGeneratePost(guard.payload, { replacePostId: postId, manual: true });
  return Response.json({ queued: true, jobId: job.id }, { status: 202 });
}
