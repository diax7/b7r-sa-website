import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { ArrowRight, Loader2 } from 'lucide-react';
import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/cn';
import { Icon } from '@/components/shared/icon';

const button = cva(
  [
    'inline-flex items-center justify-center gap-2 rounded-base font-medium whitespace-nowrap select-none',
    'transition-[background-color,color,border-color,box-shadow,transform] duration-(--duration-base) ease-(--ease-standard)',
    'disabled:pointer-events-none disabled:opacity-50',
    'active:translate-y-px',
  ],
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white hover:bg-primary-hover',
        secondary: 'bg-surface text-primary border border-primary hover:bg-accent-tint',
        ghost: 'bg-transparent text-primary hover:bg-accent-tint',
        link: 'bg-transparent text-primary underline-offset-4 hover:underline',
        /** White button on the primary ribbon (BRD 6.3.1). */
        inverse: 'bg-white text-primary hover:bg-accent-tint',
      },
      size: {
        md: 'h-11 px-5 text-button',
        lg: 'h-13 px-7 text-button-lg',
      },
      fullWidth: { true: 'w-full' },
    },
    compoundVariants: [{ variant: 'link', size: ['md', 'lg'], className: 'h-auto px-0' }],
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends ComponentPropsWithoutRef<'button'>, VariantProps<typeof button> {
  /** Render the child element (e.g. an anchor) with button styling. */
  asChild?: boolean;
  /** Trailing arrow, mirrored in RTL (BRD 3.10). */
  trailingArrow?: boolean;
  loading?: boolean;
}

export function Button({
  asChild,
  variant,
  size,
  fullWidth,
  trailingArrow,
  loading,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  if (asChild) {
    return (
      <Slot className={cn(button({ variant, size, fullWidth }), className)} {...rest}>
        {children}
      </Slot>
    );
  }
  return (
    <button
      className={cn(button({ variant, size, fullWidth }), className)}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Icon icon={Loader2} size={18} className="animate-spin" />}
      {children}
      {trailingArrow && !loading && <Icon icon={ArrowRight} size={18} />}
    </button>
  );
}

export { button as buttonVariants };
