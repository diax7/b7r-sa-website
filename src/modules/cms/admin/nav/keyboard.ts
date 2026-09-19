import { fold } from '@/lib/arabic-fold';
import type { NavEntity, NavGroup } from '@/modules/cms/admin/nav/groups';
import { blockEntities, groupBlocks } from '@/modules/cms/admin/nav/order';

/**
 * The sidebar's keyboard model (ADR-058), pure. The tree is one tab stop: Tab lands on the
 * tabbable row (the row focused last, else the current page's entry, else the first) and
 * leaves after it; Arrow Up and Down walk the rows without wrapping, Home and End jump to the
 * ends, a typed character jumps to the next row whose label starts with it, wrapping. Enter
 * and Space are the rows' own (a group's button toggles it, a link opens). The component
 * reads the rows from the DOM in document order and focuses the index this returns.
 */
export interface NavRow {
  key: string;
  label: string;
}

/** The index to focus after `key` on the row at `current`; `null` when the key means nothing here. */
export function nextRowIndex(rows: readonly NavRow[], current: number, key: string): number | null {
  if (rows.length === 0) return null;
  const last = rows.length - 1;
  const at = Math.min(Math.max(current, 0), last);
  switch (key) {
    case 'ArrowDown':
      return Math.min(at + 1, last);
    case 'ArrowUp':
      return Math.max(at - 1, 0);
    case 'Home':
      return 0;
    case 'End':
      return last;
    default:
      return isTypeahead(key) ? rowStartingWith(rows, at, key) : null;
  }
}

/** One printable character, typed without a modifier, is a typeahead. */
export function isTypeahead(key: string): boolean {
  return [...key].length === 1 && key.trim() !== '';
}

/**
 * The next row after `current` whose label starts with `char`, wrapping round; the current
 * row is the last candidate, so typing the same letter cycles. Both sides are folded the
 * way the palette folds (`arabic-fold`), so «ا» finds «أدوات» and "p" finds "Pages".
 */
export function rowStartingWith(
  rows: readonly NavRow[],
  current: number,
  char: string,
): number | null {
  const n = rows.length;
  const wanted = fold(char);
  if (wanted === '') return null;
  for (let step = 1; step <= n; step += 1) {
    const i = (current + step) % n;
    if (fold(rows[i]!.label).startsWith(wanted)) return i;
  }
  return null;
}

/** A row's key: the dashboard, a group, or an entity by type and slug. */
export const rowKey = {
  dashboard: 'dashboard',
  group: (key: string) => `group:${key}`,
  entity: (type: string, slug: string) => `${type}:${slug}`,
};

/**
 * The rows of the tree in document order for the groups as rendered: the dashboard, then
 * each group's row followed by its entries (a section placed first, the primary entries
 * with their secondary ones, a section placed last: `groupBlocks`) when the group is open.
 * A section's heading is not a row.
 */
export function treeRows(
  groups: readonly NavGroup[],
  isOpen: (groupKey: string) => boolean,
  dashboardLabel: string,
): NavRow[] {
  const entityRows = (entities: readonly NavEntity[]): NavRow[] =>
    entities.flatMap((e) => [
      { key: rowKey.entity(e.type, e.slug), label: e.label },
      ...entityRows(e.children),
    ]);
  return [
    { key: rowKey.dashboard, label: dashboardLabel },
    ...groups.flatMap((g) => [
      { key: rowKey.group(g.key), label: g.label },
      ...(isOpen(g.key) ? groupBlocks(g).flatMap((block) => entityRows(blockEntities(block))) : []),
    ]),
  ];
}

/** The one row that carries `tabindex="0"`: the last focused, else the current page's, else the first. */
export function tabbableRow(
  rows: readonly NavRow[],
  activeKey: string | null,
  focusedKey: string | null,
): string | null {
  if (focusedKey !== null && rows.some((r) => r.key === focusedKey)) return focusedKey;
  if (activeKey !== null && rows.some((r) => r.key === activeKey)) return activeKey;
  return rows[0]?.key ?? null;
}
