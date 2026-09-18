'use client';

import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/cn';
import { Icon } from '@/components/shared/icon';

/**
 * Radix Accordion restyled to the tokens (BRD 3.10, 6.4.9): hairline rows, single-open,
 * chevron rotates 180°, content height animates 200 ms (instant under reduced motion via
 * the global rule). WAI-ARIA semantics come from Radix.
 */
export const Accordion = AccordionPrimitive.Root;

export function AccordionItem({
  className,
  ...rest
}: ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>) {
  return <AccordionPrimitive.Item className={cn('border-b border-border', className)} {...rest} />;
}

export function AccordionTrigger({
  className,
  children,
  ...rest
}: ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header asChild>
      <h3 className="m-0 text-body">
        <AccordionPrimitive.Trigger
          className={cn(
            'group flex w-full items-center justify-between gap-4 py-5 text-start font-medium text-text transition-colors duration-(--duration-fast) hover:text-primary focus-visible:outline-accent',
            className,
          )}
          {...rest}
        >
          {children}
          <Icon
            icon={ChevronDown}
            size={20}
            className="shrink-0 text-text-muted transition-transform duration-(--duration-base) ease-(--ease-standard) group-data-[state=open]:rotate-180"
          />
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
    <AccordionPrimitive.Content
      forceMount
      className="group/panel data-[state=closed]:invisible"
      {...rest}
    >
      <div className="grid grid-rows-[0fr] transition-[grid-template-rows,visibility] duration-(--duration-base) ease-(--ease-standard) group-data-[state=closed]/panel:invisible group-data-[state=open]/panel:visible group-data-[state=open]/panel:grid-rows-[1fr]">
        <div className="min-h-0 overflow-hidden">
          <div className={cn('pb-5 text-text-muted', className)}>{children}</div>
        </div>
      </div>
    </AccordionPrimitive.Content>
  );
}
