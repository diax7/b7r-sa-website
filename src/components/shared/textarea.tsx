import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/cn';

interface TextareaProps extends ComponentPropsWithoutRef<'textarea'> {
  invalid?: boolean;
}

/** Multi-line input (BRD 3.10), styled like `Input`; resizes vertically only. */
export function Textarea({ invalid, className, ...rest }: TextareaProps) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={cn(
        'min-h-32 w-full resize-y rounded-base border border-border bg-surface px-4 py-3 text-body text-text text-start placeholder:text-text-muted',
        'transition-[border-color,box-shadow] duration-(--duration-fast)',
        'hover:border-text-muted/60 focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-accent/40',
        invalid && 'border-error focus:border-error focus:ring-error/30',
        className,
      )}
      {...rest}
    />
  );
}
