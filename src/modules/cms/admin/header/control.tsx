'use client';

import type { ReactElement } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

/** A bordered 36 px control in the header's row (ADR-058): the search box, the site link, the language switch. */
export const control =
  'flex h-9 items-center gap-2 rounded-inner border border-border bg-surface px-3 text-small text-text-muted transition-[width,color,border-color] duration-(--duration-fast) hover:border-text-muted/60 hover:text-text focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40';

/** A tooltip on a control while it shows its icon alone (the icon-only rule); nothing when its text is visible. */
export function IconTooltip({
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
