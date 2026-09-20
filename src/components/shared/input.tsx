import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/cn';

interface InputProps extends ComponentPropsWithoutRef<'input'> {
  invalid?: boolean;
}

/**
 * Text input (BRD 3.10). Email, URL, phone, number and code inputs pass `dir="ltr"` themselves
 * so the caret sits correctly (BRD 3.12.5); `text-start` keeps the text at the start edge; a
 * value longer than the field reads with an ellipsis while the field is not focused (the
 * caret at the end scrolls it while it is).
 */
export function Input({ invalid, className, ...rest }: InputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(
        'h-11 w-full rounded-base border border-border bg-surface px-4 text-body text-ellipsis text-text text-start placeholder:text-text-muted',
        'transition-[border-color,box-shadow] duration-(--duration-fast)',
        'hover:border-text-muted/60 focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-accent/40',
        invalid && 'border-error focus:border-error focus:ring-error/30',
        className,
      )}
      {...rest}
    />
  );
}
