import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/cn';
import { formatNumber } from '@/components/shared/format-number';
import { SarSymbol } from '@/components/shared/sar-symbol';

interface SarAmountProps extends ComponentPropsWithoutRef<'bdi'> {
  value: number;
  symbolClassName?: string | undefined;
}

/**
 * `SarAmount value={89}` renders the riyal symbol always to the LEFT of the digits with a
 * thin space between, inside `<bdi dir="ltr">` so RTL context never reorders the pair.
 * Digits use tabular figures so counting numbers do not jitter.
 */
export function SarAmount({ value, className, symbolClassName, ...rest }: SarAmountProps) {
  return (
    <bdi
      dir="ltr"
      className={cn('tabular inline-flex items-baseline gap-[0.18em] whitespace-nowrap', className)}
      {...rest}
    >
      <SarSymbol className={symbolClassName} />
      <span data-sar-digits="">{formatNumber(value)}</span>
    </bdi>
  );
}
