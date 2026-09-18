import { createHash } from 'node:crypto';
import type {
  CollectionBeforeReadHook,
  Field,
  GlobalBeforeReadHook,
  PayloadRequest,
} from 'payload';
import {
  hasTwins,
  type HeavyKind,
  isDoc,
  localePair,
  type PendingEntries,
  pendingOf,
  readKey,
  rowShapeOf,
  type Shape,
  shapeOf,
  SKIP_TRANSLATIONS,
  TRANSLATIONS,
  twinName,
  writeKey,
} from '@/modules/cms/fields/bilingual';

/**
 * The heavy twins' server side (ADR-057, PR B of `docs/plans/2026-09-18-no-locale-switch.md`):
 * a localized rich text or upload has a real sibling field `<name>Twin` that Payload's own
 * component renders under it (`twinField`). Two jobs live here.
 *
 * Population. A `beforeRead` hook fills every twin from the document's own other-locale
 * value: Payload runs `beforeRead` in read operations only (find, findByID, findGlobal, the
 * versions), before hidden fields are removed and before localized values are flattened
 * into the requested locale, so the doc it sees still carries every locale (`{ ar, en }`)
 * and no second read is needed. An `afterRead` hook would not do: Payload runs it inside
 * `update` too (before `afterChange`), where it would overwrite what the editor typed with
 * the stored English and refresh its base, and a global's hook cannot tell the two apart.
 * The hook runs only for a signed-in user reading the default locale (the site's reads and
 * the mechanism's own English reads pay nothing), fills a twin that is null (one holding a
 * value is the pending English of an autosaved draft, kept with its base), and writes the
 * base into the hidden JSON: `{ base }` under the original's key, a sha256 of the canonical
 * English rich text or the English upload's id.
 *
 * Apply. The `afterChange` hook (`hooks/translations.ts`) reads each twin's value from the
 * request's data (the field itself stores null on a Save or Publish: `twinField`'s own
 * `beforeChange`), keeps the ones that still apply (`twinApplies`: the value differs from the
 * base and the stored English still hashes to it) and writes them on the original's key in
 * the other locale, a twin inside a list riding the whole-list row build.
 */
type Doc = Record<string, unknown>;

/** Canonical JSON: keys sorted at every level, `undefined` dropped; storage order never changes it. */
export function canonical(value: unknown): string {
  return JSON.stringify(value, (_key, v: unknown) =>
    isDoc(v)
      ? Object.fromEntries(
          Object.keys(v)
            .toSorted()
            .map((k) => [k, v[k]]),
        )
      : v,
  );
}

/** The base of a rich text: a sha256 of its canonical JSON; null for no text. */
export function hashOf(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return createHash('sha256').update(canonical(value)).digest('hex');
}

/** An upload's id as a string (a raw id, or a populated document's), or null for none. */
export function idOf(value: unknown): string | null {
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return value === '' ? null : value;
  if (isDoc(value)) return idOf(value['id']);
  return null;
}

/** A twin's base for a value: an upload's id, a rich text's hash; null for nothing there. */
export const twinBase = (kind: HeavyKind, value: unknown): string | null =>
  kind === 'upload' ? idOf(value) : hashOf(value);

/**
 * Whether a twin still applies against the other locale: the editor changed it (its base
 * differs from the entry's) and nobody changed the stored English meanwhile (it still
 * hashes to the base). A stale twin loses nothing: the stored edit wins.
 */
export function twinApplies(
  kind: HeavyKind,
  value: unknown,
  base: string | null,
  stored: unknown,
): boolean {
  return twinBase(kind, value) !== base && twinBase(kind, stored) === base;
}

interface TwinAt {
  /** The original's key (`blocks.<rowId>.content`) and the twin's (`blocks.<rowId>.contentTwin`). */
  key: string;
  twinKey: string;
  name: string;
  kind: HeavyKind;
  /** The document or row that holds both fields. */
  node: Doc;
}

/** Every twin of a document, walked by the shape through groups and rows by id. */
function twinsIn(shape: Shape, node: unknown, prefix: string, out: TwinAt[] = []): TwinAt[] {
  if (!isDoc(node)) return out;
  for (const [name, kind] of Object.entries(shape.twins)) {
    out.push({ key: `${prefix}${name}`, twinKey: `${prefix}${twinName(name)}`, name, kind, node });
  }
  for (const [name, group] of Object.entries(shape.groups)) {
    twinsIn(group, node[name], `${prefix}${name}.`, out);
  }
  for (const [name, list] of Object.entries(shape.lists)) {
    const rows = node[name];
    if (!Array.isArray(rows)) continue;
    for (const row of rows) {
      if (!isDoc(row) || typeof row['id'] !== 'string') continue;
      const rowShape = rowShapeOf(list, row);
      if (rowShape) twinsIn(rowShape, row, `${prefix}${name}.${row['id']}.`, out);
    }
  }
  return out;
}

/** The value of one locale inside a pre-flatten localized value (`{ ar, en }`), or undefined. */
const localeValue = (raw: unknown, locale: string): unknown =>
  isDoc(raw) && Object.hasOwn(raw, locale) ? raw[locale] : undefined;

function populate(req: PayloadRequest, doc: unknown, fields: Field[]): unknown {
  if (!req.user || req.context?.[SKIP_TRANSLATIONS] || !isDoc(doc)) return doc;
  const pair = localePair(req);
  if (!pair?.isDefault) return doc;
  const shape = shapeOf(fields);
  if (!hasTwins(shape)) return doc;
  const pending: PendingEntries = { ...pendingOf(doc[TRANSLATIONS], pair.other) };
  for (const { key, name, kind, node } of twinsIn(shape, doc, '')) {
    const twin = twinName(name);
    if (node[twin] !== null && node[twin] !== undefined) continue;
    const other = localeValue(node[name], pair.other);
    node[twin] = other === undefined || other === null ? null : structuredClone(other);
    pending[key] = { base: twinBase(kind, other) };
  }
  const json = isDoc(doc[TRANSLATIONS]) ? doc[TRANSLATIONS] : {};
  doc[TRANSLATIONS] = { ...json, [pair.other]: pending };
  return doc;
}

/** Collections: an admin read fills every twin from the document's own other locale. */
export const populateTwins: CollectionBeforeReadHook = ({ doc, req, collection }) =>
  populate(req, doc, collection.fields);

/** Globals: the same. */
export const populateGlobalTwins: GlobalBeforeReadHook = ({ doc, req, global }) =>
  populate(req, doc, global.fields);

/** A twin as one write carries it: the original's key, the twin's, its kind, the value sent. */
export interface TwinValue {
  key: string;
  twinKey: string;
  kind: HeavyKind;
  value: unknown;
}

/** An upload's value as a write takes it: the id, or null. */
const uploadValue = (value: unknown): number | string | null => {
  if (typeof value === 'number' || (typeof value === 'string' && value !== '')) return value;
  if (isDoc(value)) return uploadValue(value['id']);
  return null;
};

/**
 * The twins a write carries: for every twin of the saved document (rows by id), the value the
 * request sent for it, an upload's as its id. A twin the request did not send (a REST write
 * of other fields, a script) is left out: never "blank the English" by omission.
 */
export function twinValues(shape: Shape, data: unknown, doc: unknown): TwinValue[] {
  const out: TwinValue[] = [];
  for (const { key, twinKey, kind } of twinsIn(shape, doc, '')) {
    const value = readKey(data, twinKey);
    if (value === undefined) continue;
    out.push({ key, twinKey, kind, value: kind === 'upload' ? uploadValue(value) : value });
  }
  return out;
}

/**
 * The twins as the response to a save shows them, so the form the admin rebuilds from it
 * carries the English and its base: an applied twin shows what was written, any other the
 * stored English read before the write (unchanged by it). Mutates `doc`; returns the twin
 * bases for the JSON.
 */
export function showTwins(
  doc: Doc,
  values: readonly TwinValue[],
  applied: ReadonlySet<string>,
  stored: unknown,
): PendingEntries {
  const bases: PendingEntries = {};
  for (const { key, twinKey, kind, value } of values) {
    const shown = applied.has(key) ? value : readKey(stored, key);
    const cloned = shown === undefined || shown === null ? null : structuredClone(shown);
    writeKey(doc, twinKey, cloned);
    bases[key] = { base: twinBase(kind, cloned) };
  }
  return bases;
}
