import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/cn';

interface CardProps extends ComponentPropsWithoutRef<'div'> {
  /** Lift 2 px with `--shadow-card-hover` on hover (BRD 6.4.6). */
  hoverable?: boolean;
  radius?: 'base' | 'lg';
}

/** Surface with a hairline border; shadow only on hover (BRD 3.6). */
export function Card({ hoverable, radius = 'base', className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'border border-border bg-surface',
        radius === 'lg' ? 'rounded-lg' : 'rounded-base',
        hoverable &&
          'transition-[transform,box-shadow] duration-(--duration-base) ease-(--ease-standard) hover:-translate-y-0.5 hover:shadow-card-hover',
        className,
      )}
      {...rest}
    />
  );
}
