import {
  ArrowRightLeft,
  CircleHelp,
  Compass,
  Eye,
  FileText,
  Heart,
  House,
  Image,
  LayoutGrid,
  type LucideIcon,
  MessageSquareQuote,
  Plug,
  Search,
  Settings2,
  Shield,
  ShieldCheck,
  Shirt,
  SlidersHorizontal,
  Target,
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
};

export const GLOBAL_ICONS: Record<GlobalSlug, LucideIcon> = {
  home: House,
  'site-settings': Settings2,
  navigation: Compass,
  'seo-defaults': Search,
};

/** The three nav groups (`admin.group.ar`); Payload groups entities by the rendered label. */
export const ADMIN_GROUPS = {
  content: { ar: 'المحتوى', en: 'Content' },
  settings: { ar: 'الإعدادات', en: 'Settings' },
  administration: { ar: 'الإدارة', en: 'Administration' },
} as const;

export type AdminGroupLabel = (typeof ADMIN_GROUPS)[keyof typeof ADMIN_GROUPS]['ar'];

export const GROUP_ICONS: Record<AdminGroupLabel, LucideIcon> = {
  [ADMIN_GROUPS.content.ar]: LayoutGrid,
  [ADMIN_GROUPS.settings.ar]: SlidersHorizontal,
  [ADMIN_GROUPS.administration.ar]: Shield,
};

export function groupIcon(label: string): LucideIcon | undefined {
  return GROUP_ICONS[label as AdminGroupLabel];
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

export function entityIcon(type: 'collections' | 'globals', slug: string): LucideIcon | undefined {
  return type === 'collections'
    ? COLLECTION_ICONS[slug as CollectionSlug]
    : GLOBAL_ICONS[slug as GlobalSlug];
}
