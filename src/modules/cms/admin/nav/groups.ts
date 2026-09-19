import type { I18nClient } from '@payloadcms/translations';
import { getTranslation } from '@payloadcms/translations';
import { EntityType, groupNavItems } from '@payloadcms/ui/shared';
import type { Payload, PayloadRequest, SanitizedPermissions, TypedUser } from 'payload';
import { formatAdminURL, PREFERENCE_KEYS } from 'payload/shared';
import { roleOf } from '@/modules/cms/access';
import {
  ADMIN_GROUPS,
  ADMIN_VIEWS,
  adminGroup,
  type AdminGroupKey,
  type EntityType as NavEntityType,
  type CollectionSlug,
  type EntityRef,
  GROUP_ORDER,
  type Hue,
  NAV_SECTIONS,
  navPlacement,
  type NavPlacement,
  type NavSection,
} from '@/modules/cms/admin/icons';
import { type NavBadge, navBadges } from '@/modules/cms/admin/nav/badges';
import { blockEntities, groupBlocks } from '@/modules/cms/admin/nav/order';

/** One sidebar / palette entry: plain data, safe to hand to a client component. */
export interface NavEntity {
  type: NavEntityType;
  slug: string;
  label: string;
  href: string;
  /** A number that asks for action (ADR-058); most entries carry none. */
  badge?: NavBadge;
  /** Secondary entries, indented under this one. */
  children: NavEntity[];
}

export interface NavGroupSection {
  key: NavSection;
  label: string;
  /** Before or after the group's primary entries (`NAV_SECTIONS`, ADR-061). */
  place: 'first' | 'last';
  entities: NavEntity[];
}

export interface NavGroup {
  key: AdminGroupKey;
  label: string;
  hue: Hue;
  entities: NavEntity[];
  sections: NavGroupSection[];
}

/** `{ groups: { [label]: { open } } }`, the shape Payload's own nav stores under `nav`. */
export type NavPrefs = { open?: boolean; groups?: Record<string, { open?: boolean }> } | null;

function sameRef(a: EntityRef, e: { type: string; slug: string }): boolean {
  return a.type === e.type && a.slug === e.slug;
}

/** An allowed entity with its place in the registry. */
type Placed = Pick<NavEntity, 'type' | 'slug' | 'label' | 'href'> & { placement: NavPlacement };

/**
 * The entities the signed-in user may open, in the five task groups of the registry
 * (ADR-046). Payload's `groupNavItems` decides what the user may see (permissions,
 * `admin.hidden`), the same rule the default nav uses; the registry decides where each entry
 * sits: group order, entry order, secondary entries under their parent, the engine section.
 * Shared by the sidebar and the command palette so they never disagree.
 */
export async function navGroups(args: {
  payload: Payload;
  permissions: SanitizedPermissions | undefined;
  user: TypedUser | undefined;
  i18n: I18nClient;
  /** Read the action badges (the sidebar shows them; the palette and the dashboard do not). */
  badges?: boolean;
}): Promise<NavGroup[]> {
  const { payload, permissions, user, i18n, badges: withBadges = false } = args;
  const adminRoute = payload.config.routes.admin;
  const visible = (hidden: unknown): boolean =>
    typeof hidden === 'function'
      ? !(hidden as (a: { user: unknown }) => boolean)({ user })
      : !hidden;
  const entities = [
    ...payload.config.collections
      .filter((c) => visible(c.admin.hidden))
      .map((entity) => ({ type: EntityType.collection, entity }) as const),
    ...payload.config.globals
      .filter((g) => visible(g.admin.hidden))
      .map((entity) => ({ type: EntityType.global, entity }) as const),
  ];
  const allowed: Array<Pick<NavEntity, 'type' | 'slug' | 'label' | 'href'>> = groupNavItems(
    entities,
    permissions ?? ({} as SanitizedPermissions),
    i18n,
  )
    .flatMap((group) => group.entities)
    .map((e) => ({
      type: (e.type === EntityType.collection ? 'collections' : 'globals') as NavEntity['type'],
      slug: e.slug,
      label: getTranslation(e.label, i18n),
      href: formatAdminURL({
        adminRoute,
        path: `/${e.type === EntityType.collection ? 'collections' : 'globals'}/${e.slug}`,
      }),
    }));
  // Our own pages (ADR-048): Payload knows nothing of them; the registry's rule is admins only.
  if (roleOf({ user: user ?? null }) === 'admin') {
    for (const [slug, view] of Object.entries(ADMIN_VIEWS)) {
      allowed.push({
        type: 'views',
        slug,
        label: getTranslation(view.label, i18n),
        href: formatAdminURL({ adminRoute, path: view.path }),
      });
    }
  }
  const badges = withBadges
    ? await navBadges({
        payload,
        user,
        visible: new Set(allowed.filter((e) => e.type === 'collections').map((e) => e.slug)),
      })
    : {};
  const placed: Placed[] = allowed
    .flatMap((e) => {
      const placement = navPlacement(e.type, e.slug);
      return placement ? [{ ...e, placement }] : [];
    })
    .toSorted((a, b) => a.placement.order - b.placement.order);
  const badgeOf = (e: Placed): { badge: NavBadge } | Record<string, never> => {
    const badge = e.type === 'collections' ? badges[e.slug as CollectionSlug] : undefined;
    return badge ? { badge } : {};
  };
  const toEntity = (e: Placed): NavEntity => ({
    type: e.type,
    slug: e.slug,
    label: e.label,
    href: e.href,
    ...badgeOf(e),
    children: placed
      .filter((c) => c.placement.parent && sameRef(c.placement.parent, e))
      .map(toEntity),
  });
  return GROUP_ORDER.map((key) => {
    const ofGroup = placed.filter((e) => e.placement.group === key);
    // A secondary entry whose parent this user cannot see is shown as a primary one.
    const primary = ofGroup.filter(
      (e) =>
        !e.placement.section &&
        (!e.placement.parent || !placed.some((p) => sameRef(e.placement.parent!, p))),
    );
    const sections = (Object.keys(NAV_SECTIONS) as NavSection[])
      .map((section) => ({
        key: section,
        label: getTranslation({ ar: NAV_SECTIONS[section].ar, en: NAV_SECTIONS[section].en }, i18n),
        place: NAV_SECTIONS[section].place,
        entities: ofGroup.filter((e) => e.placement.section === section).map(toEntity),
      }))
      .filter((s) => s.entities.length > 0);
    return {
      key,
      label: getTranslation(adminGroup(key), i18n),
      hue: ADMIN_GROUPS[key].hue,
      entities: primary.map(toEntity),
      sections,
    };
  }).filter((g) => g.entities.length > 0 || g.sections.length > 0);
}

function flat(entities: NavEntity[], group: string): Array<NavEntity & { group: string }> {
  return entities.flatMap((e) => [{ ...e, group }, ...flat(e.children, group)]);
}

/** Every entry of every group, flat and in document order, for the palette and the dashboard. */
export function flattenNav(groups: NavGroup[]): Array<NavEntity & { group: string }> {
  return groups.flatMap((g) => groupBlocks(g).flatMap((b) => flat(blockEntities(b), g.label)));
}

/** The user's remembered open/closed groups (Payload's `nav` preference). */
export async function navPrefs(req: PayloadRequest | undefined): Promise<NavPrefs> {
  if (!req?.user?.collection) return null;
  const res = await req.payload.find({
    collection: 'payload-preferences',
    depth: 0,
    limit: 1,
    pagination: false,
    req,
    sort: '-updatedAt',
    where: {
      and: [
        { key: { equals: PREFERENCE_KEYS.NAV } },
        { 'user.relationTo': { equals: req.user.collection } },
        { 'user.value': { equals: req.user.id } },
      ],
    },
  });
  return (res.docs[0]?.value as NavPrefs) ?? null;
}
