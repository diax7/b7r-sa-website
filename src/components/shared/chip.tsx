import { Check } from 'lucide-react';
import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/cn';
import { Icon } from '@/components/shared/icon';

interface ChipProps extends ComponentPropsWithoutRef<'span'> {
  /** Leading check icon inside an accent-tint circle (hero proof chips, BRD 6.4.1). */
  check?: boolean;
}

/** Pill chip (BRD 3.10). Non-interactive; selectable chips live in the designer controls. */
export function Chip({ check, className, children, ...rest }: ChipProps) {
  return (
    <span
      className={cn(
        'inline-flex h-10 shrink-0 items-center gap-2 rounded-pill border border-border bg-surface pe-4 text-small font-medium text-text',
        check ? 'ps-2' : 'ps-4',
        className,
      )}
      {...rest}
    >
      {check && (
        <span className="grid size-6 place-items-center rounded-pill bg-accent-tint text-primary">
          <Icon icon={Check} size={14} strokeWidth={2.5} />
        </span>
      )}
      {children}
    </span>
  );
}
