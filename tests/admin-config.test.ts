import type { CollectionConfig, GlobalConfig } from 'payload';
import { describe, expect, it } from 'vitest';
import { COLLECTION_ICONS, GLOBAL_ICONS, GROUP_ICONS } from '@/modules/cms/admin/icons';
import { Faqs } from '@/modules/cms/collections/faqs';
import { Integrations } from '@/modules/cms/collections/integrations';
import { Media } from '@/modules/cms/collections/media';
import { Pages } from '@/modules/cms/collections/pages';
import { Products } from '@/modules/cms/collections/products';
import { REDIRECT_OVERRIDES } from '@/modules/cms/collections/redirects';
import { Testimonials } from '@/modules/cms/collections/testimonials';
import { Users } from '@/modules/cms/collections/users';
import { Home } from '@/modules/cms/globals/home';
import { Navigation } from '@/modules/cms/globals/navigation';
import { SeoDefaults } from '@/modules/cms/globals/seo-defaults';
import { SiteSettings } from '@/modules/cms/globals/site-settings';

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
      expect(isIcon(GROUP_ICONS[groupOf(c.admin)]), 'group icon').toBe(true);
      expect(arabic(c.labels?.singular), 'labels.singular').toBe(true);
      expect(arabic(c.labels?.plural), 'labels.plural').toBe(true);
      expect(arabic(c.admin?.description), 'admin.description').toBe(true);
      if (c.slug !== 'media') expect(c.admin?.useAsTitle, 'useAsTitle').toBeTruthy();
      expect(c.admin?.defaultColumns?.length ?? 0, 'defaultColumns').toBeGreaterThan(1);
    });
  }

  for (const g of globals) {
    it(`global ${g.slug}: icon, group, Arabic label + description`, () => {
      expect(isIcon(GLOBAL_ICONS[g.slug as keyof typeof GLOBAL_ICONS]), 'icon').toBe(true);
      expect(arabic(g.admin?.group), 'admin.group').toBe(true);
      expect(isIcon(GROUP_ICONS[groupOf(g.admin)]), 'group icon').toBe(true);
      expect(arabic(g.label), 'label').toBe(true);
      expect(arabic(g.admin?.description), 'admin.description').toBe(true);
    });
  }
});
