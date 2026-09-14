import {
  ArrowRightLeft,
  Bot,
  CircleHelp,
  Compass,
  Eye,
  FileText,
  FolderTree,
  Heart,
  House,
  Image,
  LayoutGrid,
  ListChecks,
  type LucideIcon,
  MessageSquareQuote,
  Newspaper,
  Plug,
  ScrollText,
  Search,
  Settings2,
  Shield,
  ShieldCheck,
  Shirt,
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
 * The one place an admin icon is chosen (ADR-039, `.claude/rules/admin-ui.md`). The key
 * types are derived from the generated config, so a new collection or global without an
 * entry here is a type error, and `tests/admin-icons.test.ts` walks the runtime config too.
 */
export type CollectionSlug = Exclude<keyof Config['collections'], `payload-${string}`>;
export type GlobalSlug = keyof Config['globals'];

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
  'ai-runs': ScrollText,
};

export const GLOBAL_ICONS: Record<GlobalSlug, LucideIcon> = {
  home: House,
  'site-settings': Settings2,
  navigation: Compass,
  'seo-defaults': Search,
  'ai-settings': Bot,
};

/**
 * The three nav groups in display order. Payload groups entities by the rendered label, in
 * the panel's language; `groupKey` maps either language back to the key.
 */
export const ADMIN_GROUPS = {
  content: { ar: 'المحتوى', en: 'Content' },
  blog: { ar: 'المدونة', en: 'Blog' },
  ai: { ar: 'المحتوى الآلي', en: 'AI content' },
  settings: { ar: 'الإعدادات', en: 'Settings' },
  administration: { ar: 'الإدارة', en: 'Administration' },
} as const;

export type AdminGroupKey = keyof typeof ADMIN_GROUPS;

export const GROUP_ORDER: AdminGroupKey[] = ['content', 'blog', 'ai', 'settings', 'administration'];

export const GROUP_ICONS: Record<AdminGroupKey, LucideIcon> = {
  content: LayoutGrid,
  blog: Newspaper,
  ai: Bot,
  settings: SlidersHorizontal,
  administration: Shield,
};

export function groupKey(label: string): AdminGroupKey | undefined {
  return GROUP_ORDER.find(
    (key) => ADMIN_GROUPS[key].ar === label || ADMIN_GROUPS[key].en === label,
  );
}

export function groupIcon(label: string): LucideIcon | undefined {
  const key = groupKey(label);
  return key ? GROUP_ICONS[key] : undefined;
}

export const ACTION_ICONS = { viewSite: Eye } as const;

/**
 * The dashboard's hues (design system §2): identity, never meaning. A page is violet on its
 * quick-action tile and in the latest-changes list; the settings entities share the blue.
 * Green is kept for "live" (the site link), so the four meaning colours stay honest.
 */
export type Hue = 'blue' | 'violet' | 'teal' | 'orange' | 'pink' | 'green';

export const COLLECTION_HUES: Record<CollectionSlug, Hue> = {
  products: 'teal',
  pages: 'violet',
  faqs: 'orange',
  testimonials: 'pink',
  integrations: 'teal',
  media: 'pink',
  redirects: 'blue',
  users: 'blue',
  posts: 'violet',
  categories: 'blue',
  authors: 'pink',
  tags: 'blue',
  'ai-topics': 'orange',
  'ai-runs': 'blue',
};

export const GLOBAL_HUES: Record<GlobalSlug, Hue> = {
  home: 'blue',
  'site-settings': 'blue',
  navigation: 'blue',
  'seo-defaults': 'blue',
  'ai-settings': 'orange',
};

export function entityHue(type: 'collections' | 'globals', slug: string): Hue {
  const hue =
    type === 'collections'
      ? COLLECTION_HUES[slug as CollectionSlug]
      : GLOBAL_HUES[slug as GlobalSlug];
  return hue ?? 'blue';
}

/** Tailwind classes per hue (literal, so the scanner keeps them): a tinted disc and its icon. */
export const HUE_CLASSES: Record<Hue, string> = {
  blue: 'bg-accent-tint text-accent',
  violet: 'bg-violet-tint text-violet',
  teal: 'bg-teal-tint text-teal',
  orange: 'bg-orange-tint text-orange',
  pink: 'bg-pink-tint text-pink',
  green: 'bg-success-tint text-success',
};

/** The lucide names the content selects offer (`CARD_ICONS`, `WHY_US_ICONS`), for the picker. */
export const WIDGET_ICONS: Record<string, LucideIcon> = {
  ShieldCheck,
  Workflow,
  Zap,
  Target,
  Eye,
  Heart,
};

export function entityIcon(type: 'collections' | 'globals', slug: string): LucideIcon | undefined {
  return type === 'collections'
    ? COLLECTION_ICONS[slug as CollectionSlug]
    : GLOBAL_ICONS[slug as GlobalSlug];
}
