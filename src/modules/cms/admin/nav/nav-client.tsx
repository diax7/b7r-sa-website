'use client';

/* eslint-disable @next/next/no-img-element -- the brand mark is a plain image in the admin */
import { Hamburger, Link, useNav, usePreferences, useWindowInfo } from '@payloadcms/ui';
import { ChevronDown, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { PREFERENCE_KEYS } from 'payload/shared';
import { useRef, useState } from 'react';
import { Icon } from '@/components/shared/icon';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/cn';
import { AccountMenu } from '@/modules/cms/admin/account/account-menu';
import {
  ADMIN_GROUPS,
  entityIcon,
  HUE_CLASSES,
  type Hue,
  NAV_SECTIONS,
} from '@/modules/cms/admin/icons';
import type { NavEntity, NavGroup, NavPrefs } from '@/modules/cms/admin/nav/groups';
import { adminStrings } from '@/modules/cms/admin/strings';

export interface NavClientProps {
  groups: NavGroup[];
  prefs: NavPrefs;
  account: { name: string; email: string; role: string } | null;
  adminRoute: string;
}

const s = adminStrings.nav;

/** Payload's rule for the highlighted entry: the path or one of its sub-routes. */
function isActive(pathname: string, href: string): boolean {
  return pathname.startsWith(href) && ['/', undefined].includes(pathname[href.length]);
}

const link =
  'flex h-10 items-center gap-2.5 rounded-inner ps-2.5 pe-2.5 text-small text-text transition-colors duration-(--duration-fast) hover:bg-surface-2 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40';

/** A secondary entry: indented under its parent, a small icon and no disc. */
const subLink =
  'flex h-9 items-center gap-2.5 rounded-inner ps-12 pe-2.5 text-small text-text-muted transition-colors duration-(--duration-fast) hover:bg-surface-2 hover:text-text focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40';

/** The active entry sits on its group's tint (ADR-046): identity, with weight and aria-current. */
const activeLink = (hue: Hue) => `${HUE_CLASSES[hue]} font-medium`;

const iconButton =
  'grid size-9 place-items-center rounded-inner text-text-muted transition-colors duration-(--duration-fast) hover:bg-accent-tint hover:text-text focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40';

/**
 * Sidebar contents. The outer element keeps Payload's classes (`nav`, `nav--nav-open`,
 * `nav--nav-animate`, `nav--nav-hydrated`, `nav__scroll`, `nav__header`, `nav__mobile-close`;
 * checked against @payloadcms/next 3.89.0) because the template's grid, the phone drawer and
 * the `inert` state are theirs.
 *
 * Closed on a desktop the sidebar is an icon rail, still usable. The rail is CSS, not a
 * second markup: the server renders the same tree open or closed, and `admin.css` hides
 * `[data-rail-hide]` and shows `[data-rail-show]` when the aside is closed above Payload's
 * `l` breakpoint, so a collapsed sidebar paints as a rail on the first frame of every page
 * with no shift. Hydration only adds what needs JS: tooltips and lifting `inert` (Payload
 * marks a closed nav inert for the phone drawer). Links are Payload's `Link` (Next's, with
 * the route transition bar), so a click never reloads the admin.
 */
export function NavClient({ groups, prefs, account, adminRoute }: NavClientProps) {
  const { hydrated, navOpen, navRef, setNavOpen, shouldAnimate } = useNav();
  const { breakpoints } = useWindowInfo();
  const { setPreference } = usePreferences();
  const pathname = usePathname();
  // Payload treats widths at or under its `l` breakpoint (1440 px) as a drawer; above it,
  // closed = rail. `undefined` means "not measured yet" and counts as a drawer, so the JS
  // extras wait for a real measurement (the CSS rail does not).
  const drawer = breakpoints['l'] !== false;
  const rail = !navOpen && !drawer && hydrated;
  // The `nav` preference (Payload's own key) is written whole on every change, from one copy
  // of the state: Payload's merge path batches and caches across writes, and two quick
  // changes (a group, then the sidebar) could lose one.
  const state = useRef<{ open: boolean; groups: Record<string, { open: boolean }> }>({
    open: navOpen,
    groups: Object.fromEntries(
      Object.entries(prefs?.groups ?? {}).map(([label, g]) => [label, { open: g.open !== false }]),
    ),
  });
  function persist(patch: Partial<typeof state.current>) {
    state.current = { ...state.current, ...patch };
    void setPreference(PREFERENCE_KEYS.NAV, state.current, false);
  }
  function setOpen(next: boolean) {
    setNavOpen(next);
    persist({ open: next });
  }
  function setGroupOpen(label: string, next: boolean) {
    persist({ groups: { ...state.current.groups, [label]: { open: next } } });
  }

  return (
    <TooltipProvider delayDuration={200}>
      <aside
        className={cn(
          'nav',
          navOpen && 'nav--nav-open',
          shouldAnimate && 'nav--nav-animate',
          hydrated && 'nav--nav-hydrated',
        )}
        inert={!navOpen && !rail ? true : undefined}
        data-admin-ui=""
        data-admin-nav=""
        data-admin-rail={rail ? '' : undefined}
      >
        <div className="nav__scroll flex flex-col" ref={navRef}>
          <nav aria-label={s.label} className="flex w-full flex-1 flex-col gap-4">
            <Link
              href={adminRoute}
              className="flex items-center gap-3 rounded-inner py-1 text-text"
              aria-label={s.brand}
              data-rail-center=""
            >
              <img
                src="/images/logo/icon.png"
                alt=""
                width={32}
                height={32}
                className="size-8 shrink-0"
              />
              <span className="text-body font-semibold" data-rail-hide="">
                {s.brand}
              </span>
            </Link>

            <div className="flex flex-col gap-1">
              {groups.map((group) => (
                <Group
                  key={group.label}
                  group={group}
                  open={prefs?.groups?.[group.label]?.open !== false}
                  onToggle={(next) => setGroupOpen(group.label, next)}
                  pathname={pathname}
                  rail={rail}
                />
              ))}
            </div>
          </nav>

          <div className="mt-6 flex flex-col gap-2 border-t border-border pt-3">
            <div className="flex items-center" data-rail-center="" data-admin-toggle="">
              <RailButton
                label={s.collapse}
                onClick={() => setOpen(false)}
                data-rail-hide=""
                data-admin-collapse=""
                tooltip={rail}
              >
                <Icon icon={PanelLeftClose} size={18} className="mirror-rtl" />
              </RailButton>
              <RailButton
                label={s.expand}
                onClick={() => setOpen(true)}
                className="hidden"
                data-rail-show=""
                data-admin-expand=""
                tooltip={rail}
              >
                <Icon icon={PanelLeftOpen} size={18} className="mirror-rtl" />
              </RailButton>
            </div>
            {account && <AccountMenu account={account} adminRoute={adminRoute} compact={rail} />}
          </div>
        </div>

        {/* Phone: the close control Payload positions over the header. */}
        <div className="nav__header">
          <div className="nav__header-content">
            <button
              type="button"
              className="nav__mobile-close"
              onClick={() => setNavOpen(false)}
              tabIndex={!navOpen ? -1 : undefined}
              aria-label={s.closeMenu}
            >
              <Hamburger isActive />
            </button>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}

function RailButton({
  label,
  onClick,
  className,
  tooltip,
  children,
  ...rest
}: {
  label: string;
  onClick: () => void;
  className?: string | undefined;
  /** Tooltips need the client; the server render carries the aria-label alone. */
  tooltip: boolean;
  children: React.ReactNode;
  'data-rail-hide'?: string;
  'data-rail-show'?: string;
  'data-admin-expand'?: string;
  'data-admin-collapse'?: string;
}) {
  const button = (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(iconButton, className)}
      {...rest}
    >
      {children}
    </button>
  );
  if (!tooltip) return button;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

function Group({
  group,
  open,
  onToggle,
  pathname,
  rail,
}: {
  group: NavGroup;
  open: boolean;
  onToggle: (next: boolean) => void;
  pathname: string;
  rail: boolean;
}) {
  const [isOpen, setIsOpen] = useState(open);
  const GroupIcon = ADMIN_GROUPS[group.key].icon;

  function toggle(next: boolean) {
    setIsOpen(next);
    onToggle(next);
  }

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={toggle}
      data-admin-group={group.label}
      data-hue={group.hue}
    >
      <CollapsibleTrigger
        className="flex h-9 w-full items-center gap-2.5 rounded-inner px-2.5 text-caption font-semibold tracking-wide text-text uppercase transition-colors duration-(--duration-fast) hover:bg-surface-2 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40"
        aria-label={`${group.label}: ${s.groupToggle}`}
        data-rail-hide=""
      >
        <span
          className={cn(
            'grid size-6 shrink-0 place-items-center rounded-inner',
            HUE_CLASSES[group.hue],
          )}
        >
          <Icon icon={GroupIcon} size={13} />
        </span>
        <span className="flex-1 text-start">{group.label}</span>
        <Icon
          icon={ChevronDown}
          size={14}
          className={cn(
            'text-text-muted transition-transform duration-(--duration-fast)',
            !isOpen && 'ltr:-rotate-90 rtl:rotate-90',
          )}
        />
      </CollapsibleTrigger>
      {/* Mounted while closed so the rail (which ignores group state) still lists every entry. */}
      <CollapsibleContent forceMount className="data-[state=closed]:hidden" data-rail-show="">
        <ul className="flex flex-col gap-0.5 pb-2" data-rail-list="">
          {group.entities.map((entity) => (
            <Entry
              key={`${entity.type}-${entity.slug}`}
              entity={entity}
              hue={group.hue}
              pathname={pathname}
              rail={rail}
            />
          ))}
          {group.sections.map((section) => {
            const SectionIcon = NAV_SECTIONS[section.key].icon;
            return (
              <li key={section.key} data-admin-section={section.key}>
                <div
                  className="flex h-8 items-center gap-2 ps-8 pe-2.5 text-caption font-medium tracking-wide text-text-muted uppercase"
                  data-rail-hide=""
                >
                  <Icon icon={SectionIcon} size={12} />
                  <span>{section.label}</span>
                </div>
                <ul className="flex flex-col gap-0.5" data-rail-list="">
                  {section.entities.map((entity) => (
                    <Entry
                      key={`${entity.type}-${entity.slug}`}
                      entity={entity}
                      hue={group.hue}
                      pathname={pathname}
                      rail={rail}
                      secondary
                    />
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}

/**
 * One entry, and its secondary entries under it. A primary entry carries the entity's icon
 * in a disc of the group's hue and the collection's count; a secondary one is indented with
 * a small icon. The label is the visible text when open and the only name in the rail, where
 * the CSS hides the span before any JS runs.
 */
function Entry({
  entity,
  hue,
  pathname,
  rail,
  secondary = false,
}: {
  entity: NavEntity;
  hue: Hue;
  pathname: string;
  rail: boolean;
  secondary?: boolean;
}) {
  const EntityIcon = entityIcon(entity.type, entity.slug);
  const active = isActive(pathname, entity.href);
  const anchor = (
    <Link
      href={entity.href}
      id={`nav-${entity.type === 'globals' ? 'global-' : ''}${entity.slug}`}
      aria-current={active ? 'page' : undefined}
      aria-label={entity.label}
      className={cn(secondary ? subLink : link, active && activeLink(hue))}
      data-rail-center=""
      data-hue={hue}
      data-admin-entry={secondary ? 'secondary' : 'primary'}
    >
      {secondary ? (
        EntityIcon && <Icon icon={EntityIcon} size={14} className="shrink-0" />
      ) : (
        <span
          className={cn('grid size-7 shrink-0 place-items-center rounded-inner', HUE_CLASSES[hue])}
        >
          {EntityIcon && <Icon icon={EntityIcon} size={15} />}
        </span>
      )}
      <span className="truncate" data-rail-hide="">
        {entity.label}
      </span>
      {entity.count !== undefined && (
        <span
          className="ms-auto text-caption text-text-muted tabular-nums"
          data-rail-hide=""
          data-admin-count=""
        >
          {entity.count}
        </span>
      )}
    </Link>
  );
  return (
    <li>
      {rail ? (
        <Tooltip>
          <TooltipTrigger asChild>{anchor}</TooltipTrigger>
          <TooltipContent side="right">{entity.label}</TooltipContent>
        </Tooltip>
      ) : (
        anchor
      )}
      {entity.children.length > 0 && (
        <ul className="flex flex-col gap-0.5" data-rail-list="">
          {entity.children.map((child) => (
            <Entry
              key={`${child.type}-${child.slug}`}
              entity={child}
              hue={hue}
              pathname={pathname}
              rail={rail}
              secondary
            />
          ))}
        </ul>
      )}
    </li>
  );
}
