import type { Field } from 'payload';

/**
 * A secret text field (ADR-042): stored encrypted with Payload's `encrypt` (derived from
 * `PAYLOAD_SECRET`; rotating the secret invalidates every stored key), read back as a mask
 * (`••••` + the last four characters) unless the request carries
 * `context.decryptKeys === true`, which only the pipeline's Local API reads set. The admin
 * form posts the whole global back on every save, so an incoming mask keeps the stored
 * ciphertext; an empty value clears it; anything else is a new key.
 */
export const MASK_PREFIX = '••••';
export const DECRYPT_CONTEXT = 'decryptKeys';

export function isMask(value: unknown): boolean {
  return typeof value === 'string' && value.startsWith(MASK_PREFIX);
}

export function maskOf(plain: string): string {
  return `${MASK_PREFIX}${plain.slice(-4)}`;
}

/** What to store, given what the form sent and what is stored (pure, unit-tested). */
export function nextStoredValue(args: {
  incoming: unknown;
  previous: unknown;
  encrypt: (plain: string) => string;
}): string | null {
  const { incoming, previous, encrypt } = args;
  if (incoming === undefined) return typeof previous === 'string' ? previous : null;
  if (incoming === null || incoming === '') return null;
  if (typeof incoming !== 'string') return typeof previous === 'string' ? previous : null;
  if (isMask(incoming)) return typeof previous === 'string' ? previous : null;
  return encrypt(incoming.trim());
}

/** What a reader gets: the plain key for the pipeline, a mask for everyone else. */
export function readValue(args: {
  stored: unknown;
  reveal: boolean;
  decrypt: (hash: string) => string;
}): string | null {
  const { stored, reveal, decrypt } = args;
  if (typeof stored !== 'string' || !stored) return null;
  let plain: string;
  try {
    plain = decrypt(stored);
  } catch {
    // A key encrypted under another secret: unreadable, shown as such.
    return reveal ? null : `${MASK_PREFIX}????`;
  }
  return reveal ? plain : maskOf(plain);
}

export function secretField(name: string, label: { ar: string; en: string }): Field {
  return {
    name,
    type: 'text',
    label,
    admin: {
      description: {
        ar: 'يُحفظ مشفّراً ولا يُعرض مرة أخرى؛ اتركه كما هو للإبقاء عليه، أو امسحه لإزالته.',
        en: 'Stored encrypted and never shown again; leave the mask to keep it, clear it to remove it.',
      },
    },
    hooks: {
      beforeChange: [
        ({ value, previousValue, req }) =>
          nextStoredValue({
            incoming: value,
            previous: previousValue,
            encrypt: (plain) => req.payload.encrypt(plain),
          }),
      ],
      afterRead: [
        ({ value, req }) =>
          readValue({
            stored: value,
            reveal: req?.context?.[DECRYPT_CONTEXT] === true,
            decrypt: (hash) => req.payload.decrypt(hash),
          }),
      ],
    },
  };
}
