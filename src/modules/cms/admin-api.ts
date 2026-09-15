import type { Payload } from 'payload';
import { cms } from '@/lib/cms/payload';
import { acceptsJsonFrom } from '@/lib/request-guards';
import { roleOf } from '@/modules/cms/access';

/**
 * The admin-only JSON routes (`/api/ai/*`, ADR-042; `/api/connections/*`, ADR-047): JSON from
 * the site's own origin, and a signed-in admin (the cookie or a JWT through Payload's
 * `auth`). Anything else is 403 without a body worth reading; an editor gets the same answer
 * as an outsider.
 */
export type AdminRequest = { ok: true; payload: Payload } | { ok: false; response: Response };

export async function adminOnly(req: Request): Promise<AdminRequest> {
  if (!acceptsJsonFrom(req)) {
    return {
      ok: false,
      response: Response.json({ error: 'JSON from this site only' }, { status: 403 }),
    };
  }
  const payload = await cms();
  const { user } = await payload.auth({ headers: req.headers });
  const role = roleOf({ user } as never);
  if (!user || role !== 'admin') {
    return { ok: false, response: Response.json({ error: 'Admins only' }, { status: 403 }) };
  }
  return { ok: true, payload };
}

/** The JSON body, or null when it is not an object. */
export async function jsonBody(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await req.json();
    return body && typeof body === 'object' && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}
