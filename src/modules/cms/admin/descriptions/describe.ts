import type { Field, Tab } from 'payload';

/** What a field does on the site, in both languages, keyed by the field's path. */
export type Described = Record<string, { ar: string; en: string }>;

/**
 * The list cell for every checkbox (design system: green yes, red no). `describeFields` sets
 * it beside the descriptions: the one pass every collection's fields go through.
 */
export const BOOL_CELL = '@/modules/cms/admin/fields/bool-cell#BoolCell';

/**
 * The field and the list cell for every read-only JSON field (admin audit 2026-09-18, 2.1):
 * Payload's JSON editor loads Monaco from a CDN the admin CSP refuses, so a log row's JSON
 * rendered empty. A read-only value needs no editor; it needs to be read.
 */
export const JSON_VIEW_FIELD = '@/modules/cms/admin/fields/json-view#JsonView';
export const JSON_VIEW_CELL = '@/modules/cms/admin/fields/json-view#JsonViewCell';

/** A read-only JSON field reads as our pretty-printed block, in the form and in the list. */
function withJsonView(field: Field): Field {
  if (field.type !== 'json' || field.admin?.readOnly !== true || field.admin?.hidden) return field;
  const components = field.admin.components ?? {};
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
  };
}

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

/** A read-only scalar field reads as a line, unless a widget of its own is already set. */
function withReadOnlyLine(field: Field): Field {
  const admin = (field.admin ?? {}) as {
    readOnly?: boolean;
    hidden?: boolean;
    components?: { Field?: unknown };
  };
  if (!SCALAR_TYPES.has(field.type) || admin.readOnly !== true || admin.hidden) return field;
  const components = admin.components ?? {};
  if (components.Field) return field;
  return {
    ...field,
    admin: { ...admin, components: { ...components, Field: READ_ONLY_LINE } },
  } as Field;
}

/**
 * Sets `admin.description` on every field the map names (ADR-046): the path is the field's
 * names joined by dots, through named tabs, groups and arrays, with a block's slug after the
 * blocks field (`blocks.cards.items.title`); rows, collapsibles and unnamed groups are
 * transparent, `ui` fields are not fields. A field that already carries a description keeps
 * it unless the map names it, in which case the config is refused. The same pass gives every
 * checkbox its list badge, every read-only JSON its block and every read-only scalar its line.
 * `applied` collects the keys used, so `tests/admin-config.test.ts` can refuse a key that
 * names nothing.
 */
export function describeFields(
  fields: Field[],
  map: Described,
  applied?: Set<string>,
  path = '',
): Field[] {
  return fields.map((field) => {
    if (field.type === 'tabs') {
      return {
        ...field,
        tabs: field.tabs.map((tab): Tab => ({
          ...tab,
          fields: describeFields(
            tab.fields,
            map,
            applied,
            'name' in tab && tab.name ? `${path}${tab.name}.` : path,
          ),
        })) as typeof field.tabs,
      };
    }
    if (field.type === 'ui') return field;
    if (
      field.type === 'row' ||
      field.type === 'collapsible' ||
      (field.type === 'group' && !('name' in field && field.name))
    ) {
      return { ...field, fields: describeFields(field.fields, map, applied, path) } as Field;
    }
    if (!('name' in field) || !field.name) return field;
    const name = `${path}${field.name}`;
    const description = map[name];
    if (description) applied?.add(name);
    // An inline sentence the map also names is never shown and drifts (audit 2026-09-18, 2.9).
    if (description && field.admin?.description !== undefined) {
      throw new Error(
        `Field "${name}" carries an inline admin.description where its map names it; delete the inline one, the map is what shows.`,
      );
    }
    let next: Field = description
      ? ({ ...field, admin: { ...field.admin, description } } as Field)
      : field;
    // A checkbox in a list reads as a coloured badge, never Payload's `true` / `false` pill.
    if (next.type === 'checkbox' && !next.admin?.components?.Cell) {
      next = {
        ...next,
        admin: {
          ...next.admin,
          components: { ...next.admin?.components, Cell: BOOL_CELL },
        },
      };
    }
    next = withReadOnlyLine(withJsonView(next));
    if ('fields' in next && Array.isArray(next.fields)) {
      next = { ...next, fields: describeFields(next.fields, map, applied, `${name}.`) } as Field;
    }
    if (next.type === 'blocks') {
      next = {
        ...next,
        blocks: next.blocks.map((block) => ({
          ...block,
          fields: describeFields(block.fields, map, applied, `${name}.${block.slug}.`),
        })),
      };
    }
    return next;
  });
}
