import {
  ArrowRightLeft,
  CircleHelp,
  Compass,
  Eye,
  FileText,
  House,
  Image,
  LayoutGrid,
  type LucideIcon,
  MessageSquareQuote,
  Plug,
  Search,
  Settings2,
  Shield,
  Shirt,
  SlidersHorizontal,
  Users,
} from 'lucide-react';
import type { Config } from '@/payload-types';

/**
 * The one place an admin icon is chosen (ADR-039, `.claude/rules/admin-ui.md`). The key
 * types are derived from the generated config, so a new collection or global without an
 * entry here is a type error — and `tests/admin-icons.test.ts` walks the runtime config too.
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

/** Nav groups are keyed by their Arabic label (Payload groups by the rendered label). */
export const GROUP_ICONS: Record<string, LucideIcon> = {
  المحتوى: LayoutGrid,
  الإعدادات: SlidersHorizontal,
  الإدارة: Shield,
};

export const ACTION_ICONS = { viewSite: Eye } as const;

export function entityIcon(type: 'collection' | 'global', slug: string): LucideIcon | undefined {
  return type === 'collection'
    ? COLLECTION_ICONS[slug as CollectionSlug]
    : GLOBAL_ICONS[slug as GlobalSlug];
}
