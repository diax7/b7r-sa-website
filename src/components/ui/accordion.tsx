'use client';

import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/cn';
import { Icon } from '@/components/shared/icon';
import {
  ACCORDION_CHEVRON,
  ACCORDION_HEADING,
  ACCORDION_ITEM,
  ACCORDION_PANEL,
  ACCORDION_PANEL_BODY,
  ACCORDION_PANEL_CLIP,
  ACCORDION_PANEL_GRID,
  ACCORDION_TRIGGER,
} from '@/components/ui/accordion-styles';

/**
 * Radix Accordion restyled to the tokens (BRD 3.10, 6.4.9): hairline rows, single-open,
 * chevron rotates 180°, content height animates 200 ms (instant under reduced motion via
 * the global rule). WAI-ARIA semantics come from Radix. The classes live in
 * `accordion-styles.ts` so a server-rendered closed row paints the same box.
 */
export const Accordion = AccordionPrimitive.Root;

export function AccordionItem({
  className,
  ...rest
}: ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>) {
  return <AccordionPrimitive.Item className={cn(ACCORDION_ITEM, className)} {...rest} />;
}

export function AccordionTrigger({
  className,
  children,
  ...rest
}: ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header asChild>
      <h3 className={ACCORDION_HEADING}>
        <AccordionPrimitive.Trigger className={cn(ACCORDION_TRIGGER, className)} {...rest}>
          {children}
          <Icon icon={ChevronDown} size={20} className={ACCORDION_CHEVRON} />
        </AccordionPrimitive.Trigger>
      </h3>
    </AccordionPrimitive.Header>
  );
}

/**
 * The panel is always in the DOM (`forceMount`): the server renders every item closed, so
 * the answers reach crawlers and hydration changes no height (the FAQ page's CLS, site audit
 * 2026-09-18). Radix leaves the closed panel visible, so this component hides it: the region
 * is `visibility: hidden` while closed (out of the accessibility tree) and its inner grid
 * animates `0fr → 1fr`. The transition sits on the inner element because Radix zeroes the
 * panel's own transition while it measures it.
 */
export function AccordionContent({
  className,
  children,
  ...rest
}: ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content forceMount className={ACCORDION_PANEL} {...rest}>
      <div className={ACCORDION_PANEL_GRID}>
        <div className={ACCORDION_PANEL_CLIP}>
          <div className={cn(ACCORDION_PANEL_BODY, className)}>{children}</div>
        </div>
      </div>
    </AccordionPrimitive.Content>
  );
}
