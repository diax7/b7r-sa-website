'use client';

import { useLocale, useNav, useWindowInfo } from '@payloadcms/ui';
import { Menu, Search } from 'lucide-react';
import { type ReactElement, useEffect } from 'react';
import { Icon } from '@/components/shared/icon';
import { Kbd } from '@/components/ui/kbd';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/cn';
import { ACTION_ICONS } from '@/modules/cms/admin/icons';
import { Palette, type PaletteProps } from '@/modules/cms/admin/header/palette';
import { PALETTE_EVENT } from '@/modules/cms/admin/header/palette-event';
import { useAdminStrings } from '@/modules/cms/admin/use-admin-strings';

const control =
  'flex h-9 items-center gap-2 rounded-inner border border-border bg-surface px-3 text-small text-text-muted transition-[width,color,border-color] duration-(--duration-fast) hover:border-text-muted/60 hover:text-text focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40';

/** A tooltip on a control while it shows its icon alone (the icon-only rule); nothing when its text is visible. */
function IconTooltip({
  label,
  when,
  children,
}: {
  label: string;
  when: boolean;
  children: ReactElement;
}) {
  if (!when) return children;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

/**
 * Payload's header, our controls (Dhia, 2026-09-13; ADR-058): the hamburger that opens the
 * drawer at 1024 px and under (the stylesheet places it at the leading edge of the header
 * and hides it above; the drawer, which covers the header, carries the X at the same spot),
 * a bordered search box that opens the palette (240 px, growing on focus), and a bordered
 * "View website" link. At the drawer widths the two controls fold to icons (Payload caps
 * the actions at 300 px there) and, icon-only, carry a tooltip beside their label; the
 * palette still answers Ctrl/⌘ K everywhere.
 */
export function HeaderActionsClient(props: PaletteProps) {
  const s = useAdminStrings();
  const { navOpen, setNavOpen } = useNav();
  // Payload's `m` (1024 px): at or under it the two controls are icons (undefined, before
  // the first measurement, counts as icons; the tooltip is harmless beside visible text).
  const iconsOnly = useWindowInfo().breakpoints['m'] !== false;
  // The content locale on the document root (ADR-044): `admin.css` draws the AR/EN pill on
  // localized field labels from it; the header is on every view, so drawers inherit it. It
  // is the locale of the content being edited, not the UI language (ADR-056): switching the
  // panel to Arabic leaves it alone, and the pills leave the panel's language alone.
  const { code } = useLocale();
  useEffect(() => {
    document.documentElement.dataset['contentLocale'] = code;
  }, [code]);
  const menuLabel = navOpen ? s.nav.closeMenu : s.nav.openMenu;
  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center gap-2" data-admin-ui="" data-admin-actions="">
        {/* No tooltip while the drawer covers the button: an open tooltip takes the Esc
            that should close the drawer. */}
        <IconTooltip label={menuLabel} when={iconsOnly && !navOpen}>
          <button
            type="button"
            onClick={() => setNavOpen(!navOpen)}
            aria-label={menuLabel}
            aria-expanded={navOpen}
            aria-controls="admin-nav"
            className="hidden size-[36px] place-items-center rounded-inner text-text transition-colors duration-(--duration-fast) hover:bg-surface-2 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40"
            data-admin-menu=""
          >
            <Icon icon={Menu} size={20} />
          </button>
        </IconTooltip>
        <IconTooltip label={s.header.searchAria} when={iconsOnly}>
          <button
            type="button"
            className={cn(
              control,
              'w-9 justify-center px-0 min-[1025px]:w-[240px] min-[1025px]:justify-start min-[1025px]:px-3 min-[1025px]:focus-visible:w-[320px]',
            )}
            aria-label={s.header.searchAria}
            onClick={() => window.dispatchEvent(new CustomEvent(PALETTE_EVENT))}
            data-admin-palette-trigger=""
          >
            <Icon icon={Search} size={16} className="shrink-0" />
            <span className="hidden flex-1 truncate text-start min-[1025px]:inline">
              {s.header.search}
            </span>
            <span className="hidden items-center gap-1 min-[1025px]:flex">
              <Kbd>Ctrl</Kbd>
              <Kbd>K</Kbd>
            </span>
          </button>
        </IconTooltip>
        <IconTooltip label={s.header.viewSite} when={iconsOnly}>
          <a
            href="/"
            target="_blank"
            rel="noopener"
            className={cn(control, 'w-9 justify-center px-0 min-[1025px]:w-auto min-[1025px]:px-3')}
            aria-label={s.header.viewSite}
            data-admin-view-site=""
          >
            <Icon icon={ACTION_ICONS.viewSite} size={16} className="shrink-0" />
            <span className="hidden min-[1025px]:inline">{s.header.viewSite}</span>
          </a>
        </IconTooltip>
      </div>
      <Palette {...props} />
    </TooltipProvider>
  );
}
