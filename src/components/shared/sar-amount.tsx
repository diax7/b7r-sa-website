import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/cn';
import { SarSymbol } from '@/components/shared/sar-symbol';

/** Integers render without decimals; anything else with exactly two (BRD 3.11). */
export function formatSarDigits(value: number): string {
  if (!Number.isFinite(value)) return '0';
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(2);
}

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
      <span data-sar-digits="">{formatSarDigits(value)}</span>
    </bdi>
  );
}
