import type { Payload } from 'payload';
import { DECRYPT_CONTEXT } from '@/modules/cms/fields/secret-field';
import { type ConnectionSpec, isConnectionKind } from '@/modules/connections/kinds';
import type { Connection } from '@/payload-types';

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

/** The connection with its key, or null. `overrideAccess`: the callers have checked the admin. */
export async function readConnection(payload: Payload, id: number): Promise<ConnectionSpec | null> {
  const doc = await payload
    .findByID({
      collection: 'connections',
      id,
      depth: 0,
      overrideAccess: true,
      context: { [DECRYPT_CONTEXT]: true },
    })
    .catch(() => null);
  return doc ? toConnectionSpec(doc) : null;
}
