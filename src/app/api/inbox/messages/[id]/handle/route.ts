import { APIError } from 'payload';
import { adminOnly, setMessageStatus } from '@/modules/inbox';

export const dynamic = 'force-dynamic';

/**
 * "Mark handled" on a message (ADR-061): `status: handled`, written with the person's own
 * access (admins and editors, the collection's rule). JSON from the site's origin and a
 * signed-in staff member; a write Payload refuses (an unknown id, a rule that says no)
 * answers with Payload's status and sentence, never a personal field.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const guard = await adminOnly(req, { roles: ['admin', 'editor'] });
  if (!guard.ok) return guard.response;
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ error: 'id: a number' }, { status: 400 });
  }
  try {
    await setMessageStatus(guard.payload, { id, status: 'handled', user: guard.user });
  } catch (error) {
    if (error instanceof APIError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
  return Response.json({ ok: true, status: 'handled' });
}
