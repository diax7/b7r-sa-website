import {
  ArrowRightLeft,
  Bot,
  CircleHelp,
  Eye,
  FileText,
  FolderTree,
  Footprints,
  Gauge,
  Globe,
  Camera,
  MessageCircleQuestion,
  Quote,
  Heart,
  History,
  House,
  Image,
  KeyRound,
  ListChecks,
  ListTodo,
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
  Signpost,
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
/** A page of our own in the panel (ADR-048): a report, not a document. */
export type ViewSlug = 'traffic' | 'visibility';
export type EntityType = 'collections' | 'globals' | 'views';

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
  traffic: Footprints,
  metrics: Camera,
  prompts: MessageCircleQuestion,
  citations: Quote,
};

export const GLOBAL_ICONS: Record<GlobalSlug, LucideIcon> = {
  home: House,
  'site-settings': Settings2,
  'seo-defaults': Search,
  'ai-settings': SlidersHorizontal,
  'visibility-checklist': ListTodo,
};

/**
 * Our own pages in the panel (ADR-048): Payload registers each as a custom view at `path`
 * (`admin.components.views`, from `ADMIN_VIEW_COMPONENTS` in `admin/views/registry.ts`),
 * the sidebar and the palette list it like a global, and every one is for admins only, the
 * view gating itself (a custom view with a `path` is public in Payload). A view's icon is a
 * place, like a global's, and must not repeat its group's.
 */
export const ADMIN_VIEWS: Record<
  ViewSlug,
  { label: { ar: string; en: string }; path: `/${string}`; icon: LucideIcon }
> = {
  traffic: {
    label: { ar: 'مصادر الزيارات', en: 'Traffic sources' },
    path: '/traffic',
    icon: Signpost,
  },
  visibility: {
    label: { ar: 'درجة الظهور', en: 'Visibility score' },
    path: '/visibility',
    icon: Gauge,
  },
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
  slug: CollectionSlug | GlobalSlug | ViewSlug;
}

/**
 * Where an entity sits in the sidebar: its group, its order inside the group, an optional
 * parent (a secondary entry, indented under the parent; a collection may sit under a view)
 * and an optional section.
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

const TRAFFIC_VIEW: EntityRef = { type: 'views', slug: 'traffic' };
const SCORE_VIEW: EntityRef = { type: 'views', slug: 'visibility' };

export const ADMIN_NAV: {
  collections: Record<CollectionSlug, NavPlacement>;
  globals: Record<GlobalSlug, NavPlacement>;
  views: Record<ViewSlug, NavPlacement>;
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
    redirects: { group: 'visibility', order: 9 },
    traffic: { group: 'visibility', order: 8, parent: TRAFFIC_VIEW },
    metrics: { group: 'visibility', order: 2, parent: SCORE_VIEW },
    prompts: { group: 'visibility', order: 3, parent: SCORE_VIEW },
    citations: { group: 'visibility', order: 4, parent: SCORE_VIEW },
    users: { group: 'admin', order: 0 },
    connections: { group: 'admin', order: 1 },
  },
  globals: {
    home: { group: 'site', order: 0 },
    'site-settings': { group: 'site', order: 2 },
    'seo-defaults': { group: 'visibility', order: 6 },
    'visibility-checklist': { group: 'visibility', order: 1, parent: SCORE_VIEW },
    'ai-settings': { group: 'blog', order: 12, section: 'engine' },
  },
  views: {
    visibility: { group: 'visibility', order: 0 },
    traffic: { group: 'visibility', order: 7 },
  },
};

export function navPlacement(type: EntityType, slug: string): NavPlacement | undefined {
  if (type === 'collections') return ADMIN_NAV.collections[slug as CollectionSlug];
  if (type === 'globals') return ADMIN_NAV.globals[slug as GlobalSlug];
  return ADMIN_NAV.views[slug as ViewSlug];
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
  if (type === 'collections') return COLLECTION_ICONS[slug as CollectionSlug];
  if (type === 'globals') return GLOBAL_ICONS[slug as GlobalSlug];
  return ADMIN_VIEWS[slug as ViewSlug]?.icon;
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

/** What each of those icons is called in the picker and the list, never the lucide name. */
export const WIDGET_ICON_LABELS: Record<keyof typeof WIDGET_ICONS, { ar: string; en: string }> = {
  ShieldCheck: { ar: 'درع', en: 'Shield' },
  Workflow: { ar: 'مسار', en: 'Workflow' },
  Zap: { ar: 'برق', en: 'Bolt' },
  Target: { ar: 'هدف', en: 'Target' },
  Eye: { ar: 'عين', en: 'Eye' },
  Heart: { ar: 'قلب', en: 'Heart' },
};

/** The options of a select over widget icons: the stored lucide name, labelled in both languages. */
export function iconOptions(names: readonly string[]) {
  return names.map((value) => {
    const label = WIDGET_ICON_LABELS[value];
    if (!label) throw new Error(`Icon "${value}" has no label in WIDGET_ICON_LABELS`);
    return { value, label };
  });
}
