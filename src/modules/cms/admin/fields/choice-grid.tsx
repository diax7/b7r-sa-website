'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface Choice {
  value: string;
  label: string;
  art: ReactNode;
}

/** A radiogroup of tiles: the art says what the value is, the label names it. */
export function ChoiceGrid({
  choices,
  value,
  onChange,
  disabled,
  labelId,
  describedBy,
  columns = 3,
}: {
  choices: Choice[];
  value: string | undefined;
  onChange: (value: string) => void;
  disabled?: boolean | undefined;
  labelId: string;
  describedBy: string;
  columns?: 3 | 4;
}) {
  return (
    <div
      role="radiogroup"
      aria-labelledby={labelId}
      aria-describedby={describedBy}
      className={cn('grid gap-2', columns === 4 ? 'grid-cols-4' : 'grid-cols-3')}
    >
      {choices.map((choice) => {
        const selected = choice.value === value;
        return (
          <button
            key={choice.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(choice.value)}
            className={cn(
              'flex flex-col items-center gap-2 rounded-base border px-2 py-3 text-caption transition-colors duration-(--duration-fast)',
              'focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-50',
              selected
                ? 'border-accent bg-accent-tint text-text'
                : 'border-border bg-ground text-text-muted hover:border-text-muted/60 hover:text-text',
            )}
            data-admin-choice={choice.value}
          >
            <span className="grid h-8 place-items-center">{choice.art}</span>
            <span className="truncate">{choice.label}</span>
          </button>
        );
      })}
    </div>
  );
}
