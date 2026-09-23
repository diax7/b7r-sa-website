import type { PayloadRequest, TextField } from 'payload';
import { APPEARANCE, toAppearance } from '@/modules/brand/appearance';
import { surfaceKeys } from '@/modules/brand/surfaces';
import { adminStringsFor } from '@/modules/cms/admin/strings';

/**
 * A section's background (spec 010, phase 2): the field every home section and every page
 * block carries, and the two refusals that keep a key meaning one set: a key no set has, and a
 * saved set's key changed. A section names a set by its key; an empty value is the section's
 * own background, as designed.
 */
export const BACKGROUND_PICKER = '@/modules/brand/admin/background-picker#BackgroundPicker';

const language = (req: PayloadRequest | undefined) => req?.i18n?.language ?? 'en';

type Validation = { req: PayloadRequest };

/** The keys a section may name, read from the Appearance global once per request. */
function allowedKeys(req: PayloadRequest): Promise<string[]> {
  const memo = req.context as { backgroundKeys?: Promise<string[]> };
  memo.backgroundKeys ??= req.payload
    .findGlobal({ slug: APPEARANCE, depth: 0, overrideAccess: true, req })
    .then((doc) => surfaceKeys(toAppearance(doc).appearance.surfaces));
  return memo.backgroundKeys;
}

/**
 * A key no set has is refused when the save brings it (a stale form, or a write through the
 * API). A stored key whose set was deleted since passes: the site already paints the section's
 * own background for it, and refusing it would block every publish of the document, a scheduled
 * one included, over a field nobody touched. The picker names the missing set instead.
 */
export async function validateBackground(
  value: unknown,
  { req, previousValue }: Validation & { previousValue?: unknown },
): Promise<true | string> {
  if (value === null || value === undefined || value === '') return true;
  if (value === previousValue) return true;
  const key = String(value);
  if ((await allowedKeys(req)).includes(key)) return true;
  return adminStringsFor(language(req)).appearance.background.unknown.replace('{key}', key);
}

export function backgroundField(): TextField {
  return {
    name: 'background',
    type: 'text',
    label: { ar: 'الخلفية', en: 'Background' },
    admin: { components: { Field: BACKGROUND_PICKER } },
    validate: validateBackground,
  };
}

const rowsOf = (value: unknown): Array<{ id?: unknown; key?: unknown }> =>
  Array.isArray(value) ? value.filter((row) => typeof row === 'object' && row !== null) : [];

/**
 * A set's key is fixed once saved (the sections that name it would lose it); its name is what
 * an editor changes. A saved row whose key differs from the stored one is refused. Deleting a
 * set is allowed: a section that named it paints its own background again.
 */
export function refuseRekey(
  value: unknown,
  { req, previousValue }: Validation & { previousValue?: unknown },
): true | string {
  const stored = new Map(rowsOf(previousValue).map((row) => [row.id, row.key]));
  const rekeyed = rowsOf(value).some(
    (row) => row.id !== undefined && stored.has(row.id) && stored.get(row.id) !== row.key,
  );
  return rekeyed ? adminStringsFor(language(req)).appearance.surfaces.key.fixed : true;
}
