import {
  ArrowRightLeft,
  Bot,
  CircleHelp,
  Eye,
  FileText,
  FolderTree,
  Globe,
  Heart,
  History,
  House,
  Image,
  KeyRound,
  ListChecks,
  type LucideIcon,
  MessageSquareQuote,
  Newspaper,
  PenLine,
  Plug,
  Radar,
  Search,
  Settings2,
  Shield,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  SlidersHorizontal,
  Tag,
  Target,
  UserPen,
  Users,
  Workflow,
  Zap,
} from 'lucide-react';
import type { Config } from '@/payload-types';

/**
 * The one place the shell learns about an entity (ADR-039, ADR-046, `.claude/rules/admin-ui.md`):
 * its icon, its group and its place in the sidebar. The key types are derived from the
 * generated config, so a new collection or global without an entry here is a type error, and
 * `tests/admin-config.test.ts` walks the runtime config too.
 */
export type CollectionSlug = Exclude<keyof Config['collections'], `payload-${string}`>;
export type GlobalSlug = Exclude<keyof Config['globals'], `payload-${string}`>;
export type EntityType = 'collections' | 'globals';

export const COLLECTION_ICONS: Record<CollectionSlug, LucideIcon> = {
  products: Shirt,
  pages: FileText,
  faqs: CircleHelp,
  testimonials: MessageSquareQuote,
  integrations: Plug,
  media: Image,
  redirects: ArrowRightLeft,
  users: Users,
  posts: Newspaper,
  categories: FolderTree,
  authors: UserPen,
  tags: Tag,
  'ai-topics': ListChecks,
  'ai-runs': History,
  connections: KeyRound,
};

export const GLOBAL_ICONS: Record<GlobalSlug, LucideIcon> = {
  home: House,
  'site-settings': Settings2,
  'seo-defaults': Search,
  'ai-settings': SlidersHorizontal,
};

/**
 * Identity hues (design system §2): one per group, carried by every entity of the group onto
 * the sidebar, the page header and the dashboard. Identity, never meaning: blue keeps the main
 * action and links, green stays "live", red "delete", amber "careful". Pink rather than orange
 * for Visibility, because orange sits next to amber.
 */
export type Hue = 'blue' | 'teal' | 'violet' | 'pink' | 'slate' | 'green';

/** Tailwind classes per hue (literal, so the scanner keeps them): a tinted disc and its icon. */
export const HUE_CLASSES: Record<Hue, string> = {
  blue: 'bg-accent-tint text-accent',
  teal: 'bg-teal-tint text-teal',
  violet: 'bg-violet-tint text-violet',
  pink: 'bg-pink-tint text-pink',
  slate: 'bg-slate-tint text-slate',
  green: 'bg-success-tint text-success',
};

/** The bar beside a page header, in the entity's hue (literal classes). */
export const HUE_BAR_CLASSES: Record<Hue, string> = {
  blue: 'border-accent',
  teal: 'border-teal',
  violet: 'border-violet',
  pink: 'border-pink',
  slate: 'border-slate',
  green: 'border-success',
};

/** The five task groups of the sidebar, in display order (ADR-046). */
export const ADMIN_GROUPS = {
  site: { ar: 'الموقع', en: 'Site', hue: 'blue', icon: Globe, order: 0 },
  catalogue: { ar: 'الكتالوج', en: 'Catalogue', hue: 'teal', icon: ShoppingBag, order: 1 },
  blog: { ar: 'المدونة', en: 'Blog', hue: 'violet', icon: PenLine, order: 2 },
  visibility: { ar: 'الظهور', en: 'Visibility', hue: 'pink', icon: Radar, order: 3 },
  admin: { ar: 'الإدارة', en: 'Admin', hue: 'slate', icon: Shield, order: 4 },
} as const satisfies Record<
  string,
  { ar: string; en: string; hue: Hue; icon: LucideIcon; order: number }
>;

export type AdminGroupKey = keyof typeof ADMIN_GROUPS;

export const GROUP_ORDER: AdminGroupKey[] = (Object.keys(ADMIN_GROUPS) as AdminGroupKey[]).toSorted(
  (a, b) => ADMIN_GROUPS[a].order - ADMIN_GROUPS[b].order,
);

/** The `admin.group` value a config declares; the registry below must name the same group. */
export function adminGroup(key: AdminGroupKey): { ar: string; en: string } {
  return { ar: ADMIN_GROUPS[key].ar, en: ADMIN_GROUPS[key].en };
}

/** A sub-heading inside a group: the content engine's three entries under Blog. */
export const NAV_SECTIONS = {
  engine: { ar: 'محرّك المحتوى', en: 'Content engine', icon: Bot },
} as const satisfies Record<string, { ar: string; en: string; icon: LucideIcon }>;

export type NavSection = keyof typeof NAV_SECTIONS;

export interface EntityRef {
  type: EntityType;
  slug: CollectionSlug | GlobalSlug;
}

/**
 * Where an entity sits in the sidebar: its group, its order inside the group, an optional
 * parent (a secondary entry, indented under the parent) and an optional section.
 */
export interface NavPlacement {
  group: AdminGroupKey;
  order: number;
  parent?: EntityRef;
  section?: NavSection;
  /** The public listing the entity feeds, for the link on its list page. */
  listing?: `/${string}` | '/';
}

const POSTS: EntityRef = { type: 'collections', slug: 'posts' };

export const ADMIN_NAV: {
  collections: Record<CollectionSlug, NavPlacement>;
  globals: Record<GlobalSlug, NavPlacement>;
} = {
  collections: {
    pages: { group: 'site', order: 1 },
    media: { group: 'site', order: 3 },
    products: { group: 'catalogue', order: 0, listing: '/products' },
    integrations: { group: 'catalogue', order: 1 },
    testimonials: { group: 'catalogue', order: 2 },
    faqs: { group: 'catalogue', order: 3, listing: '/faq' },
    posts: { group: 'blog', order: 0, listing: '/blog' },
    categories: { group: 'blog', order: 1, parent: POSTS },
    authors: { group: 'blog', order: 2, parent: POSTS },
    tags: { group: 'blog', order: 3, parent: POSTS },
    'ai-topics': { group: 'blog', order: 10, section: 'engine' },
    'ai-runs': { group: 'blog', order: 11, section: 'engine' },
    redirects: { group: 'visibility', order: 1 },
    users: { group: 'admin', order: 0 },
    connections: { group: 'admin', order: 1 },
  },
  globals: {
    home: { group: 'site', order: 0 },
    'site-settings': { group: 'site', order: 2 },
    'seo-defaults': { group: 'visibility', order: 0 },
    'ai-settings': { group: 'blog', order: 12, section: 'engine' },
  },
};

export function navPlacement(type: EntityType, slug: string): NavPlacement | undefined {
  return type === 'collections'
    ? ADMIN_NAV.collections[slug as CollectionSlug]
    : ADMIN_NAV.globals[slug as GlobalSlug];
}

/** Payload groups entities by the rendered label, in the panel's language; back to the key. */
export function groupKey(label: string): AdminGroupKey | undefined {
  return GROUP_ORDER.find(
    (key) => ADMIN_GROUPS[key].ar === label || ADMIN_GROUPS[key].en === label,
  );
}

export function groupIcon(label: string): LucideIcon | undefined {
  const key = groupKey(label);
  return key ? ADMIN_GROUPS[key].icon : undefined;
}

export function groupHue(key: AdminGroupKey): Hue {
  return ADMIN_GROUPS[key].hue;
}

/** An entity's hue is its group's; an unknown entity (never in practice) reads as blue. */
export function entityHue(type: EntityType, slug: string): Hue {
  const placement = navPlacement(type, slug);
  return placement ? ADMIN_GROUPS[placement.group].hue : 'blue';
}

export function entityIcon(type: EntityType, slug: string): LucideIcon | undefined {
  return type === 'collections'
    ? COLLECTION_ICONS[slug as CollectionSlug]
    : GLOBAL_ICONS[slug as GlobalSlug];
}

export const ACTION_ICONS = { viewSite: Eye } as const;

/** The lucide names the content selects offer (`CARD_ICONS`, `WHY_US_ICONS`), for the picker. */
export const WIDGET_ICONS: Record<string, LucideIcon> = {
  ShieldCheck,
  Workflow,
  Zap,
  Target,
  Eye,
  Heart,
};
