import type { I18nClient } from '@payloadcms/translations';
import { getTranslation } from '@payloadcms/translations';
import { EntityType, groupNavItems } from '@payloadcms/ui/shared';
import type { Payload, PayloadRequest, SanitizedPermissions, TypedUser } from 'payload';
import { formatAdminURL, PREFERENCE_KEYS } from 'payload/shared';
import { ADMIN_GROUPS } from '@/modules/cms/admin/icons';

/** One sidebar / palette entry: plain data, safe to hand to a client component. */
export interface NavEntity {
  type: 'collections' | 'globals';
  slug: string;
  label: string;
  href: string;
}

export interface NavGroup {
  label: string;
  entities: NavEntity[];
}

/** `{ groups: { [label]: { open } } }` — the shape Payload's own nav stores under `nav`. */
export type NavPrefs = { groups?: Record<string, { open?: boolean }> } | null;

/**
 * The entities the signed-in user may open, grouped the way Payload groups them (by the
 * translated `admin.group`), minus `admin.hidden` ones — the same rule the default nav uses,
 * shared by the sidebar and the command palette so they never disagree.
 */
export function navGroups(args: {
  payload: Payload;
  permissions: SanitizedPermissions | undefined;
  user: TypedUser | undefined;
  i18n: I18nClient;
}): NavGroup[] {
  const { payload, permissions, user, i18n } = args;
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
  const order = [ADMIN_GROUPS.content.ar, ADMIN_GROUPS.settings.ar, ADMIN_GROUPS.administration.ar];
  const position = (label: string) => {
    const i = order.indexOf(label as (typeof order)[number]);
    return i === -1 ? order.length : i;
  };
  return groupNavItems(entities, permissions ?? ({} as SanitizedPermissions), i18n)
    .toSorted((a, b) => position(a.label) - position(b.label))
    .map((group) => ({
      label: group.label,
      entities: group.entities.map((e) => ({
        type: e.type === EntityType.collection ? 'collections' : 'globals',
        slug: e.slug,
        label: getTranslation(e.label, i18n),
        href: formatAdminURL({
          adminRoute,
          path: `/${e.type === EntityType.collection ? 'collections' : 'globals'}/${e.slug}`,
        }),
      })),
    }));
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
