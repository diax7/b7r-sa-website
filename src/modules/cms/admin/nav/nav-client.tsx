'use client';

/* eslint-disable @next/next/no-img-element -- the brand mark is a plain image in the admin */
import { Hamburger, useNav, usePreferences, useWindowInfo } from '@payloadcms/ui';
import { ChevronDown, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { PREFERENCE_KEYS } from 'payload/shared';
import { useState } from 'react';
import { Icon } from '@/components/shared/icon';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/cn';
import { AccountMenu } from '@/modules/cms/admin/account/account-menu';
import { entityIcon, groupIcon } from '@/modules/cms/admin/icons';
import type { NavGroup, NavPrefs } from '@/modules/cms/admin/nav/groups';
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
  'flex h-10 items-center gap-2.5 rounded-inner text-small text-text transition-colors duration-(--duration-fast) hover:bg-accent-tint focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40';

/**
 * Sidebar contents. The outer element keeps Payload's classes (`nav`, `nav--nav-open`,
 * `nav--nav-animate`, `nav--nav-hydrated`, `nav__scroll`, `nav__header`, `nav__mobile-close`;
 * checked against @payloadcms/next 3.89.0) because the template's grid, the phone drawer and
 * the `inert` state are theirs. Closed on a desktop it does not vanish: it becomes an icon
 * rail (`data-admin-rail`, sized in admin.css) with a tooltip per entry, still usable.
 */
export function NavClient({ groups, prefs, account, adminRoute }: NavClientProps) {
  const { hydrated, navOpen, navRef, setNavOpen, shouldAnimate } = useNav();
  const { breakpoints } = useWindowInfo();
  const { setPreference } = usePreferences();
  const pathname = usePathname();
  // Payload's own toggler stores the state under the `nav` preference; so do we.
  function setOpen(next: boolean) {
    setNavOpen(next);
    void setPreference(PREFERENCE_KEYS.NAV, { open: next }, true);
  }
  // Payload treats widths at or under its `l` breakpoint as a drawer; above it, closed = rail.
  const drawer = breakpoints['l'] !== false;
  const rail = !navOpen && !drawer && hydrated;

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
          <nav aria-label={s.label} className="flex w-full flex-1 flex-col gap-5">
            <div className={cn('flex items-center gap-2.5', rail && 'justify-center')}>
              <a
                href={adminRoute}
                className="flex items-center gap-2.5 rounded-inner py-1 text-text"
                aria-label={s.brand}
              >
                <img
                  src="/images/logo/icon.png"
                  alt=""
                  width={28}
                  height={28}
                  className="size-7 shrink-0"
                />
                {!rail && <span className="text-small font-medium">{s.brand}</span>}
              </a>
              {!rail && !drawer && (
                <IconButton
                  label={s.collapse}
                  onClick={() => setOpen(false)}
                  className="ms-auto"
                  data-admin-collapse=""
                >
                  <Icon icon={PanelLeftClose} size={18} className="mirror-rtl" />
                </IconButton>
              )}
            </div>
            {rail && (
              <IconButton
                label={s.expand}
                onClick={() => setOpen(true)}
                className="mx-auto"
                data-admin-expand=""
              >
                <Icon icon={PanelLeftOpen} size={18} className="mirror-rtl" />
              </IconButton>
            )}

            <div className="flex flex-col gap-1">
              {groups.map((group) => (
                <Group
                  key={group.label}
                  group={group}
                  open={prefs?.groups?.[group.label]?.open !== false}
                  pathname={pathname}
                  rail={rail}
                />
              ))}
            </div>
          </nav>

          {account && (
            <div className="mt-4 border-t border-border pt-4">
              <AccountMenu account={account} adminRoute={adminRoute} compact={rail} />
            </div>
          )}
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

function IconButton({
  label,
  onClick,
  className,
  children,
  ...rest
}: {
  label: string;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
  'data-admin-expand'?: string;
  'data-admin-collapse'?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          aria-label={label}
          className={cn(
            'grid size-9 place-items-center rounded-inner text-text-muted transition-colors duration-(--duration-fast) hover:bg-accent-tint hover:text-text focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40',
            className,
          )}
          {...rest}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

function Group({
  group,
  open,
  pathname,
  rail,
}: {
  group: NavGroup;
  open: boolean;
  pathname: string;
  rail: boolean;
}) {
  const [isOpen, setIsOpen] = useState(open);
  const { setPreference } = usePreferences();
  const GroupIcon = groupIcon(group.label);

  function toggle(next: boolean) {
    setIsOpen(next);
    void setPreference(PREFERENCE_KEYS.NAV, { groups: { [group.label]: { open: next } } }, true);
  }

  if (rail) {
    // The rail shows every entry: a collapsed group would hide what the rail exists to reach.
    return (
      <ul className="flex flex-col items-center gap-0.5 border-t border-border pt-2 first:border-t-0 first:pt-0">
        {group.entities.map((entity) => {
          const EntityIcon = entityIcon(entity.type, entity.slug);
          const active = isActive(pathname, entity.href);
          return (
            <li key={`${entity.type}-${entity.slug}`}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href={entity.href}
                    id={`nav-${entity.type === 'globals' ? 'global-' : ''}${entity.slug}`}
                    aria-label={entity.label}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      link,
                      'w-10 justify-center',
                      active && 'bg-accent-tint text-accent',
                    )}
                  >
                    {EntityIcon && <Icon icon={EntityIcon} size={20} />}
                  </a>
                </TooltipTrigger>
                <TooltipContent side="right">{entity.label}</TooltipContent>
              </Tooltip>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={toggle} data-admin-group={group.label}>
      <CollapsibleTrigger
        className="flex h-9 w-full items-center gap-2 rounded-inner px-2.5 text-caption font-medium text-text-muted transition-colors duration-(--duration-fast) hover:text-text focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40"
        aria-label={`${group.label}: ${s.groupToggle}`}
      >
        {GroupIcon && <Icon icon={GroupIcon} size={16} />}
        <span className="flex-1 text-start">{group.label}</span>
        <Icon
          icon={ChevronDown}
          size={14}
          className={cn(
            'transition-transform duration-(--duration-fast)',
            !isOpen && 'ltr:-rotate-90 rtl:rotate-90',
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul className="flex flex-col gap-0.5 pb-2">
          {group.entities.map((entity) => {
            const EntityIcon = entityIcon(entity.type, entity.slug);
            const active = isActive(pathname, entity.href);
            return (
              <li key={`${entity.type}-${entity.slug}`}>
                <a
                  href={entity.href}
                  id={`nav-${entity.type === 'globals' ? 'global-' : ''}${entity.slug}`}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    link,
                    'ps-8 pe-2.5',
                    active && 'bg-accent-tint font-medium text-accent',
                  )}
                >
                  {EntityIcon && <Icon icon={EntityIcon} size={18} />}
                  <span className="truncate">{entity.label}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}
