import type { CollectionConfig, Field, GlobalConfig } from 'payload';
import { describe, expect, it } from 'vitest';
import { isAbandonedDraft, savesByPeople, titleOf } from '@/modules/cms/admin/dashboard/data';
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
import {
  BOOL_CELL,
  type Described,
  describeFields,
  JSON_VIEW_CELL,
  JSON_VIEW_FIELD,
  READ_ONLY_LINE,
} from '@/modules/cms/admin/descriptions/describe';
import { PAGE_DESCRIPTIONS } from '@/modules/cms/admin/descriptions/pages';
import {
  HOME_DESCRIPTIONS,
  MEDIA_DESCRIPTIONS,
  SEO_DEFAULTS_DESCRIPTIONS,
  SITE_SETTINGS_DESCRIPTIONS,
  USER_DESCRIPTIONS,
} from '@/modules/cms/admin/descriptions/site';
import {
  AI_RUNS_DESCRIPTIONS,
  AI_SETTINGS_DESCRIPTIONS,
  AI_TOPICS_DESCRIPTIONS,
} from '@/modules/ai-content/descriptions';
import {
  ADMIN_GROUPS,
  ADMIN_NAV,
  ADMIN_VIEWS,
  COLLECTION_ICONS,
  entityIcon,
  GLOBAL_ICONS,
  groupIcon,
  groupKey,
  navPlacement,
  type ViewSlug,
} from '@/modules/cms/admin/icons';
import { Authors } from '@/modules/cms/collections/authors';
import { Categories } from '@/modules/cms/collections/categories';
import { Faqs } from '@/modules/cms/collections/faqs';
import { Integrations } from '@/modules/cms/collections/integrations';
import { Media } from '@/modules/cms/collections/media';
import { Pages } from '@/modules/cms/collections/pages';
import { POST_FEATURES, Posts } from '@/modules/cms/collections/posts';
import { Products } from '@/modules/cms/collections/products';
import { REDIRECT_OVERRIDES } from '@/modules/cms/collections/redirects';
import { Tags } from '@/modules/cms/collections/tags';
import { Testimonials } from '@/modules/cms/collections/testimonials';
import { Users } from '@/modules/cms/collections/users';
import { Home } from '@/modules/cms/globals/home';
import { SeoDefaults } from '@/modules/cms/globals/seo-defaults';
import { SiteSettings } from '@/modules/cms/globals/site-settings';
import { AiRuns } from '@/modules/ai-content/runs';
import { PAGE_TEXT_FEATURES } from '@/modules/cms/blocks';
import { Citations } from '@/modules/visibility/ledger/citations';
import { AiSettings } from '@/modules/ai-content/settings';
import { AiTopics } from '@/modules/ai-content/topics';
import { COLLECTIONS, GLOBALS } from '@/modules/cms/entities';
import { ADMIN_VIEW_COMPONENTS } from '@/modules/cms/admin/views/registry';
import { Connections } from '@/modules/connections/collection';
import { CONNECTION_DESCRIPTIONS } from '@/modules/connections/descriptions';
import { Traffic } from '@/modules/traffic/collection';
import { TRAFFIC_DESCRIPTIONS } from '@/modules/traffic/descriptions';

/**
 * The admin design system's "future things" guarantee (ADR-039, `.claude/rules/admin-ui.md`):
 * every collection and global an editor can open carries a group, Arabic labels, a one-line
 * Arabic description, a title field and list columns, and has an icon in the registry.
 */
const collections: CollectionConfig[] = [
  ...COLLECTIONS,
  // The plugin builds the collection; its overrides carry the admin shape.
  { ...REDIRECT_OVERRIDES, slug: 'redirects', fields: [] } as unknown as CollectionConfig,
];
const globals: GlobalConfig[] = GLOBALS;

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
  const everyCollection = collections;
  const everyGlobal = globals;
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
  it('every custom view of ours is registered with Payload, placed, iconed and admins-only', () => {
    expect(Object.keys(ADMIN_VIEW_COMPONENTS).toSorted()).toEqual(
      Object.keys(ADMIN_VIEWS).toSorted(),
    );
    for (const [slug, view] of Object.entries(ADMIN_VIEWS)) {
      const placement = navPlacement('views', slug);
      expect(placement, slug).toBeDefined();
      expect(ADMIN_VIEW_COMPONENTS[slug as ViewSlug].path).toBe(view.path);
      expect(isIcon(view.icon), `${slug} icon`).toBe(true);
      expect(view.icon, `${slug} icon repeats its group's`).not.toBe(
        ADMIN_GROUPS[placement!.group].icon,
      );
      expect(ARABIC.test(view.label.ar), `${slug} label.ar`).toBe(true);
      expect(entityIcon('views', slug)).toBe(view.icon);
    }
    // A collection may sit under a view; the pair share a group.
    expect(navPlacement('collections', 'traffic')?.parent).toEqual({
      type: 'views',
      slug: 'traffic',
    });
    expect(navPlacement('collections', 'traffic')?.group).toBe(
      navPlacement('views', 'traffic')?.group,
    );
  });

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

/** Every named field of a config at any depth, with its path (the description maps' keys). */
function walkFields(fields: Field[], path = ''): Array<{ path: string; field: Field }> {
  const out: Array<{ path: string; field: Field }> = [];
  for (const f of fields) {
    if (f.type === 'tabs') {
      for (const t of f.tabs) {
        out.push(...walkFields(t.fields, 'name' in t && t.name ? `${path}${t.name}.` : path));
      }
      continue;
    }
    if (f.type === 'ui') continue;
    if (
      f.type === 'row' ||
      f.type === 'collapsible' ||
      (f.type === 'group' && !('name' in f && f.name))
    ) {
      out.push(...walkFields(f.fields, path));
      continue;
    }
    if (!('name' in f) || !f.name) continue;
    const name = `${path}${f.name}`;
    out.push({ path: name, field: f });
    if ('fields' in f && Array.isArray(f.fields)) out.push(...walkFields(f.fields, `${name}.`));
    if ('blocks' in f) {
      for (const b of f.blocks) out.push(...walkFields(b.fields, `${name}.${b.slug}.`));
    }
  }
  return out;
}

const componentsOf = (field: Field) =>
  (field as { admin?: { components?: { Field?: unknown; Cell?: unknown } } }).admin?.components;

/**
 * Every field an editor sees says what it does on the site (ADR-046, design system §1.5):
 * an `admin.description` in both languages, at least four words each. Layout fields (row,
 * collapsible, tabs, an unnamed group) are transparent; `ui` fields are no fields; a hidden,
 * read-only or disabled field is skipped with everything under it (`lastSavedBy`, the post's
 * `warnings`); a `label: false` group is skipped but its fields are read. A field a widget
 * renders (the switches, the pickers, the colour field) is held to the rule like any other:
 * `FieldShell` shows its description.
 */
const words = (v: unknown) => (typeof v === 'string' ? v.trim().split(/\s+/).length : 0);

function describedFields(fields: Field[]): Array<{ path: string; ok: boolean }> {
  const out: Array<{ path: string; ok: boolean }> = [];
  const skipped: string[] = [];
  for (const { path, field } of walkFields(fields)) {
    if (skipped.some((s) => path.startsWith(`${s}.`))) continue;
    const admin = (field as { admin?: Record<string, unknown> }).admin ?? {};
    if (admin['hidden'] === true || admin['readOnly'] === true || admin['disabled'] === true) {
      skipped.push(path);
      continue;
    }
    if ((field as { label?: unknown }).label === false) continue;
    const d = admin['description'] as { ar?: string; en?: string } | undefined;
    out.push({ path, ok: words(d?.ar) >= 4 && words(d?.en) >= 4 });
  }
  return out;
}

/**
 * Every named field path of a config, the way the description maps address them. A read-only
 * or hidden field is a real field (its description still renders under it), so a map may name
 * it; only the rule of four words leaves it out.
 */
const fieldPaths = (fields: Field[]): string[] => walkFields(fields).map((f) => f.path);

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
    [AiRuns, AI_RUNS_DESCRIPTIONS],
    [Connections, CONNECTION_DESCRIPTIONS],
    [Traffic, TRAFFIC_DESCRIPTIONS],
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
    ...globals,
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
  for (const c of collections.filter((entity) => entity.slug !== 'redirects')) {
    it(`collection ${c.slug}`, () => {
      const registered = c.admin?.components?.edit?.beforeDocumentControls ?? [];
      expect(registered.includes(NOTE)).toBe(hasLocalized(c.fields));
    });
  }
  for (const g of globals) {
    it(`global ${g.slug}`, () => {
      const registered = g.admin?.components?.elements?.beforeDocumentControls ?? [];
      expect(registered.includes(NOTE)).toBe(hasLocalized(g.fields));
    });
  }
});

/**
 * The document chrome (admin audit 2026-09-18, 2.17 and 3.10): the API tab serves nothing in
 * the site's workflow, so no entity shows it; a list opens in the order the site shows.
 */
describe('the document chrome (audit 2026-09-18)', () => {
  for (const c of collections) {
    it(`collection ${c.slug}: no API tab`, () => {
      expect(c.admin?.hideAPIURL).toBe(true);
    });
  }
  for (const g of globals) {
    it(`global ${g.slug}: no API tab`, () => {
      expect(g.admin?.hideAPIURL).toBe(true);
    });
  }
  it('lists open in site order', () => {
    const sorts = Object.fromEntries(collections.map((c) => [c.slug, c.defaultSort]));
    expect(sorts).toMatchObject({
      products: 'sortOrder',
      faqs: 'order',
      categories: 'order',
      testimonials: 'order',
      integrations: 'order',
      posts: '-publishedAt',
    });
  });
});

/**
 * No raw code in a select (admin audit 2026-09-18, 2.2): every option of every select and
 * radio names its value in both languages. A brand name (Salla, Bing) is written the same in
 * both; anything else carries Arabic script in `ar`; and `en` equal to the stored value is raw
 * code unless the Arabic side proves it a word (Workflow).
 */
describe('every select option carries both labels (audit 2026-09-18)', () => {
  const entities = [...collections.filter((c) => c.slug !== 'redirects'), ...globals];
  for (const c of entities) {
    const selects = walkFields(c.fields).filter(
      ({ field }) => field.type === 'select' || field.type === 'radio',
    );
    if (selects.length === 0) continue;
    it(`${c.slug}: ${selects.map((s) => s.path).join(', ')}`, () => {
      for (const { path, field } of selects) {
        const options = (field as { options: Array<string | { value: string; label: unknown }> })
          .options;
        for (const option of options) {
          const value = typeof option === 'string' ? option : option.value;
          const label = typeof option === 'string' ? null : option.label;
          const where = `${c.slug}.${path} = ${value}`;
          expect(label, where).toEqual(expect.objectContaining({ ar: expect.any(String) }));
          const { ar, en } = label as { ar: string; en: string };
          expect(en, where).toBeTruthy();
          expect(ARABIC.test(ar) || ar === en, `${where}: ar is Arabic or a brand name`).toBe(true);
          // The stored value as the English label is raw code, unless the Arabic proves a word.
          expect(en !== value || ARABIC.test(ar), `${where}: en is the raw value`).toBe(true);
        }
      }
    });
  }
});

/**
 * The words the audit found colliding or raw (2.4, 2.7, 2.8, and the strings table): one
 * word per thing, in both languages.
 */
describe('vocabulary (audit 2026-09-18)', () => {
  const labelOf = (config: { fields: Field[] }, path: string) =>
    walkFields(config.fields).find((f) => f.path === path)?.field as
      | { label?: { ar: string; en: string } }
      | undefined;
  it('a FAQ entry belongs to a «مجموعة», never a «قسم» (that is a blog hub)', () => {
    expect(labelOf(Faqs, 'group')?.label).toEqual({ ar: 'المجموعة', en: 'Group' });
    expect(labelOf(Faqs, 'order')?.label?.ar).toContain('المجموعة');
    expect(labelOf(Categories, 'name')?.label?.ar).toBe('الاسم');
    expect(Categories.labels?.singular).toEqual({ ar: 'قسم', en: 'Hub' });
  });
  it('the engine caps posts, the connection caps dollars', () => {
    expect(labelOf(AiSettings, 'maxPostsPerMonth')?.label?.ar).toBe('الحد الشهري للمقالات');
    expect(labelOf(Connections, 'monthlyLimitUsd')?.label?.ar).toBe('الحد الشهري (دولار)');
  });
  it('"Connected stores" everywhere the site section is named', () => {
    expect(Integrations.labels?.plural).toEqual({ ar: 'المتاجر المتصلة', en: 'Connected stores' });
    const tabs = (Home.fields[0] as { type: 'tabs'; tabs: Array<{ label: unknown }> }).tabs;
    expect(tabs.map((t) => t.label)).toContainEqual({
      ar: 'المتاجر المتصلة',
      en: 'Connected stores',
    });
  });
  it('the image library is called Images, and tags say the site reads none', () => {
    expect(Media.labels).toEqual({
      singular: { ar: 'صورة', en: 'Image' },
      plural: { ar: 'الصور', en: 'Images' },
    });
    const shows = Tags.admin?.custom?.['shows'] as { en: string };
    expect(shows.en).toMatch(/nowhere on the site/);
    expect((Tags.admin?.description as { en: string } | undefined)?.en).toMatch(/reads none/);
  });
  it('the map wins, so an inline description where the map names the field is refused', () => {
    expect(() =>
      describeFields(
        [{ name: 'a', type: 'text', admin: { description: { ar: 'قديم', en: 'old' } } }],
        { a: { ar: 'جديد', en: 'new' } },
      ),
    ).toThrow(/inline admin.description/);
    const [kept] = describeFields(
      [{ name: 'a', type: 'text', admin: { description: { ar: 'قديم', en: 'old' } } }],
      {},
    );
    expect((kept as { admin: { description: unknown } }).admin.description).toEqual({
      ar: 'قديم',
      en: 'old',
    });
  });
});

/**
 * Validation messages read in the panel's language (audit 2026-09-18, 2.6): the same rule,
 * refused in Arabic for an Arabic panel and in English otherwise.
 */
describe('validation messages in both languages (audit 2026-09-18)', () => {
  type Validate = (
    value: unknown,
    args: { req: { i18n?: { language?: string }; locale?: string }; siblingData: unknown },
  ) => true | string;
  const validateOf = (config: { fields: Field[] }, path: string): Validate => {
    const field = walkFields(config.fields).find((f) => f.path === path)?.field as
      | { validate?: Validate }
      | undefined;
    if (!field?.validate) throw new Error(`${path}: no validate`);
    return field.validate;
  };
  const ar = { req: { i18n: { language: 'ar' } }, siblingData: {} };
  const en = { req: { i18n: { language: 'en' } }, siblingData: {} };
  const cases: Array<[string, { fields: Field[] }, string, unknown, unknown]> = [
    ['products.slug', Products, 'slug', 'Bad Slug', {}],
    ['products.suggestedPrice', Products, 'suggestedPrice', 5, { baseCost: 10 }],
    ['products.colors.hex', Products, 'colors.hex', 'red', {}],
    ['home.hero.overlay.color', Home, 'hero.overlay.color', 'blue', {}],
    ['home.productStrip.products', Home, 'productStrip.products', [1, 2], {}],
    ['site-settings.menu.primary.href', SiteSettings, 'menu.primary.href', 'products', {}],
    ['site-settings.analytics.gaId', SiteSettings, 'analytics.gaId', 'UA-1', {}],
    ['seo-defaults.routes.route', SeoDefaults, 'routes.route', 'products', {}],
    ['authors.sameAs.url', Authors, 'sameAs.url', 'http://x.com', {}],
    ['media.alt', Media, 'alt', 'ab', {}],
    ['connections.baseUrl', Connections, 'baseUrl', 'ftp://x', { kind: 'openai-compatible' }],
  ];
  for (const [name, config, path, bad, siblingData] of cases) {
    it(name, () => {
      const validate = validateOf(config, path);
      const refusedAr = validate(bad, { ...ar, siblingData });
      const refusedEn = validate(bad, { ...en, siblingData });
      expect(typeof refusedAr, 'refused').toBe('string');
      expect(ARABIC.test(String(refusedAr)), `Arabic: ${refusedAr}`).toBe(true);
      expect(typeof refusedEn, 'refused').toBe('string');
      expect(ARABIC.test(String(refusedEn)), `English: ${refusedEn}`).toBe(false);
      expect(refusedAr).not.toBe(refusedEn);
    });
  }
  it('an unknown or missing panel language reads English', () => {
    const validate = validateOf(Products, 'slug');
    expect(validate('Bad', { req: {}, siblingData: {} })).toMatch(/Lowercase/);
    expect(validate('Bad', { req: { i18n: { language: 'fr' } }, siblingData: {} })).toMatch(
      /Lowercase/,
    );
    expect(validate('good-slug', ar)).toBe(true);
  });
});

/**
 * Read-only JSON reads as our block (admin audit 2026-09-18, 2.1): Payload's JSON editor
 * loads Monaco from a CDN the admin CSP refuses, so every read-only JSON field of a log row
 * (the runs' rubric, steps and outline, the snapshots' data, the citations' links) carries
 * the `JsonView` field and cell, set by `describeFields()`.
 */
describe('read-only JSON fields render as JsonView (audit 2026-09-18)', () => {
  const expected: Record<string, string[]> = {
    'ai-runs': ['rubric', 'steps', 'outline'],
    metrics: ['data'],
    citations: ['urls', 'competitors'],
  };
  for (const [slug, names] of Object.entries(expected)) {
    it(`${slug}: ${names.join(', ')}`, () => {
      const config = collections.find((c) => c.slug === slug);
      const json = walkFields(config?.fields ?? []).filter(({ field }) => field.type === 'json');
      expect(json.map((f) => f.path)).toEqual(names);
      for (const { field } of json) {
        expect(componentsOf(field)?.Field).toBe(JSON_VIEW_FIELD);
        expect(componentsOf(field)?.Cell).toBe(JSON_VIEW_CELL);
      }
    });
  }
  it('every read-only JSON field of every entity carries it; a hidden or writable one does not', () => {
    for (const c of [...collections, ...globals]) {
      for (const { path, field } of walkFields(c.fields)) {
        if (field.type !== 'json') continue;
        const admin = field.admin ?? {};
        const ours = componentsOf(field)?.Field === JSON_VIEW_FIELD;
        expect(ours, `${c.slug}.${path}`).toBe(admin.readOnly === true && !admin.hidden);
      }
    }
  });
  it('the rule: read-only JSON gets the view, a hidden or editable JSON keeps Payload’s editor, a set component stays', () => {
    const [readOnly, hidden, editable, custom, checkbox] = describeFields(
      [
        { name: 'a', type: 'json', admin: { readOnly: true } },
        { name: 'b', type: 'json', admin: { readOnly: true, hidden: true } },
        { name: 'c', type: 'json' },
        { name: 'd', type: 'json', admin: { readOnly: true, components: { Field: 'x#Y' } } },
        { name: 'e', type: 'checkbox' },
      ],
      {},
    );
    expect(componentsOf(readOnly!)).toEqual({ Field: JSON_VIEW_FIELD, Cell: JSON_VIEW_CELL });
    expect(componentsOf(hidden!)).toBeUndefined();
    expect(componentsOf(editable!)).toBeUndefined();
    expect(componentsOf(custom!)).toEqual({ Field: 'x#Y', Cell: JSON_VIEW_CELL });
    expect(componentsOf(checkbox!)).toEqual({ Cell: BOOL_CELL });
  });
});

/**
 * The forms (admin audit 2026-09-18, section 3): the product's tabs in the card's order with
 * its order number in the sidebar; the post's sidebar in three groups; the site settings'
 * three accessibility labels folded away; both rich-text editors with their toolbars; the
 * topics' CSV import under the list controls; a log row's empty links hidden.
 */
type TabsLike = { tabs: Array<{ name?: string; label: { en: string }; fields: Field[] }> };
type CollapsibleLike = {
  type: string;
  label: { en: string };
  admin?: { initCollapsed?: boolean };
  fields: Field[];
};
const adminOf = (field: Field) =>
  (field as { admin?: Record<string, unknown> }).admin ?? ({} as Record<string, unknown>);
const tabsOf = (config: { fields: Field[] }) =>
  (config.fields[0] as unknown as TabsLike).tabs.map((t) => t.label.en);
const sidebarOf = (config: { fields: Field[] }) =>
  config.fields.filter(
    (f) => (f as { admin?: { position?: string } }).admin?.position === 'sidebar',
  );
const namesIn = (fields: Field[]) => walkFields(fields).map((f) => f.path);

describe('the forms (audit 2026-09-18)', () => {
  it('products: photos first, the order in the sidebar, prices as a row of two', () => {
    expect(tabsOf(Products)).toEqual(['Photos & colours', 'Basics', 'Sizes', 'Print area']);
    expect(sidebarOf(Products).map((f) => ('name' in f ? f.name : f.type))).toEqual([
      'sortOrder',
      'lastSavedBy',
    ]);
    const basics = (Products.fields[0] as unknown as TabsLike).tabs[1]!;
    const priceRow = basics.fields.find(
      (f) => f.type === 'row' && namesIn(f.fields).includes('baseCost'),
    ) as { fields: Field[] };
    expect(namesIn(priceRow.fields)).toEqual(['baseCost', 'suggestedPrice']);
  });

  it('products: the print area label and method default per language', () => {
    const defaults = walkFields(Products.fields)
      .filter(({ path }) => path === 'printArea.label' || path === 'printMethodLabel')
      .map(
        ({ field }) => (field as { defaultValue: (a: { locale: string }) => string }).defaultValue,
      );
    expect(defaults).toHaveLength(2);
    for (const defaultValue of defaults) {
      expect(ARABIC.test(defaultValue({ locale: 'ar' }))).toBe(true);
      expect(ARABIC.test(defaultValue({ locale: 'en' }))).toBe(false);
    }
  });

  it('posts: the sidebar is three collapsibles, Publishing, Checks and Engine', () => {
    const groups = sidebarOf(Posts).filter(
      (f) => f.type === 'collapsible',
    ) as unknown as CollapsibleLike[];
    expect(groups.map((g) => [g.label.en, namesIn(g.fields)])).toEqual([
      ['Publishing', ['author', 'publishedAt', 'contentUpdatedAt']],
      ['Checks', ['warnings', 'warnings.text', 'readingMinutes']],
      ['Engine', ['origin']],
    ]);
  });

  it('site settings: the accessibility labels sit in a collapsed Advanced group', () => {
    const menu = (SiteSettings.fields[0] as unknown as TabsLike).tabs.find(
      (t) => t.name === 'menu',
    )!;
    const advanced = menu.fields.at(-1) as unknown as CollapsibleLike;
    expect(advanced.type).toBe('collapsible');
    expect(advanced.label.en).toBe('Advanced');
    expect(advanced.admin?.initCollapsed).toBe(true);
    expect(namesIn(advanced.fields)).toEqual(['skipLinkLabel', 'menuOpenLabel', 'menuCloseLabel']);
  });

  it('both rich-text editors carry the fixed and the inline toolbar', () => {
    for (const features of [POST_FEATURES, PAGE_TEXT_FEATURES]) {
      const keys = features.map((f) => f.key);
      expect(keys).toContain('toolbarFixed');
      expect(keys).toContain('toolbarInline');
    }
  });

  it('topics: the CSV import sits under the list controls, not above the title', () => {
    const components = AiTopics.admin?.components as {
      beforeList?: string[];
      beforeListTable?: string[];
    };
    expect(components.beforeListTable).toEqual([
      '@/modules/ai-content/admin/import-topics#ImportTopics',
    ]);
    expect(components.beforeList).toBeUndefined();
  });

  it('a read-only link in a sidebar hides while it is empty', () => {
    const links: Array<[{ fields: Field[] }, string]> = [
      [AiRuns, 'connection'],
      [AiRuns, 'topic'],
      [AiRuns, 'post'],
      [AiTopics, 'post'],
      [AiTopics, 'lastRun'],
      [Citations, 'prompt'],
      [Citations, 'connection'],
      [Citations, 'run'],
    ];
    for (const [config, name] of links) {
      const field = walkFields(config.fields).find((f) => f.path === name)?.field;
      const condition = adminOf(field!)['condition'] as
        | ((data: Record<string, unknown>) => boolean)
        | undefined;
      expect(condition, name).toBeDefined();
      expect(condition!({})).toBe(false);
      expect(condition!({ [name]: 12 })).toBe(true);
    }
  });
});

/**
 * A read-only scalar reads as a line (audit 2026-09-18, 2.11, 2.12): every read-only text,
 * number, date, checkbox or select of every entity carries `ReadOnlyLine`, unless a widget
 * of its own is set (the post's warnings, the enabled switch), set by `describeFields()`.
 */
describe('read-only scalars render as ReadOnlyLine (audit 2026-09-18)', () => {
  const scalar = new Set(['text', 'textarea', 'email', 'number', 'date', 'checkbox', 'select']);
  it('every read-only scalar of every entity carries it; an editable one does not', () => {
    let count = 0;
    for (const c of [...collections, ...globals]) {
      for (const { path, field } of walkFields(c.fields)) {
        if (!scalar.has(field.type)) continue;
        const admin = adminOf(field);
        const readOnly = admin['readOnly'] === true && !admin['hidden'];
        const ours = componentsOf(field)?.Field === READ_ONLY_LINE;
        if (readOnly && !ours) {
          expect(componentsOf(field)?.Field, `${c.slug}.${path}: a widget of its own`).toBeTruthy();
        } else {
          expect(ours, `${c.slug}.${path}`).toBe(readOnly);
        }
        if (ours) count += 1;
      }
    }
    // The runs' columns, the connection's summary, the snapshots, the counts, the citations.
    expect(count).toBeGreaterThan(30);
  });
  it('the rule: read-only scalars get the line, editable and hidden ones and a set widget keep theirs', () => {
    const [line, editable, hidden, custom, relationship] = describeFields(
      [
        { name: 'a', type: 'number', admin: { readOnly: true } },
        { name: 'b', type: 'number' },
        { name: 'c', type: 'text', admin: { readOnly: true, hidden: true } },
        { name: 'd', type: 'checkbox', admin: { readOnly: true, components: { Field: 'x#Y' } } },
        { name: 'e', type: 'relationship', relationTo: 'pages', admin: { readOnly: true } },
      ],
      {},
    );
    expect(componentsOf(line!)?.Field).toBe(READ_ONLY_LINE);
    expect(componentsOf(editable!)).toBeUndefined();
    expect(componentsOf(hidden!)).toBeUndefined();
    expect(componentsOf(custom!)?.Field).toBe('x#Y');
    expect(componentsOf(relationship!)).toBeUndefined();
  });
});

describe('dashboard recent list: a title for every row', () => {
  it('shows the title, the id when the title is the id, and the UI language\'s "Untitled" for an empty one', () => {
    expect(titleOf('من نحن', 'Untitled')).toBe('من نحن');
    expect(titleOf(63, 'Untitled')).toBe('63');
    expect(titleOf('', 'Untitled')).toBe('Untitled');
    expect(titleOf('   ', 'Untitled')).toBe('Untitled');
    expect(titleOf(null, 'Untitled')).toBe('Untitled');
    expect(titleOf(undefined, 'بلا عنوان')).toBe('بلا عنوان');
  });

  it('leaves out a draft nobody titled or saved (an abandoned "Create New")', () => {
    expect(isAbandonedDraft({ _status: 'draft' }, '')).toBe(true);
    expect(isAbandonedDraft({ _status: 'draft' }, 'A draft in progress')).toBe(false);
    expect(isAbandonedDraft({ _status: 'draft', lastSavedBy: { name: 'Dhia' } }, '')).toBe(false);
    expect(isAbandonedDraft({ _status: 'published' }, '')).toBe(false);
  });

  it('lists what a person saves: a collection without the saved-by stamp is written by a machine', () => {
    const people = collections.filter(savesByPeople).map((c) => c.slug);
    expect(people).toContain('pages');
    expect(people).toContain('connections');
    expect(people).not.toContain('traffic');
    expect(people).not.toContain('ai-runs');
    // Users carry no stamp (Payload's auth collection); their saves are not "content" either.
    expect(people).not.toContain('users');
  });
});
