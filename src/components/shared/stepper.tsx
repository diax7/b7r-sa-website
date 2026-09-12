'use client';

import { Minus, Plus } from 'lucide-react';
import { useId } from 'react';
import { cn } from '@/lib/cn';
import { Icon } from '@/components/shared/icon';

interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  label: string;
  decrementLabel: string;
  incrementLabel: string;
  className?: string;
}

/** Numeric plus/minus stepper (BRD 3.10). Buttons disable at the bounds. */
export function Stepper({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  decrementLabel,
  incrementLabel,
  className,
}: StepperProps) {
  const id = useId();
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  const btn =
    'grid size-11 shrink-0 place-items-center text-primary transition-colors duration-(--duration-fast) hover:bg-accent-tint disabled:opacity-40 disabled:hover:bg-transparent';
  return (
    <div
      className={cn(
        'inline-flex h-11 items-stretch overflow-hidden rounded-base border border-border bg-surface',
        className,
      )}
    >
      <button
        type="button"
        className={btn}
        onClick={() => onChange(clamp(value - step))}
        disabled={value <= min}
        aria-label={decrementLabel}
      >
        <Icon icon={Minus} size={18} strokeWidth={2} />
      </button>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        dir="ltr"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => {
          const n = Number.parseInt(e.target.value, 10);
          if (!Number.isNaN(n)) onChange(clamp(n));
        }}
        className="tabular w-14 border-x border-border bg-transparent text-center text-body font-medium text-text focus:outline-hidden [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        className={btn}
        onClick={() => onChange(clamp(value + step))}
        disabled={value >= max}
        aria-label={incrementLabel}
      >
        <Icon icon={Plus} size={18} strokeWidth={2} />
      </button>
    </div>
  );
}
