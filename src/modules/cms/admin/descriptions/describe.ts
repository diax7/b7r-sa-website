import type { Field, Tab } from 'payload';
import {
  BILINGUAL_FIELD,
  bilingualPaths,
  TRANSLATIONS,
  translationsField,
} from '@/modules/cms/fields/bilingual';

/** What a field does on the site, in both languages, keyed by the field's path. */
export type Described = Record<string, { ar: string; en: string }>;

/**
 * The list cell for every checkbox (design system: green yes, red no). `describeFields` sets
 * it beside the descriptions: the one pass every collection's fields go through.
 */
export const BOOL_CELL = '@/modules/cms/admin/fields/bool-cell#BoolCell';

interface Pass {
  map: Described;
  applied: Set<string> | undefined;
  /** The paths edited in both languages at once (ADR-057), from `bilingualPaths`. */
  bilingual: ReadonlySet<string>;
}

/**
 * Sets `admin.description` on every field the map names (ADR-046): the path is the field's
 * names joined by dots, through named tabs, groups and arrays, with a block's slug after the
 * blocks field (`blocks.cards.items.title`); rows, collapsibles and unnamed groups are
 * transparent, `ui` fields are not fields. A field that already carries a description keeps
 * it unless the map names it. `applied` collects the keys used, so
 * `tests/admin-config.test.ts` can refuse a key that names nothing.
 *
 * The same pass gives every checkbox its list cell, renders every localized text, textarea
 * and select field with `BilingualField` (ADR-057) and, when a config has any such field,
 * appends the hidden `translations` JSON the hook reads; the config's `afterChange` must
 * then list `applyTranslations` (the config test checks).
 */
export function describeFields(fields: Field[], map: Described, applied?: Set<string>): Field[] {
  const bilingual = new Set(bilingualPaths(fields));
  const described = walk(fields, { map, applied, bilingual }, '');
  const carried = described.some((f) => 'name' in f && f.name === TRANSLATIONS);
  return bilingual.size > 0 && !carried ? [...described, translationsField()] : described;
}

function walk(fields: Field[], pass: Pass, path: string): Field[] {
  return fields.map((field) => {
    if (field.type === 'tabs') {
      return {
        ...field,
        tabs: field.tabs.map((tab): Tab => ({
          ...tab,
          fields: walk(tab.fields, pass, 'name' in tab && tab.name ? `${path}${tab.name}.` : path),
        })) as typeof field.tabs,
      };
    }
    if (field.type === 'ui') return field;
    if (
      field.type === 'row' ||
      field.type === 'collapsible' ||
      (field.type === 'group' && !('name' in field && field.name))
    ) {
      return { ...field, fields: walk(field.fields, pass, path) } as Field;
    }
    if (!('name' in field) || !field.name) return field;
    return named(field, pass, `${path}${field.name}`);
  });
}

function named(field: Field & { name: string }, pass: Pass, name: string): Field {
  const description = pass.map[name];
  if (description) pass.applied?.add(name);
  let next: Field = description
    ? ({ ...field, admin: { ...field.admin, description } } as Field)
    : field;
  // A checkbox in a list reads as a coloured badge, never Payload's `true` / `false` pill.
  if (next.type === 'checkbox' && !next.admin?.components?.Cell) {
    next = withComponent(next, 'Cell', BOOL_CELL);
  }
  if (pass.bilingual.has(name)) next = withComponent(next, 'Field', BILINGUAL_FIELD);
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

function withComponent(field: Field, slot: 'Cell' | 'Field', path: string): Field {
  return {
    ...field,
    admin: { ...field.admin, components: { ...field.admin?.components, [slot]: path } },
  } as Field;
}
