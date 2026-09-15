import type { Field, Tab } from 'payload';

/** What a field does on the site, in both languages, keyed by the field's path. */
export type Described = Record<string, { ar: string; en: string }>;

/**
 * Sets `admin.description` on every field the map names (ADR-046): the path is the field's
 * names joined by dots, through named tabs, groups and arrays, with a block's slug after the
 * blocks field (`blocks.cards.items.title`); rows and collapsibles are transparent. A field
 * that already carries a description keeps it unless the map names it. `applied` collects the
 * keys used, so `tests/admin-config.test.ts` can refuse a key that names nothing.
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
    if (field.type === 'row' || field.type === 'collapsible') {
      return { ...field, fields: describeFields(field.fields, map, applied, path) };
    }
    if (!('name' in field) || !field.name) return field;
    const name = `${path}${field.name}`;
    const description = map[name];
    if (description) applied?.add(name);
    let next: Field = description
      ? ({ ...field, admin: { ...field.admin, description } } as Field)
      : field;
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
