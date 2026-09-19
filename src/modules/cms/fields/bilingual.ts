import type {
  Field,
  NumberField,
  PayloadRequest,
  RichTextField,
  SelectField,
  TextareaField,
  TextField,
  UploadField,
} from 'payload';

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
 * A localized heavy field (rich text, upload) gets a real sibling twin instead (`twinField`,
 * PR B of the plan): `<name>Twin`, non-localized, rendered by Payload's own component right
 * under the original. The twin holds the English only between the read that fills it
 * (`fields/twins.ts`) and the save that applies it; at rest it is null. Its entry in the JSON
 * carries the base alone (`{ base }`: a hash of the English rich text, an upload's id), the
 * value being the twin field itself.
 *
 * A key is the field's path (`seo.title`), and through a list the row's id, never its index
 * (`hero.slides.<rowId>.headline`, `blocks.<rowId>.items.<itemId>.question`): the admin form
 * makes the id when a row is added, so a reorder keeps the entry with its row, a deleted
 * row's entry is dropped, and a duplicated row starts with an empty other language.
 */
export const TRANSLATIONS = 'translations';
export const BILINGUAL_FIELD = '@/modules/cms/admin/fields/bilingual/field#BilingualField';
const NO_DIFF = '@/modules/cms/admin/fields/bilingual/no-diff#NoDiff';

/** The re-entry flag: a read or write the mechanism makes for itself carries it in `req.context`. */
export const SKIP_TRANSLATIONS = 'skipTranslations';

/** A light field's pending edit: what the editor typed and what the other locale held. */
export interface TranslationEntry {
  value: string | null;
  base: string | null;
}
/** A twin's entry: the base alone; the value is the twin field (`fields/twins.ts`). */
export interface TwinBase {
  base: string | null;
}
/** The light entries of one language, keyed by the field's key (`seo.title`, `blocks.<id>.title`). */
export type TranslationEntries = Record<string, TranslationEntry>;
/** One language's branch of the JSON as stored: light entries and twin bases side by side. */
export type PendingEntries = Record<string, TranslationEntry | TwinBase>;
/** The hidden field's value: the pending edits per target locale. */
export type Translations = Record<string, PendingEntries>;

type Doc = Record<string, unknown>;

type LightField = NumberField | SelectField | TextareaField | TextField;
const LIGHT_TYPES = new Set<Field['type']>(['text', 'textarea', 'select', 'number']);
const isLight = (field: Field): field is LightField => LIGHT_TYPES.has(field.type);

export type HeavyKind = 'richText' | 'upload';
type HeavyField = RichTextField | UploadField;
const isHeavy = (field: Field | undefined): field is HeavyField =>
  field !== undefined && (field.type === 'richText' || field.type === 'upload');

/** An autosave (`?autosave=true`; Payload parses the flag to a boolean on collections). */
export function isAutosave(req: PayloadRequest): boolean {
  const autosave = req.query?.['autosave'];
  return autosave === true || autosave === 'true';
}

/** The locale being saved or read and the other one; null when the config has no other. */
export function localePair(
  req: PayloadRequest,
): { current: string; other: string; isDefault: boolean } | null {
  const localization = req.payload.config.localization;
  if (!localization) return null;
  const current = typeof req.locale === 'string' ? req.locale : localization.defaultLocale;
  const others = localization.localeCodes.filter((code) => code !== current);
  if (others.length !== 1 || !others[0]) return null;
  return { current, other: others[0], isDefault: current === localization.defaultLocale };
}

/** The name of a heavy field's twin: `content` becomes `contentTwin`. */
export const twinName = (name: string): string => `${name}Twin`;

/** The class the twin's wrapper carries; `admin.css` draws its pill and turns the text LTR. */
export const TWIN_CLASS = 'admin-twin';

const TWIN_LABEL = {
  richText: { ar: 'النص بالإنجليزية', en: 'English text' },
  upload: { ar: 'الصورة بالإنجليزية', en: 'English photo' },
};
const TWIN_DESCRIPTION = {
  richText: {
    ar: 'ما يعرضه الموقع الإنجليزي هنا؛ حفظ واحد يكتب اللغتين.',
    en: 'What the English site shows here; one Save writes both languages.',
  },
  upload: {
    ar: 'ما يعرضه الموقع الإنجليزي هنا، من المكتبة؛ حفظ واحد يكتب اللغتين.',
    en: 'What the English site shows here, from the library; one Save writes both languages.',
  },
};

/** The feature keys of a rich-text editor, provider (the config) or sanitized adapter alike. */
function editorFeatures(editor: unknown): string | null {
  const features = (editor as { features?: unknown } | undefined)?.features;
  if (!Array.isArray(features)) return null;
  return features.map((f: { key?: unknown }) => String(f?.key ?? '')).join(',');
}

/**
 * Whether two rich-text editors are the same: the one provider in the config, or two
 * sanitized adapters made from it (Payload turns `lexicalEditor()` into one adapter per
 * field) with the same features.
 */
function sameEditor(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  const keys = editorFeatures(a);
  return keys !== null && keys === editorFeatures(b);
}

/**
 * Whether `candidate` is the twin of `original`: the twin's name, the same type, not
 * localized, and the same editor (rich text) or collection (upload), so the two render and
 * validate alike. The census in `tests/admin-config.test.ts` counts a localized heavy field as
 * covered when its twin follows it in the same field list; the hooks ask the same of the
 * sanitized config at run time.
 */
export function isTwinOf(candidate: Field | undefined, original: Field): boolean {
  if (!isHeavy(candidate) || !isHeavy(original) || !original.name) return false;
  if (candidate.name !== twinName(original.name) || candidate.localized === true) return false;
  if (candidate.type !== original.type) return false;
  if (candidate.type === 'richText' && original.type === 'richText') {
    return sameEditor(candidate.editor, original.editor);
  }
  if (candidate.type === 'upload' && original.type === 'upload') {
    return candidate.relationTo === original.relationTo;
  }
  return false;
}

/**
 * The twin of a localized rich text or upload: `<name>Twin`, non-localized, the same editor
 * or collection, labelled as the English, rendered by Payload's own component under the
 * original (place it right after the original in the config). Read by signed-in staff only
 * and out of the versions diff, like the JSON. It holds a value only between an admin read
 * (`populateTwins` fills it) and the save that applies it: a Save or Publish stores null and
 * the `afterChange` hook reads what was typed from the request; an autosave keeps it, so a
 * draft carries the pending English across a reload.
 */
export function twinField(original: HeavyField): Field {
  if (!original.name || original.localized !== true) {
    throw new Error(
      `twinField: "${String(original.name)}" must be a localized rich text or upload`,
    );
  }
  const shared = {
    name: twinName(original.name),
    localized: false,
    required: false,
    access: { read: ({ req }: { req: PayloadRequest }) => Boolean(req.user) },
    hooks: {
      beforeChange: [
        ({ req, value }: { req: PayloadRequest; value?: unknown }) =>
          isAutosave(req) ? value : null,
      ],
    },
  };
  if (original.type === 'richText') {
    return {
      ...shared,
      type: 'richText',
      editor: original.editor,
      label: TWIN_LABEL.richText,
      admin: {
        className: TWIN_CLASS,
        description: TWIN_DESCRIPTION.richText,
        components: { Diff: NO_DIFF },
      },
    } as Field;
  }
  return {
    ...shared,
    type: 'upload',
    relationTo: original.relationTo,
    label: TWIN_LABEL.upload,
    admin: {
      className: TWIN_CLASS,
      description: TWIN_DESCRIPTION.upload,
      components: { Diff: NO_DIFF },
    },
  } as Field;
}

/**
 * Whether a field is edited in both languages at once: a localized light field (or one inside
 * a localized group) that holds one value, is shown, is editable, and has no widget of its
 * own. A `hasMany` text, select or number is a list and has no pair (none exists in the
 * configs; the census in `tests/admin-config.test.ts` would name one); a read-only value is
 * a line (`ReadOnlyLine`, which shows both languages of a localized one), never a twin.
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
 * list as a whole read `false`), the heavy fields whose twin follows them (by kind), the
 * named groups and tabs to descend into, and the shared lists (a non-localized array or
 * blocks field with a localized subfield somewhere in its rows). Rows, collapsibles and
 * unnamed groups are transparent.
 */
export interface Shape {
  localized: Record<string, boolean>;
  twins: Record<string, HeavyKind>;
  groups: Record<string, Shape>;
  lists: Record<string, ListShape>;
}
export interface ListShape {
  type: 'array' | 'blocks';
  /** The row's shape per block slug; an array's one shape under ''. */
  rows: Record<string, Shape>;
}

const emptyShape = (): Shape => ({ localized: {}, twins: {}, groups: {}, lists: {} });

const hasLocalized = (shape: Shape): boolean =>
  Object.keys(shape.localized).length > 0 ||
  Object.values(shape.groups).some(hasLocalized) ||
  Object.keys(shape.lists).length > 0;

/** Whether a shape has a twin anywhere: the population and the apply skip a config without one. */
export const hasTwins = (shape: Shape): boolean =>
  Object.keys(shape.twins).length > 0 ||
  Object.values(shape.groups).some(hasTwins) ||
  Object.values(shape.lists).some((list) => Object.values(list.rows).some(hasTwins));

/**
 * The walk of a config's top-level fields, once per field list: the hooks ask for it on every
 * read and every save and a config's field array never changes after boot. Nothing writes to
 * a shape.
 */
const shapes = new WeakMap<Field[], Shape>();

/** The config walk behind `bilingualPaths`, the hook's allow-list and the row builder. */
export function shapeOf(fields: Field[], parentLocalized = false): Shape {
  if (!parentLocalized) {
    const known = shapes.get(fields);
    if (known) return known;
  }
  const shape = emptyShape();
  collect(fields, shape, parentLocalized);
  if (!parentLocalized) shapes.set(fields, shape);
  return shape;
}

function collect(fields: Field[], shape: Shape, parentLocalized: boolean): void {
  for (const [i, field] of fields.entries()) {
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
      // A heavy field's twin must follow it in the same list; under a localized parent the
      // whole group is per language and no twin pairs with it.
      if (isHeavy(field) && !parentLocalized && isTwinOf(fields[i + 1], field)) {
        shape.twins[field.name] = field.type;
      }
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
  return flatten(shapeOf(fields), '', (shape) =>
    Object.entries(shape.localized)
      .filter(([, bilingual]) => bilingual)
      .map(([name]) => name),
  );
}

/** Every localized heavy field of a config that has its twin, in the same path form. */
export function twinPaths(fields: Field[]): string[] {
  return flatten(shapeOf(fields), '', (shape) => Object.keys(shape.twins));
}

function flatten(shape: Shape, prefix: string, leaves: (shape: Shape) => string[]): string[] {
  const out: string[] = leaves(shape).map((name) => `${prefix}${name}`);
  for (const [name, group] of Object.entries(shape.groups)) {
    out.push(...flatten(group, `${prefix}${name}.`, leaves));
  }
  for (const [name, list] of Object.entries(shape.lists)) {
    for (const [slug, row] of Object.entries(list.rows)) {
      const at = slug ? `${prefix}${name}.${slug}.` : `${prefix}${name}.`;
      out.push(...flatten(row, at, leaves));
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

export const isDoc = (value: unknown): value is Doc =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** An own key of a plain record: a crafted `constructor` or `toString` names nothing. */
const own = (record: object, key: string): boolean => Object.hasOwn(record, key);

/** The shape of a row by its block type (an array's one shape under ''), or undefined. */
export function rowShapeOf(list: ListShape, row: Doc): Shape | undefined {
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
 * Sets the value at a key of a document in place, the same walk as `readKey` (a segment that
 * meets an array is a row id). Nothing happens when the path or the row is not there: a
 * parent is never created.
 */
export function writeKey(doc: unknown, key: string, value: unknown): void {
  const segments = key.split('.');
  const last = segments.pop();
  const parent = segments.length > 0 ? readKey(doc, segments.join('.')) : doc;
  if (last && isDoc(parent)) parent[last] = value;
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

/** One locale's branch of the JSON as stored, or an empty one. */
export function pendingOf(translations: unknown, locale: string): PendingEntries {
  const byLocale = (translations as Record<string, unknown> | null | undefined)?.[locale];
  return byLocale && typeof byLocale === 'object' && !Array.isArray(byLocale)
    ? (byLocale as PendingEntries)
    : {};
}

/** A light field's pending edit, as opposed to a twin's base (which carries no `value`). */
export const isLightEntry = (entry: unknown): entry is TranslationEntry =>
  typeof entry === 'object' &&
  entry !== null &&
  'value' in entry &&
  isText((entry as TranslationEntry).value) &&
  isText((entry as TranslationEntry).base);

/** A twin's base entry: a `base` and no `value`. */
export const isTwinBase = (entry: unknown): entry is TwinBase =>
  typeof entry === 'object' &&
  entry !== null &&
  !('value' in entry) &&
  isText((entry as TwinBase).base);

/** The light entries of one locale, with anything that is not one dropped (a twin's base too). */
export function entriesOf(translations: unknown, locale: string): TranslationEntries {
  const out: TranslationEntries = {};
  for (const [key, entry] of Object.entries(pendingOf(translations, locale))) {
    if (isLightEntry(entry)) out[key] = { value: entry.value, base: entry.base };
  }
  return out;
}

/** A twin's base as the JSON holds it for a key, or null (no English seen, or no entry). */
export function twinBaseOf(translations: unknown, locale: string, key: string): string | null {
  const pending = pendingOf(translations, locale);
  const entry = own(pending, key) ? pending[key] : undefined;
  const base = entry && typeof entry === 'object' ? (entry as TwinBase).base : null;
  return typeof base === 'string' ? base : null;
}

/**
 * Whether an entry still applies against what the other locale holds now: the editor changed
 * it (`value` differs from `base`) and nobody changed it meanwhile (`base` still equals the
 * stored value). A stale entry loses nothing: the stored edit wins and the entry is dropped.
 */
export function stillApplies(entry: TranslationEntry, stored: unknown): boolean {
  return textOf(entry.value) !== textOf(entry.base) && textOf(entry.base) === textOf(stored);
}

/** Where a key lands: the outermost shared list it runs through (or null), and the field's kind. */
export interface Resolved {
  list: string | null;
  kind: 'light' | HeavyKind;
}

/**
 * Where an entry key lands, checked against the config and the saved document: `list` is the
 * path of the outermost shared list the key runs through (`hero.slides`, sent whole in the
 * other locale), null for a scalar outside any list; `kind` says whether the key names a
 * light field (a JSON entry) or a heavy one with a twin. Null for a key that names neither
 * (a slug, a rich text without a twin, a `blockType`, a made-up name), a block type the row
 * does not have, or a row whose id is not in the document (deleted, or made up): the rows
 * written are always the document's own.
 */
export function resolveKey(shape: Shape, doc: unknown, key: string): Resolved | null {
  const segments = key.split('.');
  let current = shape;
  let node: unknown = doc;
  let list: string | null = null;
  let prefix = '';
  for (let i = 0; i < segments.length; i += 1) {
    const segment = segments[i]!;
    if (own(current.localized, segment)) {
      if (i !== segments.length - 1) return null;
      if (current.localized[segment]) return { list, kind: 'light' };
      const kind = own(current.twins, segment) ? current.twins[segment] : undefined;
      return kind ? { list, kind } : null;
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
  writes: ReadonlyMap<string, unknown>,
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
  writes: ReadonlyMap<string, unknown>,
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

/** A twin's write that passed the base check (`fields/twins.ts`): the original's key, the value. */
export interface TwinWrite {
  key: string;
  value: unknown;
}

/**
 * The writes a save makes in the other locale, as `[path, value]` pairs for `nestPaths`: a
 * scalar entry that still applies is its own pair (an empty text as null, Payload's own
 * empty); an entry inside a shared list makes the whole list a pair, its rows built by
 * `otherLocaleRows` with every applying entry of that list on top. A twin's write (checked
 * against its base by the caller) lands on the original's key the same way. An entry on a
 * key the config or the document does not resolve is ignored, and so is a light entry on a
 * heavy key or a twin on a light one.
 */
export function plannedWrites(
  entries: TranslationEntries,
  shape: Shape,
  doc: unknown,
  stored: unknown,
  twins: readonly TwinWrite[] = [],
): Array<[string, unknown]> {
  const scalars: Array<[string, unknown]> = [];
  const rowWrites = new Map<string, unknown>();
  const lists: string[] = [];
  const place = (key: string, value: unknown, list: string | null) => {
    if (list === null) scalars.push([key, value]);
    else {
      rowWrites.set(key, value);
      if (!lists.includes(list)) lists.push(list);
    }
  };
  for (const [key, entry] of Object.entries(entries)) {
    const where = resolveKey(shape, doc, key);
    if (where?.kind !== 'light' || !stillApplies(entry, readKey(stored, key))) continue;
    place(key, textOf(entry.value) === '' ? null : entry.value, where.list);
  }
  for (const { key, value } of twins) {
    const where = resolveKey(shape, doc, key);
    if (where && where.kind !== 'light') place(key, value, where.list);
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
 * the other locale has not seen yet (added since) stays, its base null. A twin's base rides
 * untouched: the server sets and checks it, the client never reads it.
 */
export function reconcile(
  entries: PendingEntries,
  storedAt: (key: string) => unknown,
): PendingEntries {
  const kept: PendingEntries = {};
  for (const [key, entry] of Object.entries(entries)) {
    if (isTwinBase(entry) || (isLightEntry(entry) && stillApplies(entry, storedAt(key)))) {
      kept[key] = entry;
    }
  }
  return kept;
}
