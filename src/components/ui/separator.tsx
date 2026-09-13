import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/cn';

/** Hairline between groups; decorative unless `decorative={false}` (then it is a separator). */
export function Separator({
  orientation = 'horizontal',
  decorative = true,
  className,
  ...rest
}: ComponentPropsWithoutRef<'div'> & {
  orientation?: 'horizontal' | 'vertical';
  decorative?: boolean;
}) {
  return (
    <div
      role={decorative ? 'none' : 'separator'}
      aria-orientation={decorative ? undefined : orientation}
      className={cn(
        'shrink-0 bg-border',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className,
      )}
      {...rest}
    />
  );
}
