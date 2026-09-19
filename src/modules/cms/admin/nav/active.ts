import type { NavEntity, NavGroup } from '@/modules/cms/admin/nav/groups';
import { rowKey } from '@/modules/cms/admin/nav/keyboard';
import { blockEntities, groupBlocks } from '@/modules/cms/admin/nav/order';

/**
 * Which entry is the current page, and whether a group is open (ADR-058), pure.
 */

/** Payload's rule for the highlighted entry: the path or one of its sub-routes. */
export function isActive(pathname: string, href: string): boolean {
  return pathname.startsWith(href) && ['/', undefined].includes(pathname[href.length]);
}

const untrailed = (path: string) => path.replace(/\/+$/, '');

/** The dashboard is the admin route itself, nothing under it: every admin path starts with it. */
export function isDashboard(pathname: string, adminRoute: string): boolean {
  return untrailed(pathname) === untrailed(adminRoute);
}

const withChildren = (entities: NavEntity[]): NavEntity[] =>
  entities.flatMap((e) => [e, ...withChildren(e.children)]);

/** The entries of a group in document order, secondary ones after their parent, the sections where they are placed. */
export function groupEntities(group: NavGroup): NavEntity[] {
  return groupBlocks(group).flatMap((block) => withChildren(blockEntities(block)));
}

/** The row of the current page: the dashboard on the admin route, else the first entry whose route matches. */
export function activeRowKey(
  groups: readonly NavGroup[],
  pathname: string,
  adminRoute: string,
): string | null {
  if (isDashboard(pathname, adminRoute)) return rowKey.dashboard;
  for (const group of groups) {
    const hit = groupEntities(group).find((e) => isActive(pathname, e.href));
    if (hit) return rowKey.entity(hit.type, hit.slug);
  }
  return null;
}

/** The group that holds the current page, if any. */
export function activeGroupKey(groups: readonly NavGroup[], pathname: string): string | null {
  return groups.find((g) => groupEntities(g).some((e) => isActive(pathname, e.href)))?.key ?? null;
}

/** A group's remembered state: open unless closed, and the page it was last toggled on. */
export interface GroupState {
  open: boolean;
  toggledAt?: string;
}

/**
 * A group shows open when the person opened it (or never closed it), and always when it
 * holds the current page, unless the person closed it on this very page: a click is the
 * last word until the next navigation.
 */
export function groupIsOpen(
  state: GroupState | undefined,
  holdsActive: boolean,
  pathname: string,
): boolean {
  if (state?.toggledAt === pathname) return state.open;
  return holdsActive || state?.open !== false;
}
