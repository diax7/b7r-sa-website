import { adminOnly, refusalOf, setMessageStatus } from '@/modules/inbox';

export const dynamic = 'force-dynamic';

/**
 * "Mark handled" on a message (ADR-061): `status: handled`, written with the person's own
 * access (admins and editors, the collection's rule). JSON from the site's origin and a
 * signed-in staff member; a write Payload refuses (an unknown id, a rule that says no)
 * answers with Payload's status and the panel's own sentence in the caller's language
 * (`refusalOf`), never Payload's message and never a personal field.
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
    const { status, error: sentence } = refusalOf(error, guard.language);
    return Response.json(sentence ? { error: sentence } : {}, { status });
  }
  return Response.json({ ok: true, status: 'handled' });
}
