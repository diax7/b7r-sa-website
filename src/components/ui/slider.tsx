'use client';

import * as SliderPrimitive from '@radix-ui/react-slider';
import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/cn';

type SliderProps = ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
  thumbLabel: string;
  /** The document's direction: the slider advances from its start edge (BRD 3.12.4). */
  dir: 'rtl' | 'ltr';
};

/**
 * Radix Slider restyled to the tokens (BRD 3.10). `dir` makes it advance from the start
 * edge of the document (right in Arabic, left in English); Radix handles keyboard and touch.
 */
export function Slider({ className, thumbLabel, dir, ...rest }: SliderProps) {
  return (
    <SliderPrimitive.Root
      dir={dir}
      className={cn('relative flex h-11 w-full touch-none items-center select-none', className)}
      {...rest}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-pill bg-border">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        aria-label={thumbLabel}
        className="block size-6 rounded-pill border-2 border-primary bg-surface shadow-card transition-[transform,box-shadow] duration-(--duration-fast) hover:scale-110 focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-hidden"
      />
    </SliderPrimitive.Root>
  );
}
