import { CALENDAR_TESTS } from '@/modules/bookings';
import { adminOnly, jsonBody, testConnection } from '@/modules/connections';
import { SERVICE_TESTS } from '@/modules/visibility';

/** The service kinds' tests: the visibility services (ADR-049) and the calendars (ADR-062). */
const TESTS = { ...SERVICE_TESTS, ...CALENDAR_TESTS };

/**
 * "Test connection" (ADR-047): one short call through the connection's stored key; the
 * outcome is recorded on the connection and returned. Admins only; one test per connection
 * per ten seconds.
 */
export async function POST(req: Request): Promise<Response> {
  const guard = await adminOnly(req);
  if (!guard.ok) return guard.response;
  const body = (await jsonBody(req)) ?? {};
  const id = body['id'];
  if (typeof id !== 'number') return Response.json({ error: 'id: a number' }, { status: 400 });
  const result = await testConnection(guard.payload, id, TESTS, guard.language);
  if (!result.ok) return Response.json({ error: result.message }, { status: result.status });
  return Response.json({ ok: true, message: result.message });
}
