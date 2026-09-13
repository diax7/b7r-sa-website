import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/cn';

/** A key cap («Ctrl», «K»): monospace-free, tokens only; always next to the action it triggers. */
export function Kbd({ className, ...rest }: ComponentPropsWithoutRef<'kbd'>) {
  return (
    <kbd
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded-inner border border-border bg-ground px-1.5 text-caption font-medium text-text-muted',
        className,
      )}
      dir="ltr"
      {...rest}
    />
  );
}
