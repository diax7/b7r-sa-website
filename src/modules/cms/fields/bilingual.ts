import type { Field } from 'payload';

/**
 * Side-by-side bilingual editing (ADR-057). A localized text, textarea or select field is
 * rendered by `BilingualField`: Payload's own field for the open locale beside an input for
 * the other one. The other language's edits wait in `translations`, a hidden non-localized
 * JSON on the same document, shaped `{ [otherLocale]: { [fieldPath]: { value, base } } }`
 * where `base` is what the other locale held when the editor started; the `afterChange`
 * hook in `hooks/translations.ts` applies them with a second write and clears the JSON.
 * Payload 3 writes one locale per request, so the second write is the mechanism.
 */
export const TRANSLATIONS = 'translations';
export const BILINGUAL_FIELD = '@/modules/cms/admin/fields/bilingual/field#BilingualField';
const NO_DIFF = '@/modules/cms/admin/fields/bilingual/no-diff#NoDiff';

export interface TranslationEntry {
  value: string | null;
  base: string | null;
}
/** The pending edits of one language, keyed by the field's path (`seo.title`). */
export type TranslationEntries = Record<string, TranslationEntry>;
/** The hidden field's value: the pending edits per target locale. */
export type Translations = Record<string, TranslationEntries>;

/**
 * Whether a field is edited in both languages at once: a localized text, textarea or select
 * (or one inside a localized group) that holds one value, is shown, and has no widget of its
 * own. A `hasMany` text or select is a list and stays on the locale switch.
 */
export function isBilingualField(field: Field, parentLocalized = false): boolean {
  if (field.type !== 'text' && field.type !== 'textarea' && field.type !== 'select') return false;
  if (!field.name || !(field.localized === true || parentLocalized)) return false;
  if ('hasMany' in field && field.hasMany) return false;
  if (field.admin?.hidden || field.admin?.disabled) return false;
  const widget = field.admin?.components?.Field;
  return widget === undefined || widget === BILINGUAL_FIELD;
}

/**
 * Every bilingual path of a config, in the path form the description maps use: names joined
 * by dots through named tabs and groups; rows, collapsibles and unnamed groups are
 * transparent. Nothing under an array or a blocks field: their rows are per language on
 * the locale switch. The same list attaches the component (`describeFields`) and allow-lists
 * what the hook may write, so the client can never name a path outside it.
 */
export function bilingualPaths(fields: Field[], path = '', parentLocalized = false): string[] {
  const out: string[] = [];
  for (const field of fields) {
    if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        const named = 'name' in tab && tab.name;
        const tabLocalized = parentLocalized || ('localized' in tab && tab.localized === true);
        out.push(...bilingualPaths(tab.fields, named ? `${path}${tab.name}.` : path, tabLocalized));
      }
      continue;
    }
    if (
      field.type === 'row' ||
      field.type === 'collapsible' ||
      (field.type === 'group' && !('name' in field && field.name))
    ) {
      out.push(...bilingualPaths(field.fields, path, parentLocalized));
      continue;
    }
    if (!('name' in field) || !field.name) continue;
    const name = `${path}${field.name}`;
    if (isBilingualField(field, parentLocalized)) out.push(name);
    else if (field.type === 'group') {
      out.push(
        ...bilingualPaths(field.fields, `${name}.`, parentLocalized || field.localized === true),
      );
    }
  }
  return out;
}

/**
 * The hidden JSON that carries the other language's edits between the form and the hook.
 * Hidden in the form (Payload still keeps it in the form state), out of the versions diff,
 * and read by signed-in staff only: the site's Local API reads override access anyway, and an
 * outsider on the REST API has no business with an editor's pending text.
 */
export function translationsField(): Field {
  return {
    name: TRANSLATIONS,
    type: 'json',
    access: { read: ({ req }) => Boolean(req.user) },
    admin: { hidden: true, components: { Diff: NO_DIFF } },
  };
}

/** A text value for comparison: an empty, null or missing value all read as ''. */
export function textOf(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/** The value at a dotted path of a document, or undefined. */
export function readPath(doc: unknown, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>(
      (node, key) => (node as Record<string, unknown> | null | undefined)?.[key],
      doc,
    );
}

/** `{ 'seo.title': 'x' }` as `{ seo: { title: 'x' } }`, the shape a write takes. */
export function nestPaths(values: Iterable<[string, unknown]>): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const [path, value] of values) {
    const keys = path.split('.');
    let node = data;
    for (const key of keys.slice(0, -1)) {
      const next = node[key];
      node = (next && typeof next === 'object' ? next : (node[key] = {})) as Record<
        string,
        unknown
      >;
    }
    node[keys[keys.length - 1]!] = value;
  }
  return data;
}

const isText = (v: unknown): v is string | null => v === null || typeof v === 'string';

/** The pending entries of one locale, with anything that is not an entry dropped. */
export function entriesOf(translations: unknown, locale: string): TranslationEntries {
  const byLocale = (translations as Record<string, unknown> | null | undefined)?.[locale];
  if (!byLocale || typeof byLocale !== 'object') return {};
  const out: TranslationEntries = {};
  for (const [path, entry] of Object.entries(byLocale as Record<string, unknown>)) {
    if (!entry || typeof entry !== 'object') continue;
    const { value, base } = entry as Record<string, unknown>;
    if (isText(value) && isText(base)) out[path] = { value, base };
  }
  return out;
}

/**
 * Whether an entry still applies against what the other locale holds now: the editor changed
 * it (`value` differs from `base`) and nobody changed it meanwhile (`base` still equals the
 * stored value). A stale entry loses nothing: the stored edit wins and the entry is dropped.
 */
export function stillApplies(entry: TranslationEntry, stored: unknown): boolean {
  return textOf(entry.value) !== textOf(entry.base) && textOf(entry.base) === textOf(stored);
}

/**
 * The writes a save makes in the other locale: the entries on allowed paths that still apply.
 * An empty text is written as null (Payload's own empty for a text field).
 */
export function plannedWrites(
  entries: TranslationEntries,
  allowed: ReadonlySet<string>,
  storedAt: (path: string) => unknown,
): Array<[string, string | null]> {
  const writes: Array<[string, string | null]> = [];
  for (const [path, entry] of Object.entries(entries)) {
    if (!allowed.has(path) || !stillApplies(entry, storedAt(path))) continue;
    writes.push([path, textOf(entry.value) === '' ? null : entry.value]);
  }
  return writes;
}

/**
 * The entries worth keeping after the other locale is read again (on open, after every save):
 * the ones the editor changed and that still apply. An applied entry (the stored value is
 * now the typed one) and a stale one (someone else wrote there) both drop.
 */
export function reconcile(
  entries: TranslationEntries,
  storedAt: (path: string) => unknown,
): TranslationEntries {
  const kept: TranslationEntries = {};
  for (const [path, entry] of Object.entries(entries)) {
    if (stillApplies(entry, storedAt(path))) kept[path] = entry;
  }
  return kept;
}
