import type { CollectionConfig, Field, GlobalConfig } from 'payload';
import { describe, expect, it } from 'vitest';
import { isAbandonedDraft, titleOf } from '@/modules/cms/admin/dashboard/data';
import { ENTITY_HEADER_PATH, LOCALE_NOTE_PATH } from '@/modules/cms/admin/document/config';
import {
  AUTHOR_DESCRIPTIONS,
  CATEGORY_DESCRIPTIONS,
  POST_DESCRIPTIONS,
  TAG_DESCRIPTIONS,
} from '@/modules/cms/admin/descriptions/blog';
import {
  FAQ_DESCRIPTIONS,
  INTEGRATION_DESCRIPTIONS,
  PRODUCT_DESCRIPTIONS,
  TESTIMONIAL_DESCRIPTIONS,
} from '@/modules/cms/admin/descriptions/catalogue';
import type { Described } from '@/modules/cms/admin/descriptions/describe';
import { PAGE_DESCRIPTIONS } from '@/modules/cms/admin/descriptions/pages';
import {
  HOME_DESCRIPTIONS,
  MEDIA_DESCRIPTIONS,
  SEO_DEFAULTS_DESCRIPTIONS,
  SITE_SETTINGS_DESCRIPTIONS,
  USER_DESCRIPTIONS,
} from '@/modules/cms/admin/descriptions/site';
import {
  AI_SETTINGS_DESCRIPTIONS,
  AI_TOPICS_DESCRIPTIONS,
} from '@/modules/ai-content/descriptions';
import {
  ADMIN_GROUPS,
  ADMIN_NAV,
  COLLECTION_ICONS,
  GLOBAL_ICONS,
  groupIcon,
  groupKey,
  navPlacement,
} from '@/modules/cms/admin/icons';
import { Authors } from '@/modules/cms/collections/authors';
import { Categories } from '@/modules/cms/collections/categories';
import { Faqs } from '@/modules/cms/collections/faqs';
import { Integrations } from '@/modules/cms/collections/integrations';
import { Media } from '@/modules/cms/collections/media';
import { Pages } from '@/modules/cms/collections/pages';
import { Posts } from '@/modules/cms/collections/posts';
import { Products } from '@/modules/cms/collections/products';
import { REDIRECT_OVERRIDES } from '@/modules/cms/collections/redirects';
import { Tags } from '@/modules/cms/collections/tags';
import { Testimonials } from '@/modules/cms/collections/testimonials';
import { Users } from '@/modules/cms/collections/users';
import { Home } from '@/modules/cms/globals/home';
import { SeoDefaults } from '@/modules/cms/globals/seo-defaults';
import { SiteSettings } from '@/modules/cms/globals/site-settings';
import { AiSettings } from '@/modules/ai-content/settings';
import { AiRuns } from '@/modules/ai-content/runs';
import { AiTopics } from '@/modules/ai-content/topics';

/**
 * The admin design system's "future things" guarantee (ADR-039, `.claude/rules/admin-ui.md`):
 * every collection and global an editor can open carries a group, Arabic labels, a one-line
 * Arabic description, a title field and list columns, and has an icon in the registry.
 */
const collections: CollectionConfig[] = [
  Users,
  Media,
  Products,
  Pages,
  Faqs,
  Testimonials,
  Integrations,
  // The plugin builds the collection; its overrides carry the admin shape.
  { ...REDIRECT_OVERRIDES, slug: 'redirects', fields: [] } as unknown as CollectionConfig,
];
const globals: GlobalConfig[] = [Home, SiteSettings, SeoDefaults];

const ARABIC = /[؀-ۿ]/;
/** lucide icons are `forwardRef` exotic components: objects with a `render`. */
const isIcon = (icon: unknown): boolean =>
  typeof icon === 'function' || (typeof icon === 'object' && icon !== null && 'render' in icon);
const arabic = (label: unknown): boolean =>
  typeof label === 'object' &&
  label !== null &&
  ARABIC.test(String((label as { ar?: unknown }).ar));
const groupOf = (admin: { group?: unknown } | undefined): string =>
  String((admin?.group as { ar?: unknown } | undefined)?.ar ?? '');

describe('admin config shape (ADR-039)', () => {
  for (const c of collections) {
    it(`collection ${c.slug}: icon, group, Arabic labels + description, title, columns`, () => {
      expect(isIcon(COLLECTION_ICONS[c.slug as keyof typeof COLLECTION_ICONS]), 'icon').toBe(true);
      expect(arabic(c.admin?.group), 'admin.group').toBe(true);
      expect(isIcon(groupIcon(groupOf(c.admin))), 'group icon').toBe(true);
      expect(arabic(c.labels?.singular), 'labels.singular').toBe(true);
      expect(arabic(c.labels?.plural), 'labels.plural').toBe(true);
      expect(arabic(c.admin?.description), 'admin.description').toBe(true);
      expect(c.admin?.useAsTitle, 'useAsTitle').toBeTruthy();
      expect(c.admin?.defaultColumns?.length ?? 0, 'defaultColumns').toBeGreaterThan(1);
      expect(c.admin?.listSearchableFields?.length ?? 0, 'listSearchableFields').toBeGreaterThan(0);
    });
  }

  for (const g of globals) {
    it(`global ${g.slug}: icon, group, Arabic label + description`, () => {
      expect(isIcon(GLOBAL_ICONS[g.slug as keyof typeof GLOBAL_ICONS]), 'icon').toBe(true);
      expect(arabic(g.admin?.group), 'admin.group').toBe(true);
      expect(isIcon(groupIcon(groupOf(g.admin))), 'group icon').toBe(true);
      expect(arabic(g.label), 'label').toBe(true);
      expect(arabic(g.admin?.description), 'admin.description').toBe(true);
    });
  }
});

/**
 * The sidebar registry (ADR-046): every entity has a place, its config's `admin.group` names
 * the registry's group, a parent is a real entity of the same group, and the header carries a
 * "shows on" sentence in both languages.
 */
describe('the sidebar registry (ADR-046)', () => {
  const everyCollection = [...collections, Authors, Categories, Posts, Tags, AiTopics, AiRuns];
  const everyGlobal = [...globals, AiSettings];
  for (const c of everyCollection) {
    it(`collection ${c.slug}: placed, grouped as the config says, header registered`, () => {
      const placement = navPlacement('collections', c.slug);
      expect(placement, 'placement').toBeDefined();
      expect(groupKey(groupOf(c.admin)), 'admin.group in the registry').toBe(placement?.group);
      if (placement?.parent) {
        expect(navPlacement(placement.parent.type, placement.parent.slug)?.group).toBe(
          placement.group,
        );
      }
      const header = c.admin?.components?.Description as { path?: string } | undefined;
      expect(header?.path, 'Description slot').toBe(ENTITY_HEADER_PATH);
      const shows = c.admin?.custom?.['shows'] as { ar?: string; en?: string } | undefined;
      expect(shows?.en, 'shows.en').toBeTruthy();
      expect(ARABIC.test(shows?.ar ?? ''), 'shows.ar').toBe(true);
    });
  }
  for (const g of everyGlobal) {
    it(`global ${g.slug}: placed, grouped as the config says, header registered`, () => {
      const placement = navPlacement('globals', g.slug);
      expect(placement, 'placement').toBeDefined();
      expect(groupKey(groupOf(g.admin)), 'admin.group in the registry').toBe(placement?.group);
      const header = g.admin?.components?.elements?.Description as { path?: string } | undefined;
      expect(header?.path, 'Description slot').toBe(ENTITY_HEADER_PATH);
      const shows = g.admin?.custom?.['shows'] as { ar?: string; en?: string } | undefined;
      expect(shows?.en, 'shows.en').toBeTruthy();
      expect(ARABIC.test(shows?.ar ?? ''), 'shows.ar').toBe(true);
    });
  }
  it('every registry entry names a group of the five, and every group has an icon and a hue', () => {
    for (const p of [
      ...Object.values(ADMIN_NAV.collections),
      ...Object.values(ADMIN_NAV.globals),
    ]) {
      expect(Object.keys(ADMIN_GROUPS)).toContain(p.group);
    }
    for (const group of Object.values(ADMIN_GROUPS)) {
      expect(isIcon(group.icon)).toBe(true);
      expect(ARABIC.test(group.ar)).toBe(true);
    }
  });
});

/**
 * Every field an editor sees says what it does on the site (ADR-046, design system §1.5):
 * an `admin.description` in both languages, at least four words each. Layout fields (row,
 * collapsible, tabs, an unnamed group), `ui` fields, hidden, read-only and label-less fields
 * are not read by an editor and are left out; the tabs' own fields are walked.
 */
const words = (v: unknown) => (typeof v === 'string' ? v.trim().split(/\s+/).length : 0);

function describedFields(fields: Field[], path = ''): Array<{ path: string; ok: boolean }> {
  const out: Array<{ path: string; ok: boolean }> = [];
  for (const f of fields) {
    const admin = (f as { admin?: Record<string, unknown> }).admin ?? {};
    if (f.type === 'tabs') {
      for (const t of f.tabs) {
        out.push(...describedFields(t.fields, 'name' in t && t.name ? `${path}${t.name}.` : path));
      }
      continue;
    }
    if (f.type === 'row' || f.type === 'collapsible' || f.type === 'ui') {
      if ('fields' in f) out.push(...describedFields(f.fields, path));
      continue;
    }
    if (!('name' in f) || !f.name) continue;
    const name = `${path}${f.name}`;
    // A field a custom widget renders (`admin.components.Field`) explains itself; its inner
    // fields never reach an editor as fields.
    const widget = Boolean((admin['components'] as { Field?: unknown } | undefined)?.Field);
    const skip =
      admin['hidden'] === true ||
      admin['readOnly'] === true ||
      (f as { label?: unknown }).label === false ||
      admin['disabled'] === true ||
      widget;
    if (widget) continue;
    if (!skip) {
      const d = admin['description'] as { ar?: string; en?: string } | undefined;
      out.push({ path: name, ok: words(d?.ar) >= 4 && words(d?.en) >= 4 });
    }
    if ('fields' in f && Array.isArray(f.fields)) {
      out.push(...describedFields(f.fields, `${name}.`));
    }
    if ('blocks' in f) {
      for (const b of f.blocks) out.push(...describedFields(b.fields, `${name}.${b.slug}.`));
    }
  }
  return out;
}

/** Every named field path of a config, the way the description maps address them. */
function fieldPaths(fields: Field[], path = ''): string[] {
  const out: string[] = [];
  for (const f of fields) {
    if (f.type === 'tabs') {
      for (const t of f.tabs) {
        out.push(...fieldPaths(t.fields, 'name' in t && t.name ? `${path}${t.name}.` : path));
      }
      continue;
    }
    if (f.type === 'row' || f.type === 'collapsible') {
      out.push(...fieldPaths(f.fields, path));
      continue;
    }
    if (!('name' in f) || !f.name) continue;
    const name = `${path}${f.name}`;
    out.push(name);
    if ('fields' in f && Array.isArray(f.fields)) out.push(...fieldPaths(f.fields, `${name}.`));
    if ('blocks' in f) {
      for (const b of f.blocks) out.push(...fieldPaths(b.fields, `${name}.${b.slug}.`));
    }
  }
  return out;
}

describe('the description maps name real fields (ADR-046)', () => {
  const maps: Array<[{ slug: string; fields: Field[] }, Described]> = [
    [Products, PRODUCT_DESCRIPTIONS],
    [Faqs, FAQ_DESCRIPTIONS],
    [Testimonials, TESTIMONIAL_DESCRIPTIONS],
    [Integrations, INTEGRATION_DESCRIPTIONS],
    [Pages, PAGE_DESCRIPTIONS],
    [Posts, POST_DESCRIPTIONS],
    [Categories, CATEGORY_DESCRIPTIONS],
    [Authors, AUTHOR_DESCRIPTIONS],
    [Tags, TAG_DESCRIPTIONS],
    [Users, USER_DESCRIPTIONS],
    [Media, MEDIA_DESCRIPTIONS],
    [Home, HOME_DESCRIPTIONS],
    [SiteSettings, SITE_SETTINGS_DESCRIPTIONS],
    [SeoDefaults, SEO_DEFAULTS_DESCRIPTIONS],
    [AiSettings, AI_SETTINGS_DESCRIPTIONS],
    [AiTopics, AI_TOPICS_DESCRIPTIONS],
  ];
  for (const [c, map] of maps) {
    it(`${c.slug}: every key of its map is a field`, () => {
      const paths = new Set(fieldPaths(c.fields));
      expect(Object.keys(map).filter((k) => !paths.has(k))).toEqual([]);
    });
  }
});

describe('every field says what it does on the site (ADR-046)', () => {
  const configs: Array<{ slug: string; fields: Field[] }> = [
    ...collections.filter((c) => c.slug !== 'redirects'),
    Authors,
    Categories,
    Posts,
    Tags,
    AiTopics,
    AiRuns,
    ...globals,
    AiSettings,
  ];
  for (const c of configs) {
    it(`${c.slug}: a two-language description of four words or more on every field`, () => {
      const missing = describedFields(c.fields)
        .filter((f) => !f.ok)
        .map((f) => f.path);
      expect(missing).toEqual([]);
    });
  }
});

/** Whether any field, at any depth, is per language. */
function hasLocalized(fields: Field[]): boolean {
  return fields.some((f) => {
    if ('localized' in f && f.localized) return true;
    if ('fields' in f && Array.isArray(f.fields)) return hasLocalized(f.fields);
    if ('tabs' in f) return f.tabs.some((t) => hasLocalized(t.fields));
    if ('blocks' in f) return f.blocks.some((b) => hasLocalized(b.fields));
    return false;
  });
}
const NOTE = LOCALE_NOTE_PATH;

describe('the locale note (ADR-044): every document with per-language fields carries it', () => {
  const allCollections = [
    ...collections.filter((c) => c.slug !== 'redirects'),
    Authors,
    Categories,
    Posts,
    Tags,
    AiTopics,
  ];
  for (const c of allCollections) {
    it(`collection ${c.slug}`, () => {
      const registered = c.admin?.components?.edit?.beforeDocumentControls ?? [];
      expect(registered.includes(NOTE)).toBe(hasLocalized(c.fields));
    });
  }
  for (const g of [...globals, AiSettings]) {
    it(`global ${g.slug}`, () => {
      const registered = g.admin?.components?.elements?.beforeDocumentControls ?? [];
      expect(registered.includes(NOTE)).toBe(hasLocalized(g.fields));
    });
  }
});

describe('dashboard recent list: a title for every row', () => {
  it('shows the title, the id when the title is the id, and "Untitled" for an empty one', () => {
    expect(titleOf('من نحن')).toBe('من نحن');
    expect(titleOf(63)).toBe('63');
    expect(titleOf('')).toBe('Untitled');
    expect(titleOf('   ')).toBe('Untitled');
    expect(titleOf(null)).toBe('Untitled');
    expect(titleOf(undefined)).toBe('Untitled');
  });

  it('leaves out a draft nobody titled or saved (an abandoned "Create New")', () => {
    expect(isAbandonedDraft({ _status: 'draft' }, '')).toBe(true);
    expect(isAbandonedDraft({ _status: 'draft' }, 'A draft in progress')).toBe(false);
    expect(isAbandonedDraft({ _status: 'draft', lastSavedBy: { name: 'Dhia' } }, '')).toBe(false);
    expect(isAbandonedDraft({ _status: 'published' }, '')).toBe(false);
  });
});
