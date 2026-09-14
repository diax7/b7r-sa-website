import type { CollectionConfig, Field, GlobalConfig } from 'payload';
import { describe, expect, it } from 'vitest';
import { isAbandonedDraft, titleOf } from '@/modules/cms/admin/dashboard/data';
import { COLLECTION_ICONS, GLOBAL_ICONS, groupIcon } from '@/modules/cms/admin/icons';
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
import { Navigation } from '@/modules/cms/globals/navigation';
import { SeoDefaults } from '@/modules/cms/globals/seo-defaults';
import { SiteSettings } from '@/modules/cms/globals/site-settings';
import { AiSettings } from '@/modules/ai-content/settings';
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
const globals: GlobalConfig[] = [Home, SiteSettings, Navigation, SeoDefaults];

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
const NOTE = '@/modules/cms/admin/locale/locale-note#LocaleNote';

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
