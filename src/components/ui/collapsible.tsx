'use client';

import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';
import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/cn';

/**
 * Collapsible (ADR-039): a section that folds. The trigger carries `aria-expanded` from
 * Radix; the content animates with the accordion keyframes from the shared tokens.
 */
export const Collapsible = CollapsiblePrimitive.Root;
export const CollapsibleTrigger = CollapsiblePrimitive.Trigger;

export function CollapsibleContent({
  className,
  ...rest
}: ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Content>) {
  return (
    <CollapsiblePrimitive.Content
      className={cn(
        'overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up motion-reduce:animate-none',
        className,
      )}
      {...rest}
    />
  );
}
