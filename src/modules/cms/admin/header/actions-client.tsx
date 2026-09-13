'use client';

import { Search } from 'lucide-react';
import { Icon } from '@/components/shared/icon';
import { Kbd } from '@/components/ui/kbd';
import { ACTION_ICONS } from '@/modules/cms/admin/icons';
import { Palette, type PaletteProps } from '@/modules/cms/admin/header/palette';
import { PALETTE_EVENT } from '@/modules/cms/admin/header/palette-event';
import { adminStrings } from '@/modules/cms/admin/strings';

const s = adminStrings.header;

const control =
  'flex h-9 items-center gap-2 rounded-inner border border-border bg-surface px-3 text-small text-text-muted transition-colors duration-(--duration-fast) hover:border-text-muted/60 hover:text-text focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40';

/**
 * Payload's header, our controls (Dhia, 2026-09-13): a bordered search box that opens the
 * palette, and a bordered "View website" link. On phones they fold to icons; the palette
 * still answers Ctrl/⌘ K everywhere.
 */
export function HeaderActionsClient(props: PaletteProps) {
  return (
    <>
      <div className="flex items-center gap-2" data-admin-ui="" data-admin-actions="">
        <button
          type="button"
          className={`${control} w-9 justify-center px-0 md:w-80 md:justify-start md:px-3`}
          aria-label={s.searchAria}
          onClick={() => window.dispatchEvent(new CustomEvent(PALETTE_EVENT))}
          data-admin-palette-trigger=""
        >
          <Icon icon={Search} size={16} className="shrink-0" />
          <span className="hidden flex-1 truncate text-start md:inline">{s.search}</span>
          <span className="hidden items-center gap-1 md:flex">
            <Kbd>Ctrl</Kbd>
            <Kbd>K</Kbd>
          </span>
        </button>
        <a
          href="/"
          target="_blank"
          rel="noopener"
          className={`${control} w-9 justify-center px-0 md:w-auto md:px-3`}
          aria-label={s.viewSite}
          data-admin-view-site=""
        >
          <Icon icon={ACTION_ICONS.viewSite} size={16} className="shrink-0" />
          <span className="hidden md:inline">{s.viewSite}</span>
        </a>
      </div>
      <Palette {...props} />
    </>
  );
}
