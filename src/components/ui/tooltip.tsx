'use client';

import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/cn';

/**
 * Tooltip (ADR-039): a short label for icon-only controls. Never the only place a meaning
 * lives — the control keeps its `aria-label`. Compose:
 * <TooltipProvider><Tooltip><TooltipTrigger asChild/><TooltipContent/></Tooltip></TooltipProvider>
 */
export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export function TooltipContent({
  className,
  sideOffset = 6,
  ...rest
}: ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          'z-50 max-w-xs rounded-inner border border-border bg-surface px-2.5 py-1.5 text-caption text-text shadow-popover',
          'data-[state=delayed-open]:animate-fade-in data-[state=closed]:animate-fade-out',
          className,
        )}
        {...rest}
      />
    </TooltipPrimitive.Portal>
  );
}
