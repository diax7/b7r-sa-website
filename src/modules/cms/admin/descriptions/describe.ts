import type { Field, Tab } from 'payload';
import { sectionIconKeyOf, sectionIconOf } from '@/modules/cms/admin/icons';
import {
  BILINGUAL_FIELD,
  bilingualPaths,
  TRANSLATIONS,
  translationsField,
  twinPaths,
} from '@/modules/cms/fields/bilingual';

/** What a field does on the site, in both languages, keyed by the field's path. */
export type Described = Record<string, { ar: string; en: string }>;

/**
 * The list cell for every checkbox (design system: green yes, red no). `describeFields` sets
 * it beside the descriptions: the one pass every collection's fields go through.
 */
export const BOOL_CELL = '@/modules/cms/admin/fields/bool-cell#BoolCell';

/**
 * The widgets that draw a section's icon (ADR-060): the `ui` field placed after every tabs
 * field, which draws one icon into each tab button and gives the active bar the group's hue
 * (`IconTabs`), and the label of a collapsible or a labelled group with the icon before the
 * words (`SectionLabel`, attached where the config names one through `sectionIcon()`).
 */
export const ICON_TABS = '@/modules/cms/admin/fields/icon-tabs#IconTabs';
export const SECTION_LABEL = '@/modules/cms/admin/fields/section-label#SectionLabel';

/**
 * The field and the list cell for every read-only JSON field (admin audit 2026-09-18, 2.1):
 * Payload's JSON editor loads Monaco from a CDN the admin CSP refuses, so a log row's JSON
 * rendered empty. A read-only value needs no editor; it needs to be read.
 */
export const JSON_VIEW_FIELD = '@/modules/cms/admin/fields/json-view#JsonView';
export const JSON_VIEW_CELL = '@/modules/cms/admin/fields/json-view#JsonViewCell';

/**
 * The field for every read-only scalar (admin audit 2026-09-18, 2.11, 2.12): a value an
 * editor cannot change reads as one line of text, never as a disabled control.
 */
export const READ_ONLY_LINE = '@/modules/cms/admin/fields/read-only-line#ReadOnlyLine';

const SCALAR_TYPES = new Set<Field['type']>([
  'text',
  'textarea',
  'email',
  'number',
  'date',
  'checkbox',
  'select',
  'radio',
]);

interface Pass {
  map: Described;
  applied: Set<string> | undefined;
  /** The paths edited in both languages at once (ADR-057), from `bilingualPaths`. */
  bilingual: ReadonlySet<string>;
  /** The heavy paths whose twin follows them (PR B), from `twinPaths`. */
  twins: ReadonlySet<string>;
}

/** The admin block of a field as the steps below read it, whatever the field's type. */
type AdminLike = {
  readOnly?: boolean;
  hidden?: boolean;
  description?: unknown;
  components?: { Field?: unknown; Cell?: unknown };
};

const adminOf = (field: Field): AdminLike => (field.admin ?? {}) as AdminLike;
const readOnlyShown = (field: Field): boolean => {
  const admin = adminOf(field);
  return admin.readOnly === true && !admin.hidden;
};

/**
 * Sets `admin.description` on every field the map names (ADR-046): the path is the field's
 * names joined by dots, through named tabs, groups and arrays, with a block's slug after the
 * blocks field (`blocks.cards.items.title`); rows, collapsibles and unnamed groups are
 * transparent, `ui` fields are not fields. A field that already carries a description keeps
 * it unless the map names it, in which case the config is refused (the inline sentence
 * would never show and drift). `applied` collects the keys used, so
 * `tests/admin-config.test.ts` can refuse a key that names nothing.
 *
 * The same pass, per field and in this order: the description, the collision refusal, the
 * checkbox's list badge, the read-only JSON's block and cell, the read-only scalar's line,
 * then `BilingualField` (ADR-057) on every localized text, textarea, select and number that
 * has no widget by then (a read-only localized text is a line, never a twin), inside the
 * rows of arrays and blocks too; such a list's description ends with what duplicating a
 * row does to the other language. A localized rich text or upload is not touched: its
 * English is the sibling `twinField` the config places after it, rendered by Payload's own
 * component (the census in `tests/admin-config.test.ts` counts it). When a config has any
 * bilingual field the hidden `translations` JSON the hook reads is appended once; the
 * config's `afterChange` must then list `applyTranslations` (the config test checks).
 * The section icons (ADR-060) ride the same pass: every `tabs` field is followed by the
 * `ui` field that draws its tabs' icons, and a collapsible or a group that names an icon
 * gets `SectionLabel`.
 */
export function describeFields(fields: Field[], map: Described, applied?: Set<string>): Field[] {
  const bilingual = new Set(bilingualPaths(fields));
  const twins = new Set(twinPaths(fields));
  const described = walk(fields, { map, applied, bilingual, twins }, '');
  const carried = described.some((f) => 'name' in f && f.name === TRANSLATIONS);
  return bilingual.size > 0 && !carried ? [...described, translationsField()] : described;
}

/** A tabs field comes out followed by the `ui` field that draws its tabs' icons (ADR-060). */
function walk(fields: Field[], pass: Pass, path: string): Field[] {
  return fields.flatMap((field): Field[] => {
    if (field.type === 'tabs') {
      const tabs = field.tabs.map((tab): Tab => ({
        ...tab,
        fields: walk(tab.fields, pass, 'name' in tab && tab.name ? `${path}${tab.name}.` : path),
      })) as typeof field.tabs;
      return [{ ...field, tabs }, iconStrip(field.tabs)];
    }
    return [walkOne(field, pass, path)];
  });
}

function walkOne(field: Field, pass: Pass, path: string): Field {
  if (field.type === 'ui') return field;
  if (
    field.type === 'row' ||
    field.type === 'collapsible' ||
    (field.type === 'group' && !('name' in field && field.name))
  ) {
    return withSectionLabel({ ...field, fields: walk(field.fields, pass, path) } as Field);
  }
  if (!('name' in field) || !field.name) return field;
  return named(field, pass, `${path}${field.name}`);
}

/** The name of the `ui` field that follows a tabs field; `tests/admin-config.test.ts` reads it. */
export const ICON_STRIP = 'tabIcons';

/**
 * The `ui` field placed right after a tabs field: it carries the tabs' icon keys in order
 * (`null` where a tab names none) and renders `IconTabs`, which draws them into Payload's
 * tab buttons. A `ui` field, because Payload 3.89 never renders a custom `Field` on a
 * `tabs` field itself; it stores nothing, lists nothing and is not bulk-edited.
 */
function iconStrip(tabs: Tab[]): Field {
  const icons = tabs.map((tab) => sectionIconKeyOf(tab.admin));
  return {
    name: ICON_STRIP,
    type: 'ui',
    admin: {
      disableListColumn: true,
      disableBulkEdit: true,
      custom: { icons },
      components: { Field: ICON_TABS },
    },
  };
}

function named(field: Field & { name: string }, pass: Pass, name: string): Field {
  let next: Field = withSectionLabel(withDescription(field, pass, name));
  // A checkbox in a list reads as a coloured badge, never Payload's `true` / `false` pill.
  if (next.type === 'checkbox' && !adminOf(next).components?.Cell) {
    next = withComponent(next, 'Cell', BOOL_CELL);
  }
  next = withJsonView(next);
  next = withReadOnlyLine(next);
  if (pass.bilingual.has(name) && !adminOf(next).components?.Field) {
    next = withComponent(next, 'Field', BILINGUAL_FIELD);
  }
  if ((next.type === 'array' || next.type === 'blocks') && rowsUnder(pass.bilingual, name)) {
    next = withSharedRowsNote(next, rowsUnder(pass.twins, name));
  }
  if ('fields' in next && Array.isArray(next.fields)) {
    next = { ...next, fields: walk(next.fields, pass, `${name}.`) } as Field;
  }
  if (next.type === 'blocks') {
    next = {
      ...next,
      blocks: next.blocks.map((block) => ({
        ...block,
        fields: walk(block.fields, pass, `${name}.${block.slug}.`),
      })),
    };
  }
  return next;
}

/**
 * What duplicating a row does in a list whose rows are edited in both languages (ADR-057,
 * PR A): the form copies the Arabic with a new row id, so the English of the copy starts
 * empty (implied: "only"). One clause, said on the list after its own sentence; the cap in
 * `tests/admin-config.test.ts` measures the rendered text with this clause as the allowance.
 */
export const SHARED_ROWS_NOTE = {
  ar: 'تكرار الصف ينسخ العربية فقط.',
  en: 'A duplicated row copies the Arabic only.',
};

/**
 * The same for a list whose rows also hold a heavy twin (PR B): the English rich text or
 * photo under a field is a real field of the row, so the copy keeps it.
 */
export const SHARED_ROWS_WITH_TWINS_NOTE = {
  ar: 'تكرار الصف ينسخ العربية والنص أو الصورة الإنجليزية.',
  en: 'A duplicated row copies the Arabic and the English text or photo.',
};

const rowsUnder = (paths: ReadonlySet<string>, name: string): boolean =>
  [...paths].some((path) => path.startsWith(`${name}.`));

function withSharedRowsNote(field: Field, withTwins: boolean): Field {
  const own = adminOf(field).description as { ar?: unknown; en?: unknown } | undefined;
  if (own !== undefined && (typeof own.ar !== 'string' || typeof own.en !== 'string')) {
    return field;
  }
  const note = withTwins ? SHARED_ROWS_WITH_TWINS_NOTE : SHARED_ROWS_NOTE;
  const description = own ? { ar: `${own.ar} ${note.ar}`, en: `${own.en} ${note.en}` } : note;
  return { ...field, admin: { ...field.admin, description } } as Field;
}

/** The map's sentence on the field; an inline one beside it is refused (audit 2026-09-18, 2.9). */
function withDescription(field: Field, pass: Pass, name: string): Field {
  const description = pass.map[name];
  if (!description) return field;
  pass.applied?.add(name);
  if (adminOf(field).description !== undefined) {
    throw new Error(
      `Field "${name}" carries an inline admin.description where its map names it; delete the inline one, the map is what shows.`,
    );
  }
  return { ...field, admin: { ...field.admin, description } } as Field;
}

/** A read-only JSON field reads as our pretty-printed block, in the form and in the list. */
function withJsonView(field: Field): Field {
  if (field.type !== 'json' || !readOnlyShown(field)) return field;
  const components = adminOf(field).components ?? {};
  return {
    ...field,
    admin: {
      ...field.admin,
      components: {
        ...components,
        Field: components.Field ?? JSON_VIEW_FIELD,
        Cell: components.Cell ?? JSON_VIEW_CELL,
      },
    },
  } as Field;
}

/** A read-only scalar field reads as a line, unless a widget of its own is already set. */
function withReadOnlyLine(field: Field): Field {
  if (!SCALAR_TYPES.has(field.type) || !readOnlyShown(field)) return field;
  if (adminOf(field).components?.Field) return field;
  return withComponent(field, 'Field', READ_ONLY_LINE);
}

/** A collapsible or a group that names a section icon gets the label that draws it. */
function withSectionLabel(field: Field): Field {
  if (field.type !== 'collapsible' && field.type !== 'group') return field;
  if (!sectionIconOf(field.admin)) return field;
  return withComponent(field, 'Label', SECTION_LABEL);
}

/** Sets the slot unless the config already set it (a widget of its own wins). */
function withComponent(field: Field, slot: 'Cell' | 'Field' | 'Label', path: string): Field {
  const components = (field.admin?.components ?? {}) as Record<string, unknown>;
  if (components[slot] !== undefined) return field;
  return {
    ...field,
    admin: { ...field.admin, components: { ...components, [slot]: path } },
  } as Field;
}
