import { type Field, type FieldHookArgs, ValidationError } from 'payload';
import { parseServiceAccount } from '@/lib/service-account';

/**
 * A secret text field (ADR-042, ADR-047): stored encrypted with Payload's `encrypt` (derived from
 * `PAYLOAD_SECRET`; rotating the secret invalidates every stored key), read back as a mask
 * (`••••` + the last four characters) unless the request carries
 * `context.decryptKeys === true`, which only the engine's and the connection test's Local API
 * reads set. The admin form posts the whole document back on every save, so an incoming mask
 * keeps the stored ciphertext; an empty value clears it; anything else is a new key. The
 * ciphertext is read from the database row itself: the `previousValue` a hook is handed has
 * been through `afterRead`, so it is the mask, not the stored value.
 */
export const MASK_PREFIX = '••••';
export const DECRYPT_CONTEXT = 'decryptKeys';

export function isMask(value: unknown): boolean {
  return typeof value === 'string' && value.startsWith(MASK_PREFIX);
}

export function maskOf(plain: string): string {
  return `${MASK_PREFIX}${plain.slice(-4)}`;
}

/** The mask a service account reads back as: the account's e-mail tail, so Dhia knows which one. */
export function maskOfServiceAccount(plain: string): string {
  const key = parseServiceAccount(plain);
  return typeof key === 'string'
    ? `${MASK_PREFIX}????`
    : `${MASK_PREFIX}${key.clientEmail.slice(key.clientEmail.indexOf('@'))}`;
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
  /** How to mask this row's secret (a service account shows its e-mail tail). */
  mask?: (plain: string) => string;
}): string | null {
  const { stored, reveal, decrypt, mask = maskOf } = args;
  if (typeof stored !== 'string' || !stored) return null;
  let plain: string;
  try {
    plain = decrypt(stored);
  } catch {
    // A key encrypted under another secret: unreadable, shown as such.
    return reveal ? null : `${MASK_PREFIX}????`;
  }
  return reveal ? plain : mask(plain);
}

/** The value as stored, straight from the database row (no `afterRead`), or null. */
async function storedValue(args: FieldHookArgs): Promise<unknown> {
  const { req, collection, global, originalDoc, path } = args;
  let row: unknown = null;
  const id = (originalDoc as { id?: number | string } | undefined)?.id;
  if (collection && id !== undefined) {
    row = await req.payload.db.findOne({
      collection: collection.slug,
      where: { id: { equals: id } },
      req,
    });
  } else if (global) {
    row = await req.payload.db.findGlobal({ slug: global.slug, req });
  }
  return path.reduce<unknown>(
    (node, key) => (node as Record<string, unknown> | null | undefined)?.[String(key)],
    row,
  );
}

/** The reason a new value is not a service account key, or null when it is (or is no new value). */
export function serviceAccountProblem(value: unknown): string | null {
  if (typeof value !== 'string' || value === '' || isMask(value)) return null;
  const key = parseServiceAccount(value);
  return typeof key === 'string' ? `Service account key: ${key}` : null;
}

/**
 * A secret field. `options.serviceAccountWhen(siblingData)` names the rows whose secret is a
 * service account's JSON key: those are checked at save (a bad paste fails in the form, on
 * the field) and mask as the account's e-mail tail. The check lives in the `beforeChange`
 * hook rather than `validate`: Payload runs a field's hooks first and validates what they
 * return, which here is the ciphertext.
 */
export function secretField(
  name: string,
  label: { ar: string; en: string },
  options: { serviceAccountWhen?: (siblingData: Record<string, unknown>) => boolean } = {},
): Field {
  const isAccount = (siblingData: unknown) =>
    Boolean(options.serviceAccountWhen?.((siblingData ?? {}) as Record<string, unknown>));
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
        async (args) => {
          const problem = isAccount(args.siblingData) ? serviceAccountProblem(args.value) : null;
          if (problem) {
            throw new ValidationError({
              ...(args.collection ? { collection: args.collection.slug } : {}),
              ...(args.global ? { global: args.global.slug } : {}),
              errors: [{ label, message: problem, path: args.path.join('.') }],
              req: args.req,
            });
          }
          return nextStoredValue({
            incoming: args.value,
            previous:
              args.value === undefined || isMask(args.value) ? await storedValue(args) : null,
            encrypt: (plain) => args.req.payload.encrypt(plain),
          });
        },
      ],
      afterRead: [
        ({ value, req, siblingData }) =>
          readValue({
            stored: value,
            reveal: req?.context?.[DECRYPT_CONTEXT] === true,
            decrypt: (hash) => req.payload.decrypt(hash),
            ...(isAccount(siblingData) ? { mask: maskOfServiceAccount } : {}),
          }),
      ],
    },
  };
}
