import { createHmac, timingSafeEqual } from 'node:crypto';
import { internalToken } from '@/lib/internal-token';

/**
 * The manage link's token (ADR-062): `<id>.<hmac>`, the HMAC-SHA256 of the booking's id
 * under a key derived once from `PAYLOAD_SECRET` for this purpose (`internalToken`), so a
 * link cannot be forged or moved to another booking. No expiry inside the token and no
 * token column: the route verifies the signature, then reads the row and decides by its
 * status and its end (`end + 1 day`), so a cancelled or past booking refuses every action
 * whatever the link says. A bearer by design: whoever holds the merchant's e-mail holds it.
 */
export const MANAGE_TOKEN_PURPOSE = 'booking-manage';

const TOKEN_SHAPE = /^(\d{1,12})\.([A-Za-z0-9_-]{43})$/;

async function mac(id: number, secret: string | undefined): Promise<string> {
  const key = await internalToken(MANAGE_TOKEN_PURPOSE, secret);
  return createHmac('sha256', key).update(`booking:${id}`).digest('base64url');
}

export async function signManageToken(id: number, secret?: string): Promise<string> {
  return `${id}.${await mac(id, secret)}`;
}

/** The booking id a token names, or null for a malformed or forged one. */
export async function verifyManageToken(
  token: string | null | undefined,
  secret?: string,
): Promise<number | null> {
  if (!token) return null;
  const match = TOKEN_SHAPE.exec(token);
  if (!match) return null;
  const id = Number(match[1]);
  const expected = await mac(id, secret);
  const given = match[2]!;
  if (expected.length !== given.length) return null;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(given)) ? id : null;
}
