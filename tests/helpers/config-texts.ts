import type { CollectionConfig, Field, GlobalConfig } from 'payload';
import { REDIRECT_OVERRIDES } from '@/modules/cms/collections/redirects';
import { COLLECTIONS, GLOBALS } from '@/modules/cms/entities';

/** One text an editor reads in the panel's chrome or a form, in both languages. */
export interface ConfigText {
  /** `<slug>.<path> <kind>`: where the pair sits. */
  where: string;
  kind: 'label' | 'description' | 'shows' | 'option' | 'tab' | 'collapsible' | 'emptyText';
  ar: string;
  en: string;
}

type Pair = { ar?: unknown; en?: unknown };

const pair = (value: unknown): { ar: string; en: string } | null => {
  if (typeof value !== 'object' || value === null) return null;
  const { ar, en } = value as Pair;
  return typeof ar === 'string' && typeof en === 'string' ? { ar, en } : null;
};

/**
 * The redirects collection as the plugin builds it: its overrides shape the plugin's
 * default fields, which a unit test stands in for with the same names and types.
 */
export const REDIRECTS_STUB = {
  ...REDIRECT_OVERRIDES,
  slug: 'redirects',
  fields: REDIRECT_OVERRIDES.fields({
    defaultFields: [
      { name: 'from', type: 'text' },
      {
        name: 'to',
        type: 'group',
        fields: [
          { name: 'type', type: 'radio', options: ['reference', 'custom'] },
          { name: 'reference', type: 'relationship', relationTo: 'pages' },
          { name: 'url', type: 'text' },
        ],
      },
      { name: 'type', type: 'select', options: ['301', '302'] },
    ],
  }),
} as unknown as CollectionConfig;

/** Every entity the panel serves, the plugin's redirects included. */
export const ENTITIES: Array<CollectionConfig | GlobalConfig> = [
  ...COLLECTIONS,
  REDIRECTS_STUB,
  ...GLOBALS,
];

function push(out: ConfigText[], where: string, kind: ConfigText['kind'], value: unknown) {
  const p = pair(value);
  if (p) out.push({ where, kind, ...p });
}

function walk(out: ConfigText[], slug: string, fields: Field[], path: string): void {
  for (const f of fields) {
    if (f.type === 'tabs') {
      for (const t of f.tabs) {
        const name = 'name' in t && t.name ? `${path}${t.name}` : `${path}[tab]`;
        push(out, `${slug}.${name}`, 'tab', t.label);
        push(out, `${slug}.${name}`, 'description', t.description);
        walk(out, slug, t.fields, 'name' in t && t.name ? `${path}${t.name}.` : path);
      }
      continue;
    }
    if (f.type === 'ui') continue;
    if (
      f.type === 'row' ||
      f.type === 'collapsible' ||
      (f.type === 'group' && !('name' in f && f.name))
    ) {
      if (f.type === 'collapsible')
        push(out, `${slug}.${path}[collapsible]`, 'collapsible', f.label);
      walk(out, slug, f.fields, path);
      continue;
    }
    if (!('name' in f) || !f.name) continue;
    const name = `${path}${f.name}`;
    const where = `${slug}.${name}`;
    push(out, where, 'label', (f as { label?: unknown }).label);
    const admin = (f as { admin?: Record<string, unknown> }).admin ?? {};
    push(out, where, 'description', admin['description']);
    push(
      out,
      where,
      'emptyText',
      (admin['custom'] as Record<string, unknown> | undefined)?.['emptyText'],
    );
    if ('labels' in f && f.labels) {
      push(out, `${where}.singular`, 'label', f.labels.singular);
      push(out, `${where}.plural`, 'label', f.labels.plural);
    }
    const options = (f as { options?: Array<string | { value: string; label: unknown }> }).options;
    for (const o of options ?? []) {
      if (typeof o !== 'string') push(out, `${where} = ${o.value}`, 'option', o.label);
    }
    if ('fields' in f && Array.isArray(f.fields)) walk(out, slug, f.fields, `${name}.`);
    if ('blocks' in f) {
      for (const b of f.blocks) {
        push(out, `${where}.${b.slug}.singular`, 'label', b.labels?.singular);
        push(out, `${where}.${b.slug}.plural`, 'label', b.labels?.plural);
        walk(out, slug, b.fields, `${name}.${b.slug}.`);
      }
    }
  }
}

/** Every bilingual text of every entity: labels, descriptions, options, tabs, the header's sentence. */
export function configTexts(
  entities: Array<CollectionConfig | GlobalConfig> = ENTITIES,
): ConfigText[] {
  const out: ConfigText[] = [];
  for (const c of entities) {
    const slug = c.slug;
    if ('labels' in c) {
      push(out, `${slug}.labels.singular`, 'label', c.labels?.singular);
      push(out, `${slug}.labels.plural`, 'label', c.labels?.plural);
    } else {
      push(out, `${slug}.label`, 'label', (c as GlobalConfig).label);
    }
    push(out, `${slug}.admin.description`, 'description', c.admin?.description);
    push(out, `${slug}.admin.custom.shows`, 'shows', c.admin?.custom?.['shows']);
    walk(out, slug, c.fields ?? [], '');
  }
  return out;
}
