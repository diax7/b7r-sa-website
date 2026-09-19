import { getRequestLanguage, type Payload, type TypedUser } from 'payload';
import { parseCookies } from 'payload/shared';
import { cms } from '@/lib/cms/payload';
import { acceptsJsonFrom } from '@/lib/request-guards';
import { type Role, roleOf } from '@/modules/cms/access';

/**
 * The admin-only JSON routes (`/api/ai/*`, ADR-042; `/api/connections/*`, ADR-047;
 * `/api/inbox/*`, ADR-061): JSON from the site's own origin, and a signed-in person of an
 * allowed role (the cookie or a JWT through Payload's `auth`), admins alone unless the
 * route names `roles`. Anything else is 403 without a body worth reading; an editor on an
 * admins-only route gets the same answer as an outsider. `language` is the panel's UI
 * language as Payload resolves it for the same request (its `payload-lng` cookie, else the
 * browser's, else English; ADR-056), so a sentence the route answers reads in the language
 * of the page that asked. `user` is the person, for a write that must run with their
 * access rather than the route's.
 */
export type AdminRequest =
  | { ok: true; payload: Payload; language: string; user: TypedUser }
  | { ok: false; response: Response };

const ADMINS: readonly Role[] = ['admin'];

export async function adminOnly(
  req: Request,
  options: { roles?: readonly Role[] } = {},
): Promise<AdminRequest> {
  if (!acceptsJsonFrom(req)) {
    return {
      ok: false,
      response: Response.json({ error: 'JSON from this site only' }, { status: 403 }),
    };
  }
  const payload = await cms();
  const { user } = await payload.auth({ headers: req.headers });
  const role = roleOf({ user } as never);
  const roles = options.roles ?? ADMINS;
  if (!user || role === null || !roles.includes(role)) {
    const error = roles.includes('editor') ? 'Staff only' : 'Admins only';
    return { ok: false, response: Response.json({ error }, { status: 403 }) };
  }
  const language = getRequestLanguage({
    config: payload.config,
    cookies: parseCookies(req.headers),
    headers: req.headers,
  });
  return { ok: true, payload, language, user };
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
