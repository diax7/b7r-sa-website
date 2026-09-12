import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/cn';

/** 10 % tint rule: `bg-{color}/10 text-{color} border-{color}/20` (BRD 3.10). */
const badge = cva(
  'inline-flex items-center rounded-pill border px-2.5 py-0.5 text-caption font-medium leading-5',
  {
    variants: {
      tone: {
        primary: 'bg-primary/10 text-primary border-primary/20',
        success: 'bg-success/10 text-success border-success/20',
        warning: 'bg-warning/10 text-warning border-warning/20',
        error: 'bg-error/10 text-error border-error/20',
        muted: 'bg-text-muted/10 text-text-muted border-text-muted/20',
      },
    },
    defaultVariants: { tone: 'primary' },
  },
);

export function Badge({
  tone,
  className,
  ...rest
}: ComponentPropsWithoutRef<'span'> & VariantProps<typeof badge>) {
  return <span className={cn(badge({ tone }), className)} {...rest} />;
}
