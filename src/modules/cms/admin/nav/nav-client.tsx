'use client';

/* eslint-disable @next/next/no-img-element -- the brand mark is a plain image in the admin */
import { Hamburger, useNav, usePreferences } from '@payloadcms/ui';
import { ChevronDown, Search } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { PREFERENCE_KEYS } from 'payload/shared';
import { useState } from 'react';
import { Icon } from '@/components/shared/icon';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Kbd } from '@/components/ui/kbd';
import { cn } from '@/lib/cn';
import { AccountMenu } from '@/modules/cms/admin/account/account-menu';
import { ACTION_ICONS, entityIcon, groupIcon } from '@/modules/cms/admin/icons';
import type { NavGroup, NavPrefs } from '@/modules/cms/admin/nav/groups';
import { PALETTE_EVENT } from '@/modules/cms/admin/header/palette-event';
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

/**
 * Sidebar contents. The outer element keeps Payload's classes — `nav`, `nav--nav-open`,
 * `nav--nav-animate`, `nav--nav-hydrated`, `nav__scroll`, `nav__header`, `nav__mobile-close`
 * (checked against @payloadcms/next 3.89.0) — because the template's grid, the mobile
 * slide-in and the `inert` state are theirs; everything inside is ours.
 */
export function NavClient({ groups, prefs, account, adminRoute }: NavClientProps) {
  const { hydrated, navOpen, navRef, setNavOpen, shouldAnimate } = useNav();
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'nav',
        navOpen && 'nav--nav-open',
        shouldAnimate && 'nav--nav-animate',
        hydrated && 'nav--nav-hydrated',
      )}
      inert={!navOpen ? true : undefined}
      data-admin-ui=""
      data-admin-nav=""
    >
      <div className="nav__scroll flex flex-col" ref={navRef}>
        <nav aria-label={s.label} className="flex w-full flex-1 flex-col gap-5">
          <a href={adminRoute} className="flex items-center gap-2.5 rounded-inner py-1 text-text">
            <img src="/images/logo/icon.png" alt="" width={28} height={28} className="size-7" />
            <span className="text-small font-medium">{s.brand}</span>
          </a>

          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent(PALETTE_EVENT))}
            className="flex h-10 w-full items-center gap-2.5 rounded-inner border border-border bg-ground px-3 text-small text-text-muted transition-colors duration-(--duration-fast) hover:border-text-muted/60 hover:text-text focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40"
            data-admin-search=""
          >
            <Icon icon={Search} size={16} />
            <span className="flex-1 text-start">{s.search}</span>
            <span className="hidden items-center gap-1 sm:flex">
              <Kbd>Ctrl</Kbd>
              <Kbd>K</Kbd>
            </span>
          </button>

          <div className="flex flex-col gap-1">
            {groups.map((group) => (
              <Group
                key={group.label}
                group={group}
                open={prefs?.groups?.[group.label]?.open !== false}
                pathname={pathname}
              />
            ))}
          </div>

          <a
            href="/"
            target="_blank"
            rel="noopener"
            className="mt-auto flex h-10 items-center gap-2.5 rounded-inner px-2.5 text-small text-text-muted transition-colors duration-(--duration-fast) hover:bg-accent-tint hover:text-text focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40"
            data-admin-view-site=""
          >
            <Icon icon={ACTION_ICONS.viewSite} size={18} />
            <span>{s.viewSite}</span>
          </a>
        </nav>

        {account && (
          <div className="mt-4 border-t border-border pt-4">
            <AccountMenu account={account} adminRoute={adminRoute} />
          </div>
        )}
      </div>

      {/* Mobile: the close control Payload positions over the header. */}
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
  );
}

function Group({ group, open, pathname }: { group: NavGroup; open: boolean; pathname: string }) {
  const [isOpen, setIsOpen] = useState(open);
  const { setPreference } = usePreferences();
  const GroupIcon = groupIcon(group.label);

  function toggle(next: boolean) {
    setIsOpen(next);
    void setPreference(PREFERENCE_KEYS.NAV, { groups: { [group.label]: { open: next } } }, true);
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
            !isOpen && 'rtl:rotate-90 ltr:-rotate-90',
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
                    'flex h-10 items-center gap-2.5 rounded-inner ps-8 pe-2.5 text-small text-text transition-colors duration-(--duration-fast) hover:bg-accent-tint focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40',
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
