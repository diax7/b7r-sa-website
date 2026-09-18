'use client';

import { Link } from '@payloadcms/ui';
import { LayoutDashboard, type LucideIcon } from 'lucide-react';
import type { ReactElement } from 'react';
import { Icon } from '@/components/shared/icon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/cn';
import {
  ADMIN_GROUPS,
  entityIcon,
  HUE_CLASSES,
  HUE_DOT_CLASSES,
  HUE_TEXT_CLASSES,
  type Hue,
  NAV_SECTIONS,
} from '@/modules/cms/admin/icons';
import { groupEntities, isActive, isDashboard } from '@/modules/cms/admin/nav/active';
import type { NavEntity, NavGroup } from '@/modules/cms/admin/nav/groups';
import { BadgeMark } from '@/modules/cms/admin/nav/tree';
import type { AdminStrings } from '@/modules/cms/admin/strings';
import { useAdminStrings } from '@/modules/cms/admin/use-admin-strings';

/** Where a flyout or a tooltip opens: away from the rail, which sits at the start edge; Radix's `side` is physical. */
export type AwaySide = 'left' | 'right';

const railButton =
  'relative grid size-[40px] place-items-center rounded-inner text-text-muted transition-colors duration-(--duration-fast) hover:bg-surface-2 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40 data-[state=open]:bg-surface-2';
/** The active group's or the dashboard's icon, and the flyout's active entry, carry the bar on the leading edge. */
const railActive =
  "before:absolute before:inset-y-2 before:start-0 before:w-[3px] before:rounded-pill before:bg-current before:content-['']";

export interface RailProps {
  groups: NavGroup[];
  pathname: string;
  adminRoute: string;
  direction: 'ltr' | 'rtl';
  /** Tooltips and flyouts need the client; the server render carries the labels alone. */
  live: boolean;
}

/**
 * The rail (ADR-058): the sidebar collapsed on a desktop. The dashboard's icon, then one
 * icon per group; a click on a group opens a 224 px flyout with the group's entries (a Radix
 * menu of links: focus moves in, arrows and a typed letter walk it, Esc closes and returns
 * focus). The rail is rendered beside the tree and the stylesheet shows one or the other by
 * the aside's open class, so a collapsed sidebar paints as a rail on the first frame.
 */
export function Rail({ groups, pathname, adminRoute, direction, live }: RailProps) {
  const s = useAdminStrings().nav;
  const side: AwaySide = direction === 'rtl' ? 'left' : 'right';
  const dashboardActive = isDashboard(pathname, adminRoute);
  return (
    <ul className="hidden flex-col items-center gap-1" data-admin-rail-list="">
      <li>
        <WithTooltip label={s.dashboard} side={side} live={live}>
          <Link
            href={adminRoute}
            aria-label={s.dashboard}
            aria-current={dashboardActive ? 'page' : undefined}
            className={cn(railButton, dashboardActive && cn(HUE_TEXT_CLASSES.blue, railActive))}
            data-admin-rail-dashboard=""
          >
            <RailDisc icon={LayoutDashboard} hue="blue" />
          </Link>
        </WithTooltip>
      </li>
      <li aria-hidden="true" className="my-1 h-px w-8 bg-border" />
      {groups.map((group) => (
        <li key={group.key}>
          <RailGroup
            group={group}
            pathname={pathname}
            direction={direction}
            side={side}
            live={live}
            badges={s.badges}
          />
        </li>
      ))}
    </ul>
  );
}

function RailDisc({ icon, hue }: { icon: LucideIcon; hue: Hue }) {
  return (
    <span className={cn('grid size-[28px] place-items-center rounded-inner', HUE_CLASSES[hue])}>
      <Icon icon={icon} size={16} />
    </span>
  );
}

/** A tooltip on an icon-only control once the client is live; the server render keeps the `aria-label` alone. */
export function WithTooltip({
  label,
  side,
  live,
  children,
}: {
  label: string;
  side: AwaySide;
  live: boolean;
  children: ReactElement;
}) {
  if (!live) return children;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
  );
}

function RailGroup({
  group,
  pathname,
  direction,
  side,
  live,
  badges,
}: {
  group: NavGroup;
  pathname: string;
  direction: 'ltr' | 'rtl';
  side: AwaySide;
  live: boolean;
  badges: AdminStrings['nav']['badges'];
}) {
  const active = groupEntities(group).some((e) => isActive(pathname, e.href));
  const attention = groupEntities(group).find((e) => e.badge)?.badge;
  // Not modal: a modal menu marks the rest of the page `aria-hidden`, the rail and its
  // focused trigger included, which axe refuses (an `aria-hidden` element holding focus).
  return (
    <DropdownMenu dir={direction} modal={false}>
      <WithTooltip label={group.label} side={side} live={live}>
        <DropdownMenuTrigger
          aria-label={group.label}
          className={cn(railButton, active && cn(HUE_TEXT_CLASSES[group.hue], railActive))}
          data-admin-rail-group={group.label}
          data-hue={group.hue}
        >
          <RailDisc icon={ADMIN_GROUPS[group.key].icon} hue={group.hue} />
          {attention && (
            <span
              aria-hidden="true"
              className={cn(
                'absolute end-1 top-1 size-[8px] rounded-pill',
                attention.tone === 'error' ? 'bg-error' : 'bg-warning',
              )}
              data-admin-rail-dot={attention.tone}
            />
          )}
        </DropdownMenuTrigger>
      </WithTooltip>
      <DropdownMenuContent
        side={side}
        align="start"
        className="w-[224px]"
        data-admin-ui=""
        data-admin-flyout={group.label}
      >
        <DropdownMenuLabel className="flex items-center gap-2 text-text">
          <span
            aria-hidden="true"
            className={cn('size-[8px] rounded-pill', HUE_DOT_CLASSES[group.hue])}
          />
          <span className="font-semibold">{group.label}</span>
        </DropdownMenuLabel>
        {group.entities.map((entity) => (
          <FlyoutEntry
            key={`${entity.type}-${entity.slug}`}
            entity={entity}
            hue={group.hue}
            pathname={pathname}
            badges={badges}
          />
        ))}
        {group.sections.map((section) => (
          <div key={section.key} data-admin-section={section.key}>
            <DropdownMenuLabel className="flex items-center gap-2">
              <Icon icon={NAV_SECTIONS[section.key].icon} size={14} />
              {section.label}
            </DropdownMenuLabel>
            {section.entities.map((entity) => (
              <FlyoutEntry
                key={`${entity.type}-${entity.slug}`}
                entity={entity}
                hue={group.hue}
                pathname={pathname}
                badges={badges}
                secondary
              />
            ))}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * A flyout entry: a menu item that is a link; secondary entries indented under their parent.
 * The active one carries the hue, weight 500 and the bar, but no tint: the menu sits on the
 * surface, where a hue on its own tint falls under 4.5:1 (the tints are tuned for the page).
 */
function FlyoutEntry({
  entity,
  hue,
  pathname,
  badges,
  secondary = false,
}: {
  entity: NavEntity;
  hue: Hue;
  pathname: string;
  badges: AdminStrings['nav']['badges'];
  secondary?: boolean;
}) {
  const EntityIcon = entityIcon(entity.type, entity.slug);
  const active = isActive(pathname, entity.href);
  return (
    <>
      <DropdownMenuItem
        asChild
        className={cn(
          'relative',
          secondary && 'ms-4 text-caption text-text-muted',
          active && cn(HUE_TEXT_CLASSES[hue], 'font-medium', railActive),
        )}
      >
        <Link
          href={entity.href}
          aria-current={active ? 'page' : undefined}
          data-admin-flyout-entry={entity.slug}
        >
          {EntityIcon && <Icon icon={EntityIcon} size={secondary ? 14 : 16} />}
          <span className="truncate">{entity.label}</span>
          {entity.badge && <BadgeMark badge={entity.badge} strings={badges} />}
        </Link>
      </DropdownMenuItem>
      {entity.children.map((child) => (
        <FlyoutEntry
          key={`${child.type}-${child.slug}`}
          entity={child}
          hue={hue}
          pathname={pathname}
          badges={badges}
          secondary
        />
      ))}
    </>
  );
}
