import { NotFound, type Payload } from 'payload';
import { DECRYPT_CONTEXT } from '@/modules/cms/fields/secret-field';
import { type ConnectionSpec, isConnectionKind } from '@/modules/connections/kinds';
import type { AiSetting, Connection } from '@/payload-types';

/** A connection as the engine and the test read it: the key revealed by the request context. */
export function toConnectionSpec(doc: Connection): ConnectionSpec {
  return {
    id: doc.id,
    label: doc.label,
    kind: isConnectionKind(doc.kind) ? doc.kind : 'openai',
    model: doc.model ?? '',
    apiKey: doc.apiKey ?? null,
    baseUrl: doc.baseUrl ?? null,
    rates: {
      inputPerMillionUsd: doc.inputPerMillionUsd ?? 0,
      outputPerMillionUsd: doc.outputPerMillionUsd ?? 0,
    },
    monthlyLimitUsd: doc.monthlyLimitUsd ?? null,
    enabled: doc.enabled !== false,
  };
}

/**
 * The connection row, or null when there is no such row (a deleted one; the relationships
 * are `ON DELETE SET NULL`, so this is rare). Any other failure propagates: a database error
 * must never read as "no connection". `overrideAccess`: the callers have checked the admin.
 */
export async function findConnection(
  payload: Payload,
  id: number,
  options: { reveal?: boolean } = {},
): Promise<Connection | null> {
  try {
    return await payload.findByID({
      collection: 'connections',
      id,
      depth: 0,
      overrideAccess: true,
      ...(options.reveal ? { context: { [DECRYPT_CONTEXT]: true } } : {}),
    });
  } catch (error) {
    if (error instanceof NotFound) return null;
    throw error;
  }
}

/** The connection with its key revealed, as the engine and the test use it, or null. */
export async function readConnection(payload: Payload, id: number): Promise<ConnectionSpec | null> {
  const doc = await findConnection(payload, id, { reveal: true });
  return doc ? toConnectionSpec(doc) : null;
}

/** The id the engine settings' relationship holds, whatever its depth. */
export function connectionIdOf(doc: AiSetting): number | null {
  const value = doc.connection;
  if (value === null || value === undefined) return null;
  return typeof value === 'object' ? value.id : value;
}
