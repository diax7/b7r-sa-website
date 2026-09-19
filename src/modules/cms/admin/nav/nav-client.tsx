'use client';

/* eslint-disable @next/next/no-img-element -- the brand mark is a plain image in the admin */
import { Link, useNav, usePreferences, useWindowInfo } from '@payloadcms/ui';
import { ChevronsLeft, ChevronsRight, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { PREFERENCE_KEYS } from 'payload/shared';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Icon } from '@/components/shared/icon';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/cn';
import { AccountMenu } from '@/modules/cms/admin/account/account-menu';
import type { AdminGroupKey } from '@/modules/cms/admin/icons';
import type { GroupState } from '@/modules/cms/admin/nav/active';
import type { NavGroup, NavPrefs } from '@/modules/cms/admin/nav/groups';
import { LanguageSwitch } from '@/modules/cms/admin/nav/language-switch';
import { Rail, WithTooltip } from '@/modules/cms/admin/nav/rail';
import { Tree } from '@/modules/cms/admin/nav/tree';
import { useAdminLanguage, useAdminStrings } from '@/modules/cms/admin/use-admin-strings';

export interface NavClientProps {
  groups: NavGroup[];
  prefs: NavPrefs;
  account: { name: string; email: string; role: string } | null;
  adminRoute: string;
}

/** The header's hamburger (`header/actions-client.tsx`), where focus returns when the drawer closes. */
export const MENU_BUTTON = '[data-admin-menu]';

const iconRow =
  'flex h-[36px] w-full items-center gap-2.5 rounded-inner px-2.5 text-caption text-text-muted transition-colors duration-(--duration-fast) hover:bg-surface-2 hover:text-text focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40';

function fromPrefs(prefs: NavPrefs): Record<string, GroupState> {
  return Object.fromEntries(
    Object.entries(prefs?.groups ?? {}).map(([key, g]) => [key, { open: g.open !== false }]),
  );
}

/**
 * The sidebar (ADR-058): one tree with one breakpoint. Above 1024 px (Payload's `m`) it is
 * inline, open at 264 px or collapsed to the 64 px rail of groups (`rail.tsx`), the state in
 * Payload's `nav` preference; at 1024 px and under it is a drawer over the page, opened by
 * the header's hamburger and closed by its X, Esc, a tap outside or a link in it. The outer
 * element keeps Payload's classes (`nav`, `nav--nav-open`, `nav--nav-animate`,
 * `nav--nav-hydrated`, `nav__scroll`; checked against @payloadcms/next 3.89.0) and its
 * open/closed state is Payload's `useNav`, so the template's grid follows. Payload's own
 * provider closes the nav at or under its `l` breakpoint (1440 px) on hydration and on a
 * resize; between 1025 and 1440 the layout effect below puts the preference back before
 * paint, which is how the 1440 px special case goes. The tree and the rail are both in the
 * markup and `admin.css` shows one by the open class, so the first frame is right without
 * JS; hydration adds what needs it (tooltips, the flyouts, lifting `inert` in the rail).
 */
export function NavClient({ groups, prefs, account, adminRoute }: NavClientProps) {
  const s = useAdminStrings().nav;
  const { direction } = useAdminLanguage();
  const { hydrated, navOpen, navRef, setNavOpen, shouldAnimate } = useNav();
  const { breakpoints } = useWindowInfo();
  const { setPreference } = usePreferences();
  const pathname = usePathname();
  // `undefined` means "not measured yet" and counts as a drawer, so the client-only extras
  // wait for a real measurement (the CSS does not).
  const drawer = breakpoints['m'] !== false;
  const rail = hydrated && !drawer && !navOpen;
  const [groupState, setGroupState] = useState<Record<string, GroupState>>(() => fromPrefs(prefs));
  // The inline state the person chose; the drawer's open/closed is not a preference.
  const wanted = useRef(prefs?.open !== false);
  const closeButton = useRef<HTMLButtonElement>(null);
  const aside = useRef<HTMLElement>(null);
  // Set when the person closes the drawer (X, Esc, the scrim): focus goes back to the
  // hamburger once the page behind is live again; a navigation leaves focus alone.
  const restoreFocus = useRef(false);

  useLayoutEffect(() => {
    if (!hydrated || drawer || navOpen === wanted.current) return;
    setNavOpen(wanted.current);
  }, [hydrated, drawer, navOpen, setNavOpen]);

  // The drawer, while open: focus on its X, the page behind it inert, Esc closes it wherever
  // focus is, and so does a click on any link in it (Payload closes on a navigation under
  // 768 px only, and this component is mounted afresh on every page, so the click is the
  // moment to catch).
  useEffect(() => {
    if (!(drawer && navOpen)) return;
    closeButton.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      event.preventDefault();
      restoreFocus.current = true;
      setNavOpen(false);
    };
    const onClick = (event: MouseEvent) => {
      if ((event.target as Element).closest('a[href]')) setNavOpen(false);
    };
    const el = aside.current;
    document.addEventListener('keydown', onKey);
    el?.addEventListener('click', onClick);
    const wrap = el?.parentElement?.querySelector<HTMLElement>('.template-default__wrap');
    if (wrap) wrap.inert = true;
    return () => {
      document.removeEventListener('keydown', onKey);
      el?.removeEventListener('click', onClick);
      if (wrap) wrap.inert = false;
      if (restoreFocus.current) {
        restoreFocus.current = false;
        document.querySelector<HTMLElement>(MENU_BUTTON)?.focus();
      }
    };
  }, [drawer, navOpen, setNavOpen]);

  // The `nav` preference (Payload's own key) is written whole on every change, from one copy
  // of the state: Payload's merge path batches and caches across writes, and two quick
  // changes (a group, then the sidebar) could lose one. Groups are keyed by their registry
  // key, not their label, so the remembered state survives a change of UI language.
  function persist(nextGroups: Record<string, GroupState>) {
    void setPreference(
      PREFERENCE_KEYS.NAV,
      {
        open: wanted.current,
        groups: Object.fromEntries(
          Object.entries(nextGroups).map(([k, g]) => [k, { open: g.open }]),
        ),
      },
      false,
    );
  }
  function setOpen(next: boolean) {
    wanted.current = next;
    setNavOpen(next);
    persist(groupState);
  }
  function toggleGroup(key: AdminGroupKey, open: boolean) {
    const next = { ...groupState, [key]: { open, toggledAt: pathname } };
    setGroupState(next);
    persist(next);
  }
  function closeDrawer() {
    restoreFocus.current = true;
    setNavOpen(false);
  }

  return (
    <TooltipProvider delayDuration={200}>
      {/* A tap outside the drawer closes it; a sibling of the aside so the drawer's slide (a
          transform) never becomes its containing block. Never shown inline. */}
      <div
        role="presentation"
        hidden={!(drawer && navOpen)}
        onClick={closeDrawer}
        data-admin-scrim=""
      />
      <aside
        id="admin-nav"
        ref={aside}
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
          <nav aria-label={s.label} className="flex w-full flex-1 flex-col gap-3">
            <div className="flex items-center gap-2">
              <button
                ref={closeButton}
                type="button"
                onClick={closeDrawer}
                aria-label={s.closeMenu}
                className="hidden size-[36px] shrink-0 place-items-center rounded-inner text-text hover:bg-surface-2 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40"
                data-admin-drawer-only=""
                data-admin-menu-close=""
              >
                <Icon icon={X} size={20} />
              </button>
              <Link
                href={adminRoute}
                className="flex min-w-0 items-center gap-3 rounded-inner py-1 text-text focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40"
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
                <span className="truncate text-body font-semibold" data-rail-hide="">
                  {s.brand}
                </span>
              </Link>
            </div>
            <Tree
              groups={groups}
              groupState={groupState}
              onToggleGroup={toggleGroup}
              pathname={pathname}
              adminRoute={adminRoute}
            />
            <Rail
              groups={groups}
              pathname={pathname}
              adminRoute={adminRoute}
              direction={direction}
              live={rail}
            />
          </nav>

          <div className="mt-4 flex flex-col gap-2 border-t border-border pt-3">
            <WithTooltip
              label={navOpen ? s.collapse : s.expand}
              side={direction === 'rtl' ? 'left' : 'right'}
              live={rail}
            >
              <button
                type="button"
                onClick={() => setOpen(!navOpen)}
                aria-label={navOpen ? s.collapse : s.expand}
                className={iconRow}
                data-admin-toggle=""
                data-rail-center=""
                {...(navOpen ? { 'data-admin-collapse': '' } : { 'data-admin-expand': '' })}
              >
                <Icon icon={navOpen ? ChevronsLeft : ChevronsRight} size={16} />
                <span data-rail-hide="">{s.collapse}</span>
              </button>
            </WithTooltip>
            {account && (
              <AccountMenu
                account={account}
                adminRoute={adminRoute}
                compact={rail}
                direction={direction}
              />
            )}
            <LanguageSwitch placement="drawer" />
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
