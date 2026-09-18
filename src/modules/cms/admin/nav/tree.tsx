'use client';

import { Link } from '@payloadcms/ui';
import { ChevronDown, LayoutDashboard, type LucideIcon } from 'lucide-react';
import { type FocusEvent, type KeyboardEvent, useRef, useState } from 'react';
import { Icon } from '@/components/shared/icon';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/cn';
import {
  type AdminGroupKey,
  entityIcon,
  HUE_CLASSES,
  HUE_DOT_CLASSES,
  type Hue,
  NAV_SECTIONS,
} from '@/modules/cms/admin/icons';
import {
  activeGroupKey,
  activeRowKey,
  groupIsOpen,
  type GroupState,
  isActive,
} from '@/modules/cms/admin/nav/active';
import type { NavBadge } from '@/modules/cms/admin/nav/badges';
import type { NavEntity, NavGroup } from '@/modules/cms/admin/nav/groups';
import { nextRowIndex, rowKey, tabbableRow, treeRows } from '@/modules/cms/admin/nav/keyboard';
import type { AdminStrings } from '@/modules/cms/admin/strings';
import { useAdminStrings } from '@/modules/cms/admin/use-admin-strings';

const row =
  'relative flex w-full items-center gap-2.5 rounded-inner text-start transition-colors duration-(--duration-fast) hover:bg-surface-2 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40';
/** A group's row: 40 px, weight 600, the colour dot before the name, the chevron at the end. */
const groupRow = cn(row, 'h-[40px] px-2.5 text-small font-semibold text-text');
/** An entry: 36 px with the 24 px disc in the group's hue. */
const entryRow = cn(row, 'h-[36px] ps-2.5 pe-2 text-small text-text');
/** A secondary entry: 32 px, 13 px, no disc, under the 2 px guide line of its block. */
const subRow = cn(row, 'h-[32px] ps-2 pe-2 text-caption text-text-muted hover:text-text');
/** The active entry: its group's tint, weight 500, a 3 px bar on the leading edge in its hue. */
const activeRow =
  "font-medium before:absolute before:inset-y-2 before:start-0 before:w-[3px] before:rounded-pill before:bg-current before:content-['']";
/** The indented block of secondary entries, with its guide line under the parent's disc. */
const subList = 'ms-[19px] flex flex-col gap-0.5 border-s-2 border-border ps-1.5';

/** The ids the e2e reads: `nav-<slug>`, `nav-global-<slug>`, `nav-view-<slug>`. */
export const entityId = (e: Pick<NavEntity, 'type' | 'slug'>) =>
  `nav-${e.type === 'globals' ? 'global-' : e.type === 'views' ? 'view-' : ''}${e.slug}`;

type BadgeStrings = AdminStrings['nav']['badges'];

export interface TreeProps {
  groups: NavGroup[];
  groupState: Record<string, GroupState>;
  onToggleGroup: (key: AdminGroupKey, open: boolean) => void;
  pathname: string;
  adminRoute: string;
}

/**
 * The tree (ADR-058): the dashboard as a real entry, then the five groups, each a row that
 * toggles its entries; the same markup serves the open sidebar and the drawer (the drawer's
 * 44 px rows are CSS). One tab stop: the rows carry a roving `tabindex`; Arrow Up and Down,
 * Home, End and a typed letter move focus (`keyboard.ts`); Enter and Space are the rows'
 * own. The active entry carries `aria-current="page"` and its group is forced open.
 */
export function Tree({ groups, groupState, onToggleGroup, pathname, adminRoute }: TreeProps) {
  const s = useAdminStrings().nav;
  const ref = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState<{ key: string; at: string } | null>(null);
  const activeGroup = activeGroupKey(groups, pathname);
  const isOpen = (key: string) => groupIsOpen(groupState[key], key === activeGroup, pathname);
  const rows = treeRows(groups, isOpen, s.dashboard);
  const activeKey = activeRowKey(groups, pathname, adminRoute);
  const tabbable = tabbableRow(rows, activeKey, focused?.at === pathname ? focused.key : null);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
    const key = rowOf(event.target);
    if (!key) return;
    const next = nextRowIndex(
      rows,
      rows.findIndex((r) => r.key === key),
      event.key,
    );
    if (next === null) return;
    event.preventDefault();
    ref.current
      ?.querySelector<HTMLElement>(`[data-admin-row="${CSS.escape(rows[next]!.key)}"]`)
      ?.focus();
  }

  function onFocus(event: FocusEvent<HTMLDivElement>) {
    const key = rowOf(event.target);
    if (key && key !== focused?.key) setFocused({ key, at: pathname });
  }

  const dashboardActive = activeKey === rowKey.dashboard;
  return (
    <div
      ref={ref}
      role="presentation"
      className="flex flex-col"
      data-admin-tree=""
      onKeyDown={onKeyDown}
      onFocus={onFocus}
    >
      <Link
        href={adminRoute}
        id="nav-dashboard"
        aria-current={dashboardActive ? 'page' : undefined}
        className={cn(entryRow, dashboardActive && cn(HUE_CLASSES.blue, activeRow))}
        data-admin-row={rowKey.dashboard}
        data-admin-entry="primary"
        data-hue="blue"
        tabIndex={tabbable === rowKey.dashboard ? 0 : -1}
      >
        <Disc icon={LayoutDashboard} hue="blue" active={dashboardActive} />
        <span className="truncate">{s.dashboard}</span>
      </Link>
      {groups.map((group) => (
        <Group
          key={group.key}
          group={group}
          open={isOpen(group.key)}
          onToggle={(next) => onToggleGroup(group.key, next)}
          pathname={pathname}
          tabbable={tabbable}
          badges={s.badges}
        />
      ))}
    </div>
  );
}

function rowOf(target: EventTarget): string | undefined {
  return (target as HTMLElement).closest<HTMLElement>('[data-admin-row]')?.dataset['adminRow'];
}

/** The 24 px disc of an entry: the group's tint, solid in the hue when the entry is active. */
function Disc({ icon, hue, active }: { icon: LucideIcon; hue: Hue; active: boolean }) {
  return (
    <span
      className={cn(
        'grid size-[24px] shrink-0 place-items-center rounded-inner',
        active ? cn(HUE_DOT_CLASSES[hue], 'text-ground') : HUE_CLASSES[hue],
      )}
    >
      <Icon icon={icon} size={14} />
    </span>
  );
}

function Group({
  group,
  open,
  onToggle,
  pathname,
  tabbable,
  badges,
}: {
  group: NavGroup;
  open: boolean;
  onToggle: (next: boolean) => void;
  pathname: string;
  tabbable: string | null;
  badges: BadgeStrings;
}) {
  const buttonId = `nav-group-${group.key}`;
  const key = rowKey.group(group.key);
  return (
    <Collapsible
      open={open}
      onOpenChange={onToggle}
      className="mt-2 border-t border-border pt-2"
      data-admin-group={group.label}
      data-hue={group.hue}
    >
      <CollapsibleTrigger
        id={buttonId}
        className={groupRow}
        data-admin-row={key}
        data-admin-group-toggle=""
        tabIndex={tabbable === key ? 0 : -1}
      >
        <span
          aria-hidden="true"
          className={cn('size-[8px] shrink-0 rounded-pill', HUE_DOT_CLASSES[group.hue])}
        />
        <span className="flex-1 truncate">{group.label}</span>
        <Icon
          icon={ChevronDown}
          size={16}
          className={cn(
            'text-text-muted transition-transform duration-(--duration-fast)',
            !open && 'ltr:-rotate-90 rtl:rotate-90',
          )}
        />
      </CollapsibleTrigger>
      {/* A `div` with the group role around a plain list: an `li` under a `ul` whose role is
          overridden fails axe's list rule, so the group owns the list rather than being it. */}
      <CollapsibleContent role="group" aria-labelledby={buttonId} className="animate-none py-1">
        <ul className="flex flex-col gap-0.5">
          {group.entities.map((entity) => (
            <Entry
              key={`${entity.type}-${entity.slug}`}
              entity={entity}
              hue={group.hue}
              pathname={pathname}
              tabbable={tabbable}
              badges={badges}
            />
          ))}
          {group.sections.map((section) => (
            <li key={section.key} data-admin-section={section.key}>
              <div className="flex h-[32px] items-center gap-2 ps-2.5 text-caption font-medium text-text-muted">
                <Icon icon={NAV_SECTIONS[section.key].icon} size={14} />
                <span className="truncate">{section.label}</span>
              </div>
              <ul className={subList} aria-label={section.label}>
                {section.entities.map((entity) => (
                  <Entry
                    key={`${entity.type}-${entity.slug}`}
                    entity={entity}
                    hue={group.hue}
                    pathname={pathname}
                    tabbable={tabbable}
                    badges={badges}
                    secondary
                  />
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}

/**
 * One entry and its secondary entries under it. The label is the accessible name; a badge
 * adds its sentence after it for a screen reader and shows the number to the eye.
 */
function Entry({
  entity,
  hue,
  pathname,
  tabbable,
  badges,
  secondary = false,
}: {
  entity: NavEntity;
  hue: Hue;
  pathname: string;
  tabbable: string | null;
  badges: BadgeStrings;
  secondary?: boolean;
}) {
  const EntityIcon = entityIcon(entity.type, entity.slug);
  const active = isActive(pathname, entity.href);
  const key = rowKey.entity(entity.type, entity.slug);
  return (
    <li>
      <Link
        href={entity.href}
        id={entityId(entity)}
        aria-current={active ? 'page' : undefined}
        className={cn(secondary ? subRow : entryRow, active && cn(HUE_CLASSES[hue], activeRow))}
        data-admin-row={key}
        data-admin-entry={secondary ? 'secondary' : 'primary'}
        data-hue={hue}
        tabIndex={tabbable === key ? 0 : -1}
      >
        {EntityIcon &&
          (secondary ? (
            <Icon icon={EntityIcon} size={14} />
          ) : (
            <Disc icon={EntityIcon} hue={hue} active={active} />
          ))}
        <span className="truncate">{entity.label}</span>
        {entity.badge && <BadgeMark badge={entity.badge} strings={badges} />}
      </Link>
      {entity.children.length > 0 && (
        <ul className={subList}>
          {entity.children.map((child) => (
            <Entry
              key={`${child.type}-${child.slug}`}
              entity={child}
              hue={hue}
              pathname={pathname}
              tabbable={tabbable}
              badges={badges}
              secondary
            />
          ))}
        </ul>
      )}
    </li>
  );
}

/** A count that asks for action (ADR-058): red or amber, never grey; the sentence for readers. */
export function BadgeMark({ badge, strings }: { badge: NavBadge; strings: BadgeStrings }) {
  return (
    <span
      className={cn(
        'ms-auto inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-pill px-1.5 text-[11px] font-semibold text-ground tabular-nums',
        badge.tone === 'error' ? 'bg-error' : 'bg-warning',
      )}
      data-admin-badge={badge.tone}
    >
      <span aria-hidden="true">{badge.count}</span>
      <span className="sr-only">{`, ${strings[badge.kind](badge.count)}`}</span>
    </span>
  );
}
