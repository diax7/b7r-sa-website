import type { CollectionConfig, Field, GlobalConfig } from 'payload';
import { describe, expect, it } from 'vitest';
import { isAbandonedDraft, savesByPeople, titleOf } from '@/modules/cms/admin/dashboard/data';
import {
  collectionComponents,
  ENTITY_HEADER_PATH,
  FORM_MODIFIED_PATH,
  globalComponents,
} from '@/modules/cms/admin/document/config';
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
  ICON_STRIP,
  ICON_TABS,
  SECTION_LABEL,
  type Described,
  describeFields,
  JSON_VIEW_CELL,
  JSON_VIEW_FIELD,
  READ_ONLY_LINE,
  SHARED_ROWS_NOTE,
  SHARED_ROWS_WITH_TWINS_NOTE,
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
  SECTION_ICONS,
  sectionIcon,
  sectionIconKeyOf,
  GLOBAL_ICONS,
  groupIcon,
  groupKey,
  NAV_SECTIONS,
  navPlacement,
  type ViewSlug,
} from '@/modules/cms/admin/icons';
import { Authors } from '@/modules/cms/collections/authors';
import { Categories } from '@/modules/cms/collections/categories';
import { Faqs } from '@/modules/cms/collections/faqs';
import { Integrations } from '@/modules/cms/collections/integrations';
import { Media } from '@/modules/cms/collections/media';
import { Pages } from '@/modules/cms/collections/pages';
import { POST_FEATURES, Posts, WARNINGS_FIELD } from '@/modules/cms/collections/posts';
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
import { refusedForm } from '@/modules/cms/admin/glossary';
import { Appearance } from '@/modules/brand/global';
import { APPEARANCE_DESCRIPTIONS } from '@/modules/brand/descriptions';
import { Connections } from '@/modules/connections/collection';
import { CONNECTION_DESCRIPTIONS } from '@/modules/connections/descriptions';
import { MESSAGE_DESCRIPTIONS } from '@/modules/inbox/descriptions';
import { Messages } from '@/modules/inbox/messages';
import { Traffic } from '@/modules/traffic/collection';
import { TRAFFIC_DESCRIPTIONS } from '@/modules/traffic/descriptions';
import {
  BILINGUAL_FIELD,
  bilingualPaths,
  isTwinOf,
  TRANSLATIONS,
  twinField,
  twinName,
  twinPaths,
} from '@/modules/cms/fields/bilingual';
import { isStatusColumn, STATUS_CELL, statusColumn } from '@/modules/cms/fields/status';
import { populateGlobalTwins, populateTwins } from '@/modules/cms/fields/twins';
import { applyGlobalTranslations, applyTranslations } from '@/modules/cms/hooks/translations';

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
/** Whether a document's slot lists a locale note (the component PR C of ADR-057 deleted). */
const noteAmong = (slot: unknown): boolean =>
  Array.isArray(slot) && slot.some((c: unknown) => /locale-note|LocaleNote/.test(String(c)));

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
      // Before the document controls: the form-modified sentinel first (the language switch
      // asks before dropping unsaved changes, ADR-056), then an entity's own action (Generate
      // now, Test connection); never the locale note that went with the switch (PR C).
      const before = c.admin?.components?.edit?.beforeDocumentControls;
      expect(before?.[0], 'the sentinel first').toBe(FORM_MODIFIED_PATH);
      expect(noteAmong(before)).toBe(false);
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
      const before = g.admin?.components?.elements?.beforeDocumentControls;
      expect(before?.[0], 'the sentinel first').toBe(FORM_MODIFIED_PATH);
      expect(noteAmong(before)).toBe(false);
      const shows = g.admin?.custom?.['shows'] as { ar?: string; en?: string } | undefined;
      expect(shows?.en, 'shows.en').toBeTruthy();
      expect(ARABIC.test(shows?.ar ?? ''), 'shows.ar').toBe(true);
    });
  }
  it("the document helpers register the description slot, the sentinel and the entity's own actions after it", () => {
    expect(collectionComponents('pages')).toEqual({
      Description: {
        path: ENTITY_HEADER_PATH,
        serverProps: { entity: { type: 'collections', slug: 'pages' } },
      },
      edit: { beforeDocumentControls: [FORM_MODIFIED_PATH] },
    });
    expect(
      collectionComponents('ai-topics', { beforeDocumentControls: ['x#GenerateNow'] }).edit,
    ).toEqual({ beforeDocumentControls: [FORM_MODIFIED_PATH, 'x#GenerateNow'] });
    expect(globalComponents('home')).toEqual({
      elements: {
        Description: {
          path: ENTITY_HEADER_PATH,
          serverProps: { entity: { type: 'globals', slug: 'home' } },
        },
        beforeDocumentControls: [FORM_MODIFIED_PATH],
      },
    });
  });
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

/**
 * Every named field of a config at any depth, with its path (the description maps' keys).
 * The status column (ADR-060) is Payload's own `_status`, merged over its base at sanitize:
 * not a field of ours, so the censuses leave it out (`describe('the status column')` reads it).
 */
function walkFields(fields: Field[], path = ''): Array<{ path: string; field: Field }> {
  const out: Array<{ path: string; field: Field }> = [];
  for (const f of fields) {
    if (isStatusColumn(f)) continue;
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
    [Messages, MESSAGE_DESCRIPTIONS],
    [Appearance, APPEARANCE_DESCRIPTIONS],
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

/**
 * The description rule (the 2026-09-19 words pass, `.claude/rules/admin-ui.md` rule 4): one
 * sentence of what the field does on the site and where, then the limit or an example;
 * nothing the label already says, nothing about how it is stored; an Arabic sentence that
 * says where the value shows opens with its verb («يظهر تحت العنوان»), never with a bare
 * place preposition. Four cheap gates over every description an editor sees (fields, tabs,
 * collapsibles, the entity's own): a cap of 140 characters in each language (two lines
 * under a field on a 400 px column) measured on the rendered text, with the shared-rows
 * note the mechanism appends to a bilingual list as the list's allowance; never opening
 * with the label's own noun; never a storage word; never a place fragment in Arabic.
 */
const DESCRIPTION_CAP = 140;

/** A path whose sentence must carry both a limit and an example, and the reason. */
const CAP_EXCEPTIONS: Record<string, string> = {};

interface Sentence {
  where: string;
  label?: Pair;
  description: Pair;
}
type Pair = { ar: string; en: string };

const pairOf = (value: unknown): Pair | undefined => {
  if (typeof value !== 'object' || value === null) return undefined;
  const { ar, en } = value as { ar?: unknown; en?: unknown };
  return typeof ar === 'string' && typeof en === 'string' ? { ar, en } : undefined;
};

/** Every description of a config with the label it sits under, tabs and collapsibles included. */
function sentences(slug: string, fields: Field[], path = ''): Sentence[] {
  const out: Sentence[] = [];
  const add = (where: string, label: unknown, description: unknown) => {
    const d = pairOf(description);
    if (d) out.push({ where: `${slug}.${where}`, description: d, ...labelled(label) });
  };
  const labelled = (label: unknown): { label?: Pair } => {
    const l = pairOf(label);
    return l ? { label: l } : {};
  };
  for (const f of fields) {
    if (f.type === 'tabs') {
      for (const t of f.tabs) {
        const named = 'name' in t && t.name ? `${path}${t.name}` : `${path}[tab]`;
        add(named, t.label, t.description);
        out.push(...sentences(slug, t.fields, 'name' in t && t.name ? `${path}${t.name}.` : path));
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
        add(`${path}[collapsible]`, f.label, adminBlock(f)['description']);
      out.push(...sentences(slug, f.fields, path));
      continue;
    }
    if (!('name' in f) || !f.name) continue;
    const name = `${path}${f.name}`;
    add(name, (f as { label?: unknown }).label, adminBlock(f)['description']);
    if ('fields' in f && Array.isArray(f.fields))
      out.push(...sentences(slug, f.fields, `${name}.`));
    if ('blocks' in f) {
      for (const b of f.blocks) out.push(...sentences(slug, b.fields, `${name}.${b.slug}.`));
    }
  }
  return out;
}

const adminBlock = (f: Field): Record<string, unknown> =>
  ((f as { admin?: Record<string, unknown> }).admin ?? {}) as Record<string, unknown>;

/**
 * What a list may exceed the cap by: the shared-rows note the mechanism appends (and the
 * space before it), when the rendered text ends with one; the field's own sentence stays
 * under the cap either way.
 */
function noteAllowance(text: string, language: keyof Pair): number {
  for (const note of [SHARED_ROWS_WITH_TWINS_NOTE, SHARED_ROWS_NOTE]) {
    if (text.endsWith(note[language])) return note[language].length + 1;
  }
  return 0;
}

/**
 * The place prepositions an Arabic description never opens with: the sentence says where
 * the value shows, so it opens with its verb («يظهر تحت», «تظهر في», «يعلو»). «من» and
 * «بين» stay allowed: a range or a spec starts with them («من صفر إلى 5»). Keyed on the
 * first token by design: a place after a colon or a verb passes unseen («يظهر: في
 * البطاقة»), and that is fine, since the shapes in use are covered; widening the pattern
 * into the sentence would refuse every «يظهر في …» as a false positive.
 */
const PLACE_FRAGMENT = /^(في|تحت|فوق|خلف|بجانب|أمام|على|عند|داخل|ضمن)\s/;

const DIACRITICS = /[\u064B-\u0652\u0670\u0640]/g;
const LEADING_QUOTES = /^[\s"'“”«»‘’]+/;

/** The word a label or a description opens with, the article and the possessive off. */
function firstWord(text: string, language: keyof Pair): string {
  const clean = text.replace(LEADING_QUOTES, '');
  if (language === 'en') {
    const word = clean.replace(/^(the|a|an)\s+/i, '').split(/[\s:;,.()"'“”«»]+/)[0] ?? '';
    return word
      .toLowerCase()
      .replace(/['’]s$/, '')
      .replace(/s$/, '');
  }
  const word = clean.replace(DIACRITICS, '').split(/[\s:;،؛.()"'“”«»]+/)[0] ?? '';
  return word.replace(/^ال/, '');
}

/** The storage words a description never says, in both languages, as whole words. */
const STORAGE_WORDS: Record<keyof Pair, RegExp[]> = {
  en: [/\b(stored|database|tables?|columns?)\b/i],
  ar: ['يخزن', 'تخزن', 'مخزن', 'قاعدة البيانات', 'جدول', 'عمود'].map(refusedForm),
};

describe('the description rule (2026-09-19): one sentence, the cap, nothing the label says, no storage', () => {
  const all = [...collections, ...globals].flatMap((c) => sentences(c.slug, c.fields ?? []));
  const entityOwn = [...collections, ...globals].flatMap((c) => {
    const d = pairOf(c.admin?.description);
    return d ? [{ where: `${c.slug}.admin.description`, description: d }] : [];
  });

  it('reads every description of every entity', () => {
    expect(all.length).toBeGreaterThan(350);
    expect(entityOwn.length).toBe(collections.length + globals.length);
  });

  it(`keeps every description under ${DESCRIPTION_CAP} characters in each language as rendered, a list's note allowed, exceptions named`, () => {
    const over = [...all, ...entityOwn].flatMap(({ where, description }) =>
      (['en', 'ar'] as const)
        .map((language) => ({ language, text: description[language] }))
        .filter(
          ({ language, text }) => text.length > DESCRIPTION_CAP + noteAllowance(text, language),
        )
        .filter(() => !(where in CAP_EXCEPTIONS))
        .map(({ language, text }) => `${where} (${language}, ${text.length}): ${text}`),
    );
    expect(over).toEqual([]);
    for (const [path, reason] of Object.entries(CAP_EXCEPTIONS)) {
      expect(reason.length, `${path}: a reason`).toBeGreaterThan(10);
      expect(
        all.some((s) => s.where === path),
        `${path}: names a field`,
      ).toBe(true);
    }
  });

  it("never opens with the label's own noun, in either language", () => {
    const echoes = all
      .filter((s): s is Sentence & { label: Pair } => s.label !== undefined)
      .flatMap(({ where, label, description }) =>
        (['en', 'ar'] as const)
          .filter((language) => {
            const noun = firstWord(label[language], language);
            return noun.length > 1 && noun === firstWord(description[language], language);
          })
          .map(
            (language) => `${where} (${language}): «${label[language]}» / ${description[language]}`,
          ),
      );
    expect(echoes).toEqual([]);
  });

  it('an Arabic sentence that says where opens with its verb, never a bare place preposition', () => {
    const fragments = [...all, ...entityOwn]
      .filter(({ description }) => PLACE_FRAGMENT.test(description.ar))
      .map(({ where, description }) => `${where}: ${description.ar}`);
    expect(fragments).toEqual([]);
    expect(PLACE_FRAGMENT.test('في البطاقة، وعنوان صفحته.')).toBe(true);
    expect(PLACE_FRAGMENT.test('عند الإيقاف يختفي القسم.')).toBe(true);
    expect(PLACE_FRAGMENT.test('يظهر في البطاقة.')).toBe(false);
    expect(PLACE_FRAGMENT.test('من صفر إلى 5؛ بلا شارات يختفي الصف.')).toBe(false);
    expect(PLACE_FRAGMENT.test('فيه كلمة واحدة.')).toBe(false);
  });

  it('never says how a thing is stored', () => {
    const storage = [...all, ...entityOwn].flatMap(({ where, description }) =>
      (['en', 'ar'] as const)
        .filter((language) => {
          const text = language === 'ar' ? description.ar.replace(DIACRITICS, '') : description.en;
          return STORAGE_WORDS[language].some((re) => re.test(text));
        })
        .map((language) => `${where} (${language}): ${description[language]}`),
    );
    expect(storage).toEqual([]);
  });

  it('the label-noun check reads through articles, quotes and plurals', () => {
    expect(firstWord('The colours of the product', 'en')).toBe('colour');
    expect(firstWord('Colours', 'en')).toBe('colour');
    expect(firstWord('"Policies" list of the footer', 'en')).toBe('policie');
    expect(firstWord("The merchant's words", 'en')).toBe('merchant');
    expect(firstWord('الألوان', 'ar')).toBe('ألوان');
    expect(firstWord('ألوان المنتج: مربعات', 'ar')).toBe('ألوان');
    expect(firstWord('«لماذا بحر» فوق', 'ar')).toBe('لماذا');
    expect(firstWord('مفعّل: يظهر', 'ar')).toBe('مفعل');
  });
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
  it('the steps in order: a read-only localized text is a line, never a twin; a widget of its own wins', () => {
    const fields: Field[] = [
      { name: 'a', type: 'text', localized: true, admin: { readOnly: true } },
      { name: 'b', type: 'text', localized: true },
      { name: 'c', type: 'text', localized: true, admin: { components: { Field: 'x#Y' } } },
    ];
    const [line, twin, custom] = describeFields(fields, {});
    expect(componentsOf(line!)?.Field).toBe(READ_ONLY_LINE);
    expect(componentsOf(twin!)?.Field).toBe(BILINGUAL_FIELD);
    expect(componentsOf(custom!)?.Field).toBe('x#Y');
    // The hook's allow-list agrees: only the twin is a bilingual path.
    expect(bilingualPaths(fields)).toEqual(['b']);
  });
});

/**
 * Side-by-side bilingual editing (ADR-057): `describeFields` renders every localized light
 * field (text, textarea, select, number) with `BilingualField`, outside a list and inside
 * the rows of arrays and blocks alike (PR A), and adds the hidden `translations` JSON to a
 * config that has any; such a config lists the apply hook after its own. A localized heavy
 * field (rich text, upload) is covered by the twin that follows it in the config (PR B), and
 * such a config lists the population hook. There is no locale switch to fall back on (PR C):
 * the census gate below names any localized field left without a pair.
 */
type Placed = {
  path: string;
  field: Field;
  inList: boolean;
  inLocalizedList: boolean;
  /** The field right after this one in the same list (a twin must follow its original). */
  next: Field | undefined;
};

function everyField(fields: Field[], path = '', inList = false, inLocalized = false): Placed[] {
  const out: Placed[] = [];
  for (const [i, f] of fields.entries()) {
    if (f.type === 'tabs') {
      for (const t of f.tabs) {
        const next = 'name' in t && t.name ? `${path}${t.name}.` : path;
        out.push(...everyField(t.fields, next, inList, inLocalized));
      }
      continue;
    }
    if (f.type === 'ui') continue;
    if (
      f.type === 'row' ||
      f.type === 'collapsible' ||
      (f.type === 'group' && !('name' in f && f.name))
    ) {
      out.push(...everyField(f.fields, path, inList, inLocalized));
      continue;
    }
    if (!('name' in f) || !f.name) continue;
    const name = `${path}${f.name}`;
    out.push({ path: name, field: f, inList, inLocalizedList: inLocalized, next: fields[i + 1] });
    const isList = f.type === 'array' || f.type === 'blocks';
    const list = inList || isList;
    const localized = inLocalized || (isList && (f as { localized?: boolean }).localized === true);
    if ('fields' in f && Array.isArray(f.fields)) {
      out.push(...everyField(f.fields, `${name}.`, list, localized));
    }
    if ('blocks' in f) {
      for (const b of f.blocks) {
        out.push(...everyField(b.fields, `${name}.${b.slug}.`, list, localized));
      }
    }
  }
  return out;
}

const widgetOf = (f: Field) =>
  (f as { admin?: { components?: { Field?: unknown } } }).admin?.components?.Field;
const descriptionOf = (f: Field | undefined) =>
  (f as { admin?: { description?: { ar?: string; en?: string } } } | undefined)?.admin?.description;
const LIGHT = ['text', 'textarea', 'select', 'number'];
const HEAVY = new Set(['richText', 'upload']);
/** A field named by its entity: what the census lists. */
const placedName = (p: Placed & { slug: string }) => `${p.slug}.${p.path}`;

/** A localized light field an editor can type in: what the rule says must be bilingual. */
function editableLight(p: Placed): boolean {
  const f = p.field as { localized?: boolean; hasMany?: boolean; admin?: Record<string, unknown> };
  const admin = f.admin ?? {};
  return (
    LIGHT.includes(p.field.type) &&
    f.localized === true &&
    !f.hasMany &&
    !admin['hidden'] &&
    !admin['readOnly'] &&
    !admin['disabled'] &&
    !p.inLocalizedList
  );
}

describe('side-by-side bilingual editing (ADR-057)', () => {
  it('describeFields attaches the component to localized light fields, inside rows and blocks too; a twin is never touched; a list localized as a whole stays out', () => {
    const body: Field = { name: 'body', type: 'richText', localized: true };
    const fields: Field[] = [
      { name: 'title', type: 'text', localized: true },
      { name: 'excerpt', type: 'textarea', localized: true },
      { name: 'kind', type: 'select', localized: true, options: ['a'] },
      { name: 'stock', type: 'number', localized: true },
      { name: 'slug', type: 'text' },
      body,
      twinField(body as Extract<Field, { type: 'richText' }>),
      { name: 'cover', type: 'upload', relationTo: 'media', localized: true },
      { name: 'hub', type: 'relationship', relationTo: 'categories', localized: true },
      {
        name: 'warnings',
        type: 'array',
        localized: true,
        fields: [{ name: 'text', type: 'text' }],
      },
      { name: 'items', type: 'array', fields: [{ name: 'text', type: 'text', localized: true }] },
      {
        name: 'blocks',
        type: 'blocks',
        blocks: [
          {
            slug: 'cards',
            fields: [
              { name: 'title', type: 'text', localized: true },
              { name: 'content', type: 'richText', localized: true },
              {
                name: 'rows',
                type: 'array',
                fields: [{ name: 'question', type: 'text', localized: true }],
              },
            ],
          },
        ],
      },
      { name: 'seo', type: 'group', fields: [{ name: 'title', type: 'text', localized: true }] },
    ];
    const described = describeFields(fields, {});
    const placed = everyField(described);
    const attached = placed.filter((p) => widgetOf(p.field) === BILINGUAL_FIELD).map((p) => p.path);
    expect(attached).toEqual([
      'title',
      'excerpt',
      'kind',
      'stock',
      'items.text',
      'blocks.cards.title',
      'blocks.cards.rows.question',
      'seo.title',
    ]);
    expect(described.at(-1)).toMatchObject({
      name: TRANSLATIONS,
      type: 'json',
      admin: { hidden: true },
    });
    // The twin keeps its own component slots and description; the pass adds nothing to it.
    const twin = placed.find((p) => p.path === 'bodyTwin')!.field;
    expect(widgetOf(twin)).toBeUndefined();
    expect(descriptionOf(twin)?.en).toMatch(/one Save writes both/);
    expect(twinPaths(described)).toEqual(['body']);
    // A list whose rows are bilingual says what duplicating a row does; the other lists do not.
    const noteOn = (path: string) => descriptionOf(placed.find((p) => p.path === path)?.field)?.en;
    expect(noteOn('items')).toBe(SHARED_ROWS_NOTE.en);
    expect(noteOn('blocks')).toBe(SHARED_ROWS_NOTE.en);
    expect(noteOn('blocks.cards.rows')).toBe(SHARED_ROWS_NOTE.en);
    expect(noteOn('warnings')).toBeUndefined();
    // A list whose rows hold a twin says the copy keeps the English under a field.
    const photo: Field = { name: 'photo', type: 'upload', relationTo: 'media', localized: true };
    const [withTwin] = describeFields(
      [
        {
          name: 'slides',
          type: 'array',
          fields: [
            { name: 'caption', type: 'text', localized: true },
            photo,
            twinField(photo as Extract<Field, { type: 'upload' }>),
          ],
        },
      ],
      {},
    );
    expect(descriptionOf(withTwin)).toEqual(SHARED_ROWS_WITH_TWINS_NOTE);
    // The note follows the map's own sentence on the list.
    const [withOwn] = describeFields(
      [{ name: 'items', type: 'array', fields: [{ name: 'text', type: 'text', localized: true }] }],
      { items: { ar: 'قائمة النقاط في الصفحة.', en: 'The list of points on the page.' } },
    );
    expect(descriptionOf(withOwn)).toEqual({
      ar: `قائمة النقاط في الصفحة. ${SHARED_ROWS_NOTE.ar}`,
      en: `The list of points on the page. ${SHARED_ROWS_NOTE.en}`,
    });
    // A config without a localized text carries neither the component nor the JSON.
    const plain = describeFields([{ name: 'slug', type: 'text' }], {});
    expect(plain.some((f) => 'name' in f && f.name === TRANSLATIONS)).toBe(false);
  });

  const configs: Array<{ slug: string; fields: Field[]; hooks?: { afterChange?: unknown[] } }> = [
    ...collections.filter((c) => c.slug !== 'redirects'),
    ...globals,
  ].map((c) => ({ slug: c.slug, fields: c.fields, hooks: c.hooks as { afterChange?: unknown[] } }));
  for (const c of configs) {
    it(`${c.slug}: the component sits on exactly the bilingual paths; the JSON and the hook go together`, () => {
      const placed = everyField(c.fields);
      const attached = placed.filter((p) => widgetOf(p.field) === BILINGUAL_FIELD);
      expect(attached.map((p) => p.path).toSorted()).toEqual(bilingualPaths(c.fields).toSorted());
      for (const p of attached) {
        expect(LIGHT, p.path).toContain(p.field.type);
        expect((p.field as { localized?: boolean }).localized, p.path).toBe(true);
        expect(p.inLocalizedList, p.path).toBe(false);
      }
      // The rule the other way round: every editable localized light field is bilingual,
      // inside rows too, unless it has a widget of its own.
      const owed = placed
        .filter((p) => editableLight(p) && widgetOf(p.field) === undefined)
        .map((p) => p.path);
      expect(owed).toEqual([]);
      const carried = placed.some((p) => p.path === TRANSLATIONS);
      expect(carried).toBe(attached.length > 0);
      const hooks = c.hooks?.afterChange ?? [];
      const hooked = hooks.includes(applyTranslations) || hooks.includes(applyGlobalTranslations);
      expect(hooked, 'applyTranslations in hooks.afterChange').toBe(carried);
      // A twin never wears the component, and a config with a twin lists the population hook.
      const originals = placed.filter((p) => isTwinOf(p.next, p.field));
      for (const p of originals) {
        const twin = placed.find((o) => o.field === p.next)!;
        expect(widgetOf(twin.field), twin.path).toBeUndefined();
      }
      const reads = (c.hooks as { beforeRead?: unknown[] } | undefined)?.beforeRead ?? [];
      const populates = reads.includes(populateTwins) || reads.includes(populateGlobalTwins);
      expect(populates, 'populateTwins in hooks.beforeRead').toBe(originals.length > 0);
    });
  }

  /**
   * The census gate of PR C (`docs/plans/2026-09-18-no-locale-switch.md`): the locale switch
   * may go only when every localized field shows both languages. Across the 23 configs each
   * one is a light field wearing `BilingualField`, a heavy field followed by its `<name>Twin`
   * with the same editor or collection, or a read-only fact whose widget shows the other
   * language under the open one (`ReadOnlyLine`, `WarningsField`: the post's `readingMinutes`
   * and `warnings`, the one list localized as a whole, both written by the post's own
   * `beforeChange` for the language of each write). Anything else is listed by name so the
   * failure says what remains.
   */
  it('the census gate (PR C): 134 localized fields show both languages, 128 light ones paired (56 inside rows), the four heavy ones by their twins, the two facts of the post by their widgets; nothing remains; no list is localized as a whole but the warnings', () => {
    const placed = configs.flatMap((c) =>
      everyField(c.fields).map((p) => ({ ...p, slug: c.slug })),
    );
    const localized = placed.filter(
      (p) => !p.inLocalizedList && (p.field as { localized?: boolean }).localized === true,
    );
    const pairedLight = localized.filter(
      (p) => LIGHT.includes(p.field.type) && widgetOf(p.field) === BILINGUAL_FIELD,
    );
    const pairedHeavy = localized.filter(
      (p) => HEAVY.has(p.field.type) && isTwinOf(p.next, p.field),
    );
    // The booking settings (ADR-062) added the consultation's name and a closed date's reason;
    // the booker (ADR-063) its blurb.
    expect(pairedLight.length).toBe(128);
    expect(pairedLight.filter((p) => p.inList).length).toBe(56);
    expect(pairedHeavy.map(placedName)).toEqual([
      'pages.blocks.richText.content',
      'posts.body',
      'home.hero.slides.imageDesktop',
      'home.hero.slides.imageMobile',
    ]);
    for (const p of pairedHeavy) {
      expect((p.next as { name?: string }).name).toBe(twinName((p.field as { name: string }).name));
    }
    expect(twinPaths(Pages.fields)).toEqual(['blocks.richText.content']);
    expect(twinPaths(Posts.fields)).toEqual(['body']);
    expect(twinPaths(Home.fields)).toEqual(['hero.slides.imageDesktop', 'hero.slides.imageMobile']);
    // The read-only facts: their widgets show the other language under the open one.
    const pairedFacts = localized.filter(
      (p) =>
        (p.field as { admin?: { readOnly?: boolean } }).admin?.readOnly === true &&
        [READ_ONLY_LINE, WARNINGS_FIELD].includes(String(widgetOf(p.field))),
    );
    expect(pairedFacts.map((p) => `${placedName(p)} (${String(widgetOf(p.field))})`)).toEqual([
      `posts.warnings (${WARNINGS_FIELD})`,
      `posts.readingMinutes (${READ_ONLY_LINE})`,
    ]);
    // Nothing remains. A localized field that lands here has no place that shows its other
    // language (a heavy field without its twin, a light field with a widget of its own, a
    // hasMany, a relationship, a list localized as a whole), and no switch reaches it.
    const paired = new Set([...pairedLight, ...pairedHeavy, ...pairedFacts]);
    const remaining = localized.filter((p) => !paired.has(p));
    expect(remaining.map((p) => `${placedName(p)} (${p.field.type})`)).toEqual([]);
    const wholeLists = placed
      .filter(
        (p) =>
          (p.field.type === 'array' || p.field.type === 'blocks') &&
          (p.field as { localized?: boolean }).localized === true,
      )
      .map(placedName);
    expect(wholeLists).toEqual(['posts.warnings']);
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

/**
 * The section icons (ADR-060): every tab of every tabs field and every collapsible names
 * one icon of `SECTION_ICONS` through `sectionIcon()`, a labelled group may; no icon
 * repeats inside one strip and none repeats the entity's own icon (the header's tile).
 * `describeFields()` places the `ui` field that draws the tabs' icons right after every
 * tabs field, with the keys in order, and the label widget on every collapsible or group
 * that names an icon; a widget the config set stays.
 */
interface Section {
  kind: 'tabs' | 'collapsible' | 'group';
  where: string;
  field: Field;
  /** The field right after it at the same level (the strip a tabs field must be followed by). */
  next: Field | undefined;
}

function sectionsOf(fields: Field[], path = ''): Section[] {
  const out: Section[] = [];
  fields.forEach((f, i) => {
    const next = fields[i + 1];
    if (f.type === 'tabs') {
      out.push({ kind: 'tabs', where: `${path}[tabs]`, field: f, next });
      for (const t of f.tabs) {
        out.push(...sectionsOf(t.fields, 'name' in t && t.name ? `${path}${t.name}.` : path));
      }
      return;
    }
    if (f.type === 'collapsible') {
      out.push({ kind: 'collapsible', where: `${path}[collapsible]`, field: f, next });
      out.push(...sectionsOf(f.fields, path));
      return;
    }
    if (f.type === 'row') {
      out.push(...sectionsOf(f.fields, path));
      return;
    }
    if (f.type === 'group') {
      const named = 'name' in f && f.name ? `${path}${f.name}` : `${path}[group]`;
      if (f.label) out.push({ kind: 'group', where: named, field: f, next });
      out.push(...sectionsOf(f.fields, 'name' in f && f.name ? `${named}.` : path));
      return;
    }
    if ('fields' in f && Array.isArray(f.fields) && 'name' in f) {
      out.push(...sectionsOf(f.fields, `${path}${f.name}.`));
    }
    if ('blocks' in f) {
      for (const b of f.blocks) out.push(...sectionsOf(b.fields, `${path}${f.name}.${b.slug}.`));
    }
  });
  return out;
}

const labelOf = (field: Field) =>
  (field as { admin?: { components?: { Label?: unknown } } }).admin?.components?.Label;

describe('section icons (ADR-060)', () => {
  const entities: Array<{ type: 'collections' | 'globals'; slug: string; fields: Field[] }> = [
    ...collections
      .filter((c) => c.slug !== 'redirects')
      .map((c) => ({ type: 'collections' as const, slug: c.slug, fields: c.fields })),
    ...globals.map((g) => ({ type: 'globals' as const, slug: g.slug, fields: g.fields })),
  ];
  for (const e of entities) {
    const sections = sectionsOf(e.fields);
    if (sections.length === 0) continue;
    it(`${e.slug}: every tab and collapsible names an icon, no icon twice in a strip, never the entity's own`, () => {
      const own = entityIcon(e.type, e.slug);
      for (const s of sections) {
        if (s.kind === 'tabs' && s.field.type === 'tabs') {
          // A partial set cannot ship: the tab without a key is named.
          const unkeyed = s.field.tabs
            .filter((t) => !sectionIconKeyOf(t.admin))
            .map((t) => ('name' in t && t.name) || pairOf(t.label)?.en || '[tab]');
          expect(unkeyed, `${e.slug}.${s.where}: tabs without an icon`).toEqual([]);
          const keys = s.field.tabs.map((t) => sectionIconKeyOf(t.admin));
          expect(new Set(keys).size, `${e.slug}.${s.where}: an icon repeated in the strip`).toBe(
            keys.length,
          );
          for (const key of keys) {
            expect(
              SECTION_ICONS[key!],
              `${e.slug}.${s.where}: ${key} repeats the entity's icon`,
            ).not.toBe(own);
          }
          // The strip that draws them follows, keys in order, the widget on it.
          const strip = s.next as
            | {
                name?: string;
                type?: string;
                admin?: { custom?: { icons?: unknown }; components?: { Field?: unknown } };
              }
            | undefined;
          expect(strip?.type, `${e.slug}.${s.where}: no strip after the tabs`).toBe('ui');
          expect(strip?.name).toBe(ICON_STRIP);
          expect(strip?.admin?.custom?.icons).toEqual(keys);
          expect(strip?.admin?.components?.Field).toBe(ICON_TABS);
        }
        if (s.kind === 'collapsible') {
          expect(
            sectionIconKeyOf(s.field.admin),
            `${e.slug}.${s.where}: a collapsible without an icon`,
          ).not.toBeNull();
          expect(labelOf(s.field), `${e.slug}.${s.where}: the label widget`).toBe(SECTION_LABEL);
        }
        if (s.kind === 'group') {
          const key = sectionIconKeyOf(s.field.admin);
          expect(labelOf(s.field), `${e.slug}.${s.where}: the label widget follows the icon`).toBe(
            key ? SECTION_LABEL : undefined,
          );
        }
      }
    });
  }

  it('the registry: every key names a lucide icon; sectionIcon() writes admin.custom.icon', () => {
    for (const [key, icon] of Object.entries(SECTION_ICONS)) expect(isIcon(icon), key).toBe(true);
    expect(sectionIcon('photos')).toEqual({ custom: { icon: 'photos' } });
    expect(sectionIconKeyOf(sectionIcon('sizes'))).toBe('sizes');
    expect(sectionIconKeyOf({ custom: { icon: 'nope' } })).toBeNull();
    expect(sectionIconKeyOf(undefined)).toBeNull();
  });

  it('describeFields: the strip follows the tabs with the keys in order (null where none), labels go where an icon is named, a set widget stays', () => {
    const out = describeFields(
      [
        {
          type: 'tabs',
          tabs: [
            { label: { ar: 'أ', en: 'A' }, admin: sectionIcon('photos'), fields: [] },
            { label: { ar: 'ب', en: 'B' }, fields: [] },
          ],
        },
        {
          type: 'collapsible',
          label: { ar: 'ج', en: 'C' },
          admin: sectionIcon('checks'),
          fields: [],
        },
        { type: 'collapsible', label: { ar: 'د', en: 'D' }, fields: [] },
        {
          type: 'collapsible',
          label: { ar: 'ه', en: 'E' },
          admin: { ...sectionIcon('engine'), components: { Label: 'x#Y' } },
          fields: [],
        },
        {
          name: 'g',
          type: 'group',
          label: { ar: 'و', en: 'F' },
          admin: sectionIcon('phone'),
          fields: [],
        },
      ],
      {},
    );
    expect(out.map((f) => f.type)).toEqual([
      'tabs',
      'ui',
      'collapsible',
      'collapsible',
      'collapsible',
      'group',
    ]);
    const strip = out[1] as { admin?: { custom?: unknown; components?: unknown } };
    expect(strip.admin?.custom).toEqual({ icons: ['photos', null] });
    expect(strip.admin?.components).toEqual({ Field: ICON_TABS });
    expect(labelOf(out[2]!)).toBe(SECTION_LABEL);
    expect(labelOf(out[3]!)).toBeUndefined();
    expect(labelOf(out[4]!)).toBe('x#Y');
    expect(labelOf(out[5]!)).toBe(SECTION_LABEL);
  });
});

/**
 * The status column (ADR-060): every drafted collection lists `statusColumn()`: our cell
 * and Payload's own name, type and label key (sanitize runs before the merge and would
 * stamp a label from the name), the options and `Field: false` staying Payload's through
 * `mergeBaseFields`; a collection without drafts has none; the runs' outcome carries the
 * same cell.
 */
describe('the status column (ADR-060)', () => {
  const drafted = collections.filter(
    (c) => c.versions && typeof c.versions === 'object' && c.versions.drafts,
  );
  it('the four drafted collections carry it, no other does', () => {
    expect(drafted.map((c) => c.slug).toSorted()).toEqual([
      'pages',
      'posts',
      'products',
      'testimonials',
    ]);
    for (const c of collections) {
      const column = c.fields.find(isStatusColumn);
      if (drafted.includes(c)) {
        expect(Object.keys(column ?? {}).toSorted(), c.slug).toEqual(
          Object.keys(statusColumn()).toSorted(),
        );
        expect(column, c.slug).toMatchObject({ admin: { components: { Cell: STATUS_CELL } } });
      } else {
        expect(column, c.slug).toBeUndefined();
      }
    }
  });
  it("carries the cell and Payload's own name, type and label key, nothing else", () => {
    // The key set is pinned because `mergeBaseFields` deep-merges the config's field over
    // Payload's base (`fields/mergeBaseFields.js:20-22`): a key placed here wins over
    // Payload's (an array is appended to Payload's), which is why `options` never appears.
    const column = statusColumn() as { label: (a: { t: (k: string) => string }) => string };
    expect(Object.keys(column).toSorted()).toEqual(['admin', 'label', 'name', 'type']);
    expect(column).toMatchObject({
      name: '_status',
      type: 'select',
      admin: { components: { Cell: STATUS_CELL } },
    });
    expect(column.label({ t: (k) => `<${k}>` })).toBe('<version:status>');
  });
  it("the runs' outcome and a message's state read through the same cell", () => {
    for (const config of [AiRuns, Messages]) {
      const status = walkFields(config.fields).find((f) => f.path === 'status')!.field;
      expect(componentsOf(status)?.Cell, config.slug).toBe(STATUS_CELL);
    }
  });
});

/**
 * The inbox (ADR-061): a section first in Site with its own icon, the messages placed in
 * it, the columns that answer "which one is this?", the status as a pill with three words,
 * the sender's fields read-only and refused to every update, the two working fields open.
 */
describe('the inbox (ADR-061)', () => {
  const fields = walkFields(Messages.fields);
  const fieldOf = (path: string) =>
    fields.find((f) => f.path === path)?.field as Field & {
      access?: { update?: unknown };
      admin?: { readOnly?: boolean; position?: string };
    };
  it('is a section of Site, first, with its own icon, the messages inside it', () => {
    expect(NAV_SECTIONS.inbox).toMatchObject({ ar: 'الوارد', en: 'Inbox', place: 'first' });
    expect(NAV_SECTIONS.engine.place).toBe('last');
    expect(isIcon(NAV_SECTIONS.inbox.icon)).toBe(true);
    expect(NAV_SECTIONS.inbox.icon).not.toBe(ADMIN_GROUPS.site.icon);
    expect(NAV_SECTIONS.inbox.icon).not.toBe(COLLECTION_ICONS.messages);
    expect(navPlacement('collections', 'messages')).toEqual({
      group: 'site',
      order: 0,
      section: 'inbox',
    });
  });
  it('lists name, inquiry, status and created, newest first, searchable by name, e-mail and phone', () => {
    expect(Messages.admin?.defaultColumns).toEqual(['name', 'inquiry', 'status', 'createdAt']);
    expect(Messages.admin?.listSearchableFields).toEqual(['name', 'email', 'phone']);
    expect(Messages.admin?.useAsTitle).toBe('name');
    expect(Messages.defaultSort).toBe('-createdAt');
    expect(Messages.admin?.hidden).toBeUndefined();
  });
  it("the status is the three glossary words as a pill; the sender's fields are lines nobody rewrites", () => {
    const status = fieldOf('status') as ReturnType<typeof fieldOf> & {
      options: Array<{ value: string; label: unknown }>;
    };
    expect(status.options.map((o) => o.value)).toEqual(['new', 'following', 'handled']);
    expect(status.options.map((o) => o.label)).toEqual([
      { ar: 'جديد', en: 'New' },
      { ar: 'قيد المتابعة', en: 'Following' },
      { ar: 'معالَج', en: 'Handled' },
    ]);
    expect(status.access?.update).toBeUndefined();
    expect(fieldOf('notes').access?.update).toBeUndefined();
    for (const path of [
      'name',
      'phone',
      'email',
      'inquiry',
      'locale',
      'message',
      'emailed',
      'page',
      'utm.source',
      'utm.medium',
      'utm.campaign',
    ]) {
      const field = fieldOf(path);
      expect(field.admin?.readOnly, `${path} read-only`).toBe(true);
      expect(componentsOf(field)?.Field, `${path} as a line`).toBe(READ_ONLY_LINE);
      const refuse = field.access?.update as (() => boolean) | undefined;
      expect(refuse?.(), `${path} refuses every update`).toBe(false);
    }
    expect(componentsOf(fieldOf('emailed'))?.Cell).toBe(BOOL_CELL);
  });
});
