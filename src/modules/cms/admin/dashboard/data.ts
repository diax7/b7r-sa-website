import { getTranslation } from '@payloadcms/translations';
import type { I18nClient } from '@payloadcms/translations';
import type { LucideIcon } from 'lucide-react';
import type { Field, Payload, PayloadRequest, SanitizedPermissions, TypedUser } from 'payload';
import { formatAdminURL } from 'payload/shared';
import {
  type AdminGroupKey,
  COLLECTION_ICONS,
  entityHue,
  entityIcon,
  GLOBAL_ICONS,
  type Hue,
  navPlacement,
} from '@/modules/cms/admin/icons';
import { flattenNav, navGroups } from '@/modules/cms/admin/nav/groups';
import { adminStringsFor } from '@/modules/cms/admin/strings';
import { SAVED_BY } from '@/modules/cms/fields/saved-by';

export interface QuickAction {
  key: string;
  href: string;
  title: string;
  text: string;
  icon: LucideIcon;
  hue: Hue;
}

/**
 * "Latest saves" lists what a person saves: a collection without the `lastSavedBy` stamp is
 * written by a machine (the runs log, the traffic count, whose upsert touches `updatedAt` every
 * ten seconds) and stays out. Views are not entities and never reach here.
 */
export function savesByPeople(collection: { fields: Field[] }): boolean {
  return collection.fields.some((f) => 'name' in f && f.name === SAVED_BY);
}

/**
 * Sanitized permissions hold `true` for an allowed operation (or an object with `permission`
 * before sanitising); both read as allowed.
 */
export function can(
  permissions: SanitizedPermissions | undefined,
  kind: 'collections' | 'globals',
  slug: string,
  op: 'create' | 'read' | 'update',
): boolean {
  const value = (permissions?.[kind] as Record<string, Record<string, unknown>> | undefined)?.[
    slug
  ]?.[op];
  return (
    value === true ||
    (typeof value === 'object' && value !== null && 'permission' in value
      ? Boolean((value as { permission?: boolean }).permission)
      : false)
  );
}

/**
 * The content section's actions (ADR-059): the home page as a tile when the user may edit
 * it, and the two buttons an editor presses most, by permission, in the UI language.
 */
export function contentActions(args: {
  permissions: SanitizedPermissions | undefined;
  adminRoute: string;
  language: string;
}): { home: QuickAction | null; buttons: QuickAction[] } {
  const { permissions, adminRoute, language } = args;
  const s = adminStringsFor(language).dashboard;
  const url = (path: `/${string}`) => formatAdminURL({ adminRoute, path });
  const home: QuickAction | null = can(permissions, 'globals', 'home', 'update')
    ? {
        key: 'home',
        href: url('/globals/home'),
        icon: GLOBAL_ICONS.home,
        hue: entityHue('globals', 'home'),
        ...s.actions.home,
      }
    : null;
  const buttons: QuickAction[] = [];
  if (can(permissions, 'collections', 'posts', 'create')) {
    buttons.push({
      key: 'add-post',
      href: url('/collections/posts/create'),
      icon: COLLECTION_ICONS.posts,
      hue: entityHue('collections', 'posts'),
      ...s.actions.addPost,
    });
  }
  if (can(permissions, 'collections', 'products', 'create')) {
    buttons.push({
      key: 'add-product',
      href: url('/collections/products/create'),
      icon: COLLECTION_ICONS.products,
      hue: entityHue('collections', 'products'),
      ...s.actions.addProduct,
    });
  }
  return { home, buttons };
}

export interface RecentItem {
  key: string;
  href: string;
  title: string;
  /** The entity's name under a document's title; empty for a global, whose title is its name. */
  entity: string;
  icon: LucideIcon | undefined;
  hue: Hue;
  savedBy: string | null;
  updatedAt: string;
  status: 'draft' | 'published' | null;
}

const PER_ENTITY = 4;

/** The groups whose saves are content: the Visibility and Admin groups hold settings and keys. */
export const CONTENT_GROUPS: readonly AdminGroupKey[] = ['site', 'catalogue', 'blog'];

type Doc = Record<string, unknown> & { id?: number | string; updatedAt?: string };

function savedByName(doc: Doc): string | null {
  const snapshot = doc[SAVED_BY] as { name?: unknown } | null | undefined;
  return typeof snapshot?.name === 'string' && snapshot.name ? snapshot.name : null;
}

/** A document may have no title yet (a draft in progress): a number or a non-blank string is one. */
export function hasTitle(value: unknown): boolean {
  return typeof value === 'number' || (typeof value === 'string' && value.trim() !== '');
}

/** The title as the list shows it, or the "Untitled" of the UI language (`common.untitled`). */
export function titleOf(value: unknown, untitled: string): string {
  return hasTitle(value) ? String(value) : untitled;
}

/**
 * Payload's autosave creates a row the moment "Create New" opens; one an editor walked away
 * from is a draft with no title and no saver (drafts are never stamped). Not a change worth
 * listing.
 */
export function isAbandonedDraft(doc: Doc, title: unknown): boolean {
  return doc['_status'] === 'draft' && !hasTitle(title) && savedByName(doc) === null;
}

/** A post the engine wrote and nobody touched: a machine row, not a save by a person. */
export function isMachineRow(doc: Doc): boolean {
  return doc['origin'] === 'ai' && savedByName(doc) === null;
}

function statusOf(doc: Doc): RecentItem['status'] {
  const status = doc['_status'];
  return status === 'draft' || status === 'published' ? status : null;
}

/**
 * The last documents anyone saved across the content groups this user may open, read through
 * the Local API with the user's own access (`overrideAccess: false`), newest first, every
 * global of those groups included (the home page tile reads its own row from here).
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
  const { untitled } = adminStringsFor(i18n.language).common;
  const entities = flattenNav(await navGroups({ payload, permissions, user, i18n })).filter((e) => {
    const group = navPlacement(e.type, e.slug)?.group;
    return e.type !== 'views' && group !== undefined && CONTENT_GROUPS.includes(group);
  });
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
            entity: '',
            icon: entityIcon('globals', entity.slug),
            hue: entityHue('globals', entity.slug),
            savedBy: savedByName(doc),
            updatedAt: doc.updatedAt,
            status: statusOf(doc),
          });
          return;
        }
        const collection = payload.config.collections.find((c) => c.slug === entity.slug);
        if (!collection || !savesByPeople(collection)) return;
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
          if (!raw.updatedAt || isAbandonedDraft(raw, raw[titleField]) || isMachineRow(raw)) {
            continue;
          }
          items.push({
            key: `c-${entity.slug}-${String(raw.id)}`,
            href: `${entity.href}/${String(raw.id)}`,
            title: titleOf(raw[titleField], untitled),
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
        payload.logger.info({ msg: 'dashboard: latest saves skipped an entity', error });
      }
    }),
  );
  return items.toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
