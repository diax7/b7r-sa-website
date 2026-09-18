import type { Field, NumberField, SelectField, TextareaField, TextField } from 'payload';

/**
 * Side-by-side bilingual editing (ADR-057). A localized light field (text, textarea, select,
 * number) is rendered by `BilingualField`: Payload's own field for the open locale beside an
 * input for the other one, outside a list and inside a row of an array or a blocks field
 * alike. The other language's edits wait in `translations`, a hidden non-localized JSON on
 * the same document, shaped `{ [otherLocale]: { [key]: { value, base } } }` where `base` is
 * what the other locale held when the editor started; the `afterChange` hook in
 * `hooks/translations.ts` applies them with a second write and clears the JSON. Payload 3
 * writes one locale per request, so the second write is the mechanism.
 *
 * A key is the field's path (`seo.title`), and through a list the row's id, never its index
 * (`hero.slides.<rowId>.headline`, `blocks.<rowId>.items.<itemId>.question`): the admin form
 * makes the id when a row is added, so a reorder keeps the entry with its row, a deleted
 * row's entry is dropped, and a duplicated row starts with an empty other language.
 */
export const TRANSLATIONS = 'translations';
export const BILINGUAL_FIELD = '@/modules/cms/admin/fields/bilingual/field#BilingualField';
const NO_DIFF = '@/modules/cms/admin/fields/bilingual/no-diff#NoDiff';

export interface TranslationEntry {
  value: string | null;
  base: string | null;
}
/** The pending edits of one language, keyed by the field's key (`seo.title`, `blocks.<id>.title`). */
export type TranslationEntries = Record<string, TranslationEntry>;
/** The hidden field's value: the pending edits per target locale. */
export type Translations = Record<string, TranslationEntries>;

type Doc = Record<string, unknown>;

type LightField = NumberField | SelectField | TextareaField | TextField;
const LIGHT_TYPES = new Set<Field['type']>(['text', 'textarea', 'select', 'number']);
const isLight = (field: Field): field is LightField => LIGHT_TYPES.has(field.type);

/**
 * Whether a field is edited in both languages at once: a localized light field (or one inside
 * a localized group) that holds one value, is shown, is editable, and has no widget of its
 * own. A `hasMany` text, select or number is a list and stays on the locale switch; a
 * read-only value is a line (`ReadOnlyLine`), never a twin.
 */
export function isBilingualField(field: Field, parentLocalized = false): boolean {
  if (!isLight(field) || !field.name) return false;
  if (!(field.localized === true || parentLocalized)) return false;
  if ('hasMany' in field && field.hasMany) return false;
  if (field.admin?.hidden || field.admin?.disabled || field.admin?.readOnly) return false;
  const widget = field.admin?.components?.Field;
  return widget === undefined || widget === BILINGUAL_FIELD;
}

/**
 * A document, or one row of a list, as the mechanism sees it: the localized fields by name
 * (`true` when bilingual: light and editable; a rich text, an upload, a localized group or
 * list as a whole read `false`), the named groups and tabs to descend into, and the shared
 * lists (a non-localized array or blocks field with a localized subfield somewhere in its
 * rows). Rows, collapsibles and unnamed groups are transparent.
 */
export interface Shape {
  localized: Record<string, boolean>;
  groups: Record<string, Shape>;
  lists: Record<string, ListShape>;
}
export interface ListShape {
  type: 'array' | 'blocks';
  /** The row's shape per block slug; an array's one shape under ''. */
  rows: Record<string, Shape>;
}

const emptyShape = (): Shape => ({ localized: {}, groups: {}, lists: {} });

const hasLocalized = (shape: Shape): boolean =>
  Object.keys(shape.localized).length > 0 ||
  Object.values(shape.groups).some(hasLocalized) ||
  Object.keys(shape.lists).length > 0;

/** The config walk behind `bilingualPaths`, the hook's allow-list and the row builder. */
export function shapeOf(fields: Field[], parentLocalized = false): Shape {
  const shape = emptyShape();
  collect(fields, shape, parentLocalized);
  return shape;
}

function collect(fields: Field[], shape: Shape, parentLocalized: boolean): void {
  for (const field of fields) {
    if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        const localized = parentLocalized || ('localized' in tab && tab.localized === true);
        if ('name' in tab && tab.name) shape.groups[tab.name] = shapeOf(tab.fields, localized);
        else collect(tab.fields, shape, parentLocalized);
      }
      continue;
    }
    if (
      field.type === 'row' ||
      field.type === 'collapsible' ||
      (field.type === 'group' && !('name' in field && field.name))
    ) {
      collect(field.fields, shape, parentLocalized);
      continue;
    }
    if (field.type === 'ui' || !('name' in field) || !field.name) continue;
    const localized = parentLocalized || field.localized === true;
    if (field.type === 'group') {
      shape.groups[field.name] = shapeOf(field.fields, localized);
    } else if (field.type === 'array' || field.type === 'blocks') {
      if (localized) shape.localized[field.name] = false;
      else {
        const list = listShape(field);
        if (list) shape.lists[field.name] = list;
      }
    } else if (localized) {
      shape.localized[field.name] = isBilingualField(field, parentLocalized);
    }
  }
}

function listShape(field: Field & { type: 'array' | 'blocks' }): ListShape | null {
  const rows: Record<string, Shape> = {};
  if (field.type === 'array') rows[''] = shapeOf(field.fields);
  else for (const block of field.blocks) rows[block.slug] = shapeOf(block.fields);
  return Object.values(rows).some(hasLocalized) ? { type: field.type, rows } : null;
}

/**
 * Every bilingual path of a config, in the path form the description maps use: names joined
 * by dots through named tabs, groups and arrays, a block's slug after the blocks field
 * (`blocks.cards.items.title`). The same list attaches the component (`describeFields`), and
 * `tests/admin-config.test.ts` counts it. Per shape: the leaves, then the groups, then the
 * lists, each in config order.
 */
export function bilingualPaths(fields: Field[]): string[] {
  return flatten(shapeOf(fields), '');
}

function flatten(shape: Shape, prefix: string): string[] {
  const out: string[] = [];
  for (const [name, bilingual] of Object.entries(shape.localized)) {
    if (bilingual) out.push(`${prefix}${name}`);
  }
  for (const [name, group] of Object.entries(shape.groups)) {
    out.push(...flatten(group, `${prefix}${name}.`));
  }
  for (const [name, list] of Object.entries(shape.lists)) {
    for (const [slug, row] of Object.entries(list.rows)) {
      out.push(...flatten(row, slug ? `${prefix}${name}.${slug}.` : `${prefix}${name}.`));
    }
  }
  return out;
}

/** How much pending text one document may hold: the largest form (the home page) needs a tenth. */
export const TRANSLATIONS_MAX_ENTRIES = 200;
export const TRANSLATIONS_MAX_BYTES = 64 * 1024;

const TOO_MUCH = {
  en: `Pending translations: at most ${TRANSLATIONS_MAX_ENTRIES} entries and 64 KB; save, then continue.`,
  ar: `الترجمات المعلّقة: ${TRANSLATIONS_MAX_ENTRIES} مدخل و64 كيلوبايت كحد أقصى؛ احفظ ثم تابع.`,
};

/** How many entries the JSON holds across every locale key, whatever their shape. */
function entryCount(value: unknown): number {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return 0;
  return Object.values(value as Record<string, unknown>).reduce<number>(
    (n, byLocale) =>
      n + (byLocale && typeof byLocale === 'object' ? Object.keys(byLocale).length : 0),
    0,
  );
}

/**
 * Why the JSON is refused, in both languages, or null: the row stores whatever a signed-in
 * user sends, so the bound is on the size, not the shape (the hook already ignores what is
 * not an entry on an allowed key).
 */
export function translationsProblem(value: unknown): { en: string; ar: string } | null {
  if (value === null || value === undefined) return null;
  if (entryCount(value) > TRANSLATIONS_MAX_ENTRIES) return TOO_MUCH;
  const bytes = new TextEncoder().encode(JSON.stringify(value)).length;
  return bytes > TRANSLATIONS_MAX_BYTES ? TOO_MUCH : null;
}

/**
 * The hidden JSON that carries the other language's edits between the form and the hook.
 * Hidden in the form (Payload still keeps it in the form state), out of the versions diff,
 * read by signed-in staff only (the site's Local API reads override access anyway, and an
 * outsider on the REST API has no business with an editor's pending text), and bounded in
 * size, with the reason in the panel's language.
 */
export function translationsField(): Field {
  return {
    name: TRANSLATIONS,
    type: 'json',
    access: { read: ({ req }) => Boolean(req.user) },
    admin: { hidden: true, components: { Diff: NO_DIFF } },
    validate: (value, { req }) => {
      const problem = translationsProblem(value);
      if (!problem) return true;
      return req?.i18n?.language === 'ar' ? problem.ar : problem.en;
    },
  };
}

/** A text value for comparison: an empty, null or missing value all read as ''; a number as its digits. */
export function textOf(value: unknown): string {
  if (typeof value === 'number') return String(value);
  return typeof value === 'string' ? value : '';
}

const isDoc = (value: unknown): value is Doc =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** An own key of a plain record: a crafted `constructor` or `toString` names nothing. */
const own = (record: object, key: string): boolean => Object.hasOwn(record, key);

/** The shape of a row by its block type (an array's one shape under ''), or undefined. */
function rowShapeOf(list: ListShape, row: Doc): Shape | undefined {
  const slug = list.type === 'blocks' ? String(row['blockType']) : '';
  return own(list.rows, slug) ? list.rows[slug] : undefined;
}

/** The row of a list with the given id, or undefined. */
function rowById(rows: unknown, id: string): Doc | undefined {
  if (!Array.isArray(rows)) return undefined;
  return rows.find((row): row is Doc => isDoc(row) && row['id'] === id);
}

/**
 * The value at a key of a document: a plain path (`seo.title`, `hero.slides`), or through a
 * list by the row's id (`hero.slides.<rowId>.headline`): a segment that meets an array is a
 * row id, never an index. Undefined when the path or the row is not there.
 */
export function readKey(doc: unknown, key: string): unknown {
  let node: unknown = doc;
  for (const segment of key.split('.')) {
    if (node === null || typeof node !== 'object') return undefined;
    node = Array.isArray(node) ? rowById(node, segment) : (node as Doc)[segment];
  }
  return node;
}

/**
 * The key of a field's index path (`hero.slides.0.headline`) with each row's index replaced
 * by the row's id from the form state (`hero.slides.<id>.headline`), or null while a row has
 * no id yet. A path without an index is its own key.
 */
export function keyOfPath(path: string, idAt: (rowPath: string) => unknown): string | null {
  const segments = path.split('.');
  const out: string[] = [];
  for (const [i, segment] of segments.entries()) {
    if (!/^\d+$/.test(segment)) {
      out.push(segment);
      continue;
    }
    const id = idAt(`${segments.slice(0, i + 1).join('.')}.id`);
    if (typeof id !== 'string' || id === '') return null;
    out.push(id);
  }
  return out.join('.');
}

/** `{ 'seo.title': 'x' }` as `{ seo: { title: 'x' } }`, the shape a write takes. */
export function nestPaths(values: Iterable<[string, unknown]>): Doc {
  const data: Doc = {};
  for (const [path, value] of values) {
    const keys = path.split('.');
    let node = data;
    for (const key of keys.slice(0, -1)) {
      const next = node[key];
      node = (next && typeof next === 'object' ? next : (node[key] = {})) as Doc;
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
  for (const [key, entry] of Object.entries(byLocale as Record<string, unknown>)) {
    if (!entry || typeof entry !== 'object') continue;
    const { value, base } = entry as Record<string, unknown>;
    if (isText(value) && isText(base)) out[key] = { value, base };
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
 * Where an entry key lands, checked against the config and the saved document: `list` is the
 * path of the outermost shared list the key runs through (`hero.slides`, sent whole in the
 * other locale), null for a scalar outside any list. Null for a key that names no bilingual
 * field (a slug, a rich text, a `blockType`, a made-up name), a block type the row does not
 * have, or a row whose id is not in the document (deleted, or made up): the rows written
 * are always the document's own.
 */
export function resolveKey(
  shape: Shape,
  doc: unknown,
  key: string,
): { list: string | null } | null {
  const segments = key.split('.');
  let current = shape;
  let node: unknown = doc;
  let list: string | null = null;
  let prefix = '';
  for (let i = 0; i < segments.length; i += 1) {
    const segment = segments[i]!;
    if (own(current.localized, segment)) {
      return i === segments.length - 1 && current.localized[segment] ? { list } : null;
    }
    if (own(current.groups, segment)) {
      current = current.groups[segment]!;
      node = isDoc(node) ? node[segment] : undefined;
      prefix = `${prefix}${segment}.`;
      continue;
    }
    const into = stepIntoList(current, node, segment, segments[i + 1]);
    if (!into) return null;
    list ??= `${prefix}${segment}`;
    current = into.shape;
    node = into.row;
    prefix = '';
    i += 1;
  }
  return null;
}

/** The row `id` of the list `segment` under `node`, with its shape; null when there is none. */
function stepIntoList(
  current: Shape,
  node: unknown,
  segment: string,
  id: string | undefined,
): { shape: Shape; row: Doc } | null {
  const nested = own(current.lists, segment) ? current.lists[segment] : undefined;
  if (!nested || id === undefined) return null;
  const row = rowById(isDoc(node) ? node[segment] : undefined, id);
  const shape = row && rowShapeOf(nested, row);
  return row && shape ? { shape, row } : null;
}

/** The shared list at a plain path of the shape (`hero.slides`), or undefined. */
export function listAt(shape: Shape, path: string): ListShape | undefined {
  const segments = path.split('.');
  let current: Shape | undefined = shape;
  for (const segment of segments.slice(0, -1)) {
    current = current && own(current.groups, segment) ? current.groups[segment] : undefined;
  }
  const last = segments[segments.length - 1]!;
  return current && own(current.lists, last) ? current.lists[last] : undefined;
}

/**
 * The rows of a shared list as the other locale's write sends them: for each row of `doc` by
 * id, the non-localized subfields from `doc` (`id`, `blockType`, a link, a number), the
 * localized ones from the stored row of the other locale matched by id (null for a row that
 * locale has no text for yet: a new row), the planned writes on top; nested lists the same,
 * inside their row. The saved locale's text is never copied into the other. A row of a block
 * type the config does not know is sent as it is.
 */
export function otherLocaleRows(
  list: ListShape,
  docRows: unknown,
  storedRows: unknown,
  writes: ReadonlyMap<string, string | null>,
  prefix: string,
): Doc[] {
  if (!Array.isArray(docRows)) return [];
  const out: Doc[] = [];
  for (const row of docRows) {
    if (!isDoc(row)) continue;
    const id = row['id'];
    const shape = rowShapeOf(list, row);
    if (!shape || typeof id !== 'string') {
      // A row whose block type the config no longer has: the stored English row by id, never
      // the Arabic one, so a removed block never carries Arabic text into English.
      out.push({ ...((typeof id === 'string' && rowById(storedRows, id)) || row) });
      continue;
    }
    out.push(
      otherLocaleNode(shape, row, rowById(storedRows, id) ?? null, writes, `${prefix}${id}.`),
    );
  }
  return out;
}

function otherLocaleNode(
  shape: Shape,
  docNode: Doc,
  storedNode: Doc | null,
  writes: ReadonlyMap<string, string | null>,
  prefix: string,
): Doc {
  const out: Doc = { ...docNode };
  for (const name of Object.keys(shape.localized)) {
    const key = `${prefix}${name}`;
    out[name] = writes.has(key) ? writes.get(key) : (storedNode?.[name] ?? null);
  }
  for (const [name, group] of Object.entries(shape.groups)) {
    const docGroup = docNode[name];
    if (!isDoc(docGroup)) continue;
    const storedGroup = storedNode?.[name];
    const stored = isDoc(storedGroup) ? storedGroup : null;
    out[name] = otherLocaleNode(group, docGroup, stored, writes, `${prefix}${name}.`);
  }
  for (const [name, nested] of Object.entries(shape.lists)) {
    if (!(name in docNode)) continue;
    out[name] = otherLocaleRows(
      nested,
      docNode[name],
      storedNode?.[name],
      writes,
      `${prefix}${name}.`,
    );
  }
  return out;
}

/**
 * The writes a save makes in the other locale, as `[path, value]` pairs for `nestPaths`: a
 * scalar entry that still applies is its own pair (an empty text as null, Payload's own
 * empty); an entry inside a shared list makes the whole list a pair, its rows built by
 * `otherLocaleRows` with every applying entry of that list on top. An entry on a key the
 * config or the document does not resolve is ignored.
 */
export function plannedWrites(
  entries: TranslationEntries,
  shape: Shape,
  doc: unknown,
  stored: unknown,
): Array<[string, unknown]> {
  const scalars: Array<[string, unknown]> = [];
  const rowWrites = new Map<string, string | null>();
  const lists: string[] = [];
  for (const [key, entry] of Object.entries(entries)) {
    const where = resolveKey(shape, doc, key);
    if (!where || !stillApplies(entry, readKey(stored, key))) continue;
    const value = textOf(entry.value) === '' ? null : entry.value;
    if (where.list === null) scalars.push([key, value]);
    else {
      rowWrites.set(key, value);
      if (!lists.includes(where.list)) lists.push(where.list);
    }
  }
  const whole = lists.map((path): [string, unknown] => {
    const list = listAt(shape, path)!;
    const rows = otherLocaleRows(
      list,
      readKey(doc, path),
      readKey(stored, path),
      rowWrites,
      `${path}.`,
    );
    return [path, rows];
  });
  return [...scalars, ...whole];
}

/**
 * The entries worth keeping after the other locale is read again (on open, after every save):
 * the ones the editor changed and that still apply. An applied entry (the stored value is
 * now the typed one) and a stale one (someone else wrote there) both drop; an entry of a row
 * the other locale has not seen yet (added since) stays, its base null.
 */
export function reconcile(
  entries: TranslationEntries,
  storedAt: (key: string) => unknown,
): TranslationEntries {
  const kept: TranslationEntries = {};
  for (const [key, entry] of Object.entries(entries)) {
    if (stillApplies(entry, storedAt(key))) kept[key] = entry;
  }
  return kept;
}
