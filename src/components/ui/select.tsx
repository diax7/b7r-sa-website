'use client';

import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import type { ComponentPropsWithoutRef } from 'react';
import { Icon } from '@/components/shared/icon';
import { cn } from '@/lib/cn';

/**
 * Select (BRD 3.10): Radix restyled to the tokens, `dir="rtl"` so the popover and keyboard
 * navigation follow the document direction. Trigger matches `Input`; invalid state mirrors it.
 */
export interface SelectProps {
  id?: string;
  name: string;
  value: string;
  onValueChange: (value: string) => void;
  options: readonly string[];
  placeholder?: string;
  invalid?: boolean;
  disabled?: boolean;
  'aria-describedby'?: string | undefined;
  'aria-labelledby'?: string | undefined;
}

export function Select({
  id,
  name,
  value,
  onValueChange,
  options,
  placeholder,
  invalid,
  disabled,
  ...aria
}: SelectProps) {
  return (
    <SelectPrimitive.Root
      dir="rtl"
      name={name}
      value={value}
      onValueChange={onValueChange}
      {...(disabled ? { disabled } : {})}
    >
      <SelectPrimitive.Trigger
        id={id}
        aria-invalid={invalid || undefined}
        {...aria}
        className={cn(
          'flex h-11 w-full items-center justify-between gap-2 rounded-base border border-border bg-surface px-4 text-body text-text text-start',
          'transition-[border-color,box-shadow] duration-(--duration-fast)',
          'hover:border-text-muted/60 focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-accent/40',
          'data-[placeholder]:text-text-muted disabled:opacity-60',
          invalid && 'border-error focus:border-error focus:ring-error/30',
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon asChild>
          <Icon icon={ChevronDown} size={18} className="text-text-muted" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          className="z-50 w-(--radix-select-trigger-width) overflow-hidden rounded-base border border-border bg-surface shadow-popover"
        >
          <SelectPrimitive.Viewport className="p-1">
            {options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

function SelectItem({
  className,
  children,
  ...rest
}: ComponentPropsWithoutRef<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      className={cn(
        'relative flex h-11 cursor-default items-center gap-2 rounded-inner pe-3 ps-9 text-body text-text outline-hidden select-none',
        'data-highlighted:bg-accent-tint data-highlighted:text-primary',
        className,
      )}
      {...rest}
    >
      <span className="absolute start-3 grid size-4 place-items-center">
        <SelectPrimitive.ItemIndicator>
          <Icon icon={Check} size={16} />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}
