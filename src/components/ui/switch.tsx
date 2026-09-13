'use client';

import * as SwitchPrimitive from '@radix-ui/react-switch';
import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/cn';

/**
 * Switch (ADR-039): an on/off setting that takes effect on save — never an action button.
 * Always paired with a visible label (`aria-labelledby` or `<label htmlFor>`); the thumb slides
 * towards the inline end when on, so it reads correctly in RTL.
 */
export function Switch({
  className,
  ...rest
}: ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-pill border border-text-muted/40 bg-ground p-0.5',
        'transition-[background-color,border-color] duration-(--duration-fast)',
        'focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40',
        'data-[state=checked]:border-primary data-[state=checked]:bg-primary disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...rest}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          'block size-4.5 rounded-pill bg-white shadow-card transition-transform duration-(--duration-fast)',
          'data-[state=checked]:translate-x-5 rtl:data-[state=checked]:-translate-x-5',
        )}
      />
    </SwitchPrimitive.Root>
  );
}
