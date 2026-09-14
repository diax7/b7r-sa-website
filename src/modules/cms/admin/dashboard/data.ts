import { getTranslation } from '@payloadcms/translations';
import type { I18nClient } from '@payloadcms/translations';
import type { LucideIcon } from 'lucide-react';
import { CirclePlus } from 'lucide-react';
import type { Payload, PayloadRequest, SanitizedPermissions, TypedUser } from 'payload';
import { formatAdminURL } from 'payload/shared';
import {
  ACTION_ICONS,
  COLLECTION_HUES,
  COLLECTION_ICONS,
  entityHue,
  entityIcon,
  GLOBAL_HUES,
  GLOBAL_ICONS,
  type Hue,
} from '@/modules/cms/admin/icons';
import { navGroups } from '@/modules/cms/admin/nav/groups';
import { adminStrings } from '@/modules/cms/admin/strings';
import { SAVED_BY } from '@/modules/cms/fields/saved-by';

const s = adminStrings.dashboard;

export interface QuickAction {
  key: string;
  href: string;
  title: string;
  text: string;
  icon: LucideIcon;
  hue: Hue;
  external?: boolean;
}

/** The actions this user may take, in the order an editor needs them. */
export function quickActions(args: {
  permissions: SanitizedPermissions | undefined;
  adminRoute: string;
}): QuickAction[] {
  const { permissions, adminRoute } = args;
  // Sanitized permissions hold `true` for an allowed operation (or an object with `permission`
  // before sanitising); both read as allowed here.
  const can = (kind: 'collections' | 'globals', slug: string, op: 'create' | 'update') => {
    const value = (permissions?.[kind] as Record<string, Record<string, unknown>> | undefined)?.[
      slug
    ]?.[op];
    return (
      value === true ||
      (typeof value === 'object' && value !== null && 'permission' in value
        ? Boolean((value as { permission?: boolean }).permission)
        : false)
    );
  };
  const url = (path: `/${string}`) => formatAdminURL({ adminRoute, path });
  const actions: QuickAction[] = [];
  if (can('globals', 'home', 'update')) {
    actions.push({
      key: 'home',
      href: url('/globals/home'),
      icon: GLOBAL_ICONS.home,
      hue: GLOBAL_HUES.home,
      ...s.actions.home,
    });
  }
  if (can('collections', 'pages', 'create')) {
    actions.push({
      key: 'add-page',
      href: url('/collections/pages/create'),
      icon: COLLECTION_ICONS.pages,
      hue: COLLECTION_HUES.pages,
      ...s.actions.addPage,
    });
  }
  if (can('collections', 'products', 'create')) {
    actions.push({
      key: 'add-product',
      href: url('/collections/products/create'),
      icon: COLLECTION_ICONS.products,
      hue: COLLECTION_HUES.products,
      ...s.actions.addProduct,
    });
  }
  if (can('collections', 'faqs', 'create')) {
    actions.push({
      key: 'add-faq',
      href: url('/collections/faqs/create'),
      icon: CirclePlus,
      hue: COLLECTION_HUES.faqs,
      ...s.actions.addFaq,
    });
  }
  if (can('collections', 'posts', 'create')) {
    actions.push({
      key: 'add-post',
      href: url('/collections/posts/create'),
      icon: COLLECTION_ICONS.posts,
      hue: COLLECTION_HUES.posts,
      ...s.actions.addPost,
    });
  }
  actions.push({
    key: 'site',
    href: '/',
    icon: ACTION_ICONS.viewSite,
    hue: 'green',
    external: true,
    ...s.actions.site,
  });
  return actions;
}

export interface RecentItem {
  key: string;
  href: string;
  title: string;
  entity: string;
  icon: LucideIcon | undefined;
  hue: Hue;
  savedBy: string | null;
  updatedAt: string;
  status: 'draft' | 'published' | null;
}

const RECENT_LIMIT = 8;
const PER_ENTITY = 4;

type Doc = Record<string, unknown> & { id?: number | string; updatedAt?: string };

function savedByName(doc: Doc): string | null {
  const snapshot = doc[SAVED_BY] as { name?: unknown } | null | undefined;
  return typeof snapshot?.name === 'string' && snapshot.name ? snapshot.name : null;
}

/** A document may have no title yet (a draft in progress); the list view says the same. */
const UNTITLED = 'Untitled';

export function titleOf(value: unknown): string {
  if (typeof value === 'number') return String(value);
  return typeof value === 'string' && value.trim() ? value : UNTITLED;
}

/**
 * Payload's autosave creates a row the moment "Create New" opens; one an editor walked away
 * from is a draft with no title and no saver (drafts are never stamped). Not a change worth
 * listing.
 */
export function isAbandonedDraft(doc: Doc, title: unknown): boolean {
  return doc['_status'] === 'draft' && titleOf(title) === UNTITLED && savedByName(doc) === null;
}

function statusOf(doc: Doc): RecentItem['status'] {
  const status = doc['_status'];
  return status === 'draft' || status === 'published' ? status : null;
}

/**
 * The last documents anyone saved, across every entity this user may open, read through
 * the Local API with the user's own access (`overrideAccess: false`), newest first.
 */
export async function recentActivity(args: {
  payload: Payload;
  req: PayloadRequest;
  user: TypedUser | undefined;
  permissions: SanitizedPermissions | undefined;
  i18n: I18nClient;
}): Promise<RecentItem[]> {
  const { payload, req, user, permissions, i18n } = args;
  if (!user) return [];
  const entities = navGroups({ payload, permissions, user, i18n }).flatMap((g) => g.entities);
  const items: RecentItem[] = [];
  await Promise.all(
    entities.map(async (entity) => {
      try {
        if (entity.type === 'globals') {
          const doc = (await payload.findGlobal({
            slug: entity.slug as Parameters<Payload['findGlobal']>[0]['slug'],
            depth: 0,
            req,
            user,
            overrideAccess: false,
          })) as unknown as Doc;
          if (!doc.updatedAt) return;
          items.push({
            key: `g-${entity.slug}`,
            href: entity.href,
            title: entity.label,
            entity: entity.label,
            icon: entityIcon('globals', entity.slug),
            hue: entityHue('globals', entity.slug),
            savedBy: savedByName(doc),
            updatedAt: doc.updatedAt,
            status: statusOf(doc),
          });
          return;
        }
        const collection = payload.config.collections.find((c) => c.slug === entity.slug);
        if (!collection) return;
        const titleField = collection.admin.useAsTitle || 'id';
        const { docs } = await payload.find({
          collection: entity.slug as Parameters<Payload['find']>[0]['collection'],
          depth: 0,
          limit: PER_ENTITY,
          sort: '-updatedAt',
          req,
          user,
          overrideAccess: false,
        });
        for (const raw of docs as unknown as Doc[]) {
          if (!raw.updatedAt || isAbandonedDraft(raw, raw[titleField])) continue;
          items.push({
            key: `c-${entity.slug}-${String(raw.id)}`,
            href: `${entity.href}/${String(raw.id)}`,
            title: titleOf(raw[titleField]),
            entity: getTranslation(collection.labels.singular, i18n),
            icon: entityIcon('collections', entity.slug),
            hue: entityHue('collections', entity.slug),
            savedBy: savedByName(raw),
            updatedAt: raw.updatedAt,
            status: statusOf(raw),
          });
        }
      } catch (error) {
        // A read the access rules refuse is not an error on the dashboard; log and skip.
        payload.logger.info({ msg: 'dashboard: recent activity skipped an entity', error });
      }
    }),
  );
  return items.toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, RECENT_LIMIT);
}
