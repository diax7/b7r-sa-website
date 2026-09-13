'use client';

import { Search } from 'lucide-react';
import { Icon } from '@/components/shared/icon';
import { Kbd } from '@/components/ui/kbd';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ACTION_ICONS } from '@/modules/cms/admin/icons';
import { Palette, type PaletteProps } from '@/modules/cms/admin/header/palette';
import { PALETTE_EVENT } from '@/modules/cms/admin/header/palette-event';
import { adminStrings } from '@/modules/cms/admin/strings';

const iconButton =
  'grid size-9 place-items-center rounded-inner text-text-muted transition-colors duration-(--duration-fast) hover:bg-accent-tint hover:text-text focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40';

/** Two icon buttons in Payload's header, each with a tooltip, plus the palette they open. */
export function HeaderActionsClient(props: PaletteProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="hidden items-center gap-1 md:flex" data-admin-ui="" data-admin-actions="">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className={iconButton}
              aria-label={adminStrings.palette.title}
              onClick={() => window.dispatchEvent(new CustomEvent(PALETTE_EVENT))}
              data-admin-palette-trigger=""
            >
              <Icon icon={Search} size={18} />
            </button>
          </TooltipTrigger>
          <TooltipContent className="flex items-center gap-1.5">
            {adminStrings.palette.title}
            <Kbd>Ctrl</Kbd>
            <Kbd>K</Kbd>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <a
              href="/"
              target="_blank"
              rel="noopener"
              className={iconButton}
              aria-label={adminStrings.nav.viewSite}
            >
              <Icon icon={ACTION_ICONS.viewSite} size={18} />
            </a>
          </TooltipTrigger>
          <TooltipContent>{adminStrings.nav.viewSite}</TooltipContent>
        </Tooltip>
      </div>
      <Palette {...props} />
    </TooltipProvider>
  );
}
