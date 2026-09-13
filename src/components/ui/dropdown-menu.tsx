'use client';

import * as MenuPrimitive from '@radix-ui/react-dropdown-menu';
import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/cn';

/**
 * Dropdown menu (ADR-039): actions behind one trigger. Keyboard, typeahead, focus return and
 * `dir` come from Radix; the look is the tokens. Items keep an icon before the label.
 */
export const DropdownMenu = MenuPrimitive.Root;
export const DropdownMenuTrigger = MenuPrimitive.Trigger;
export const DropdownMenuGroup = MenuPrimitive.Group;

export function DropdownMenuContent({
  className,
  sideOffset = 6,
  ...rest
}: ComponentPropsWithoutRef<typeof MenuPrimitive.Content>) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          'z-50 min-w-48 overflow-hidden rounded-base border border-border bg-surface p-1 text-small text-text shadow-popover',
          'data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out',
          className,
        )}
        {...rest}
      />
    </MenuPrimitive.Portal>
  );
}

export function DropdownMenuItem({
  className,
  ...rest
}: ComponentPropsWithoutRef<typeof MenuPrimitive.Item>) {
  return (
    <MenuPrimitive.Item
      className={cn(
        'flex cursor-pointer items-center gap-2.5 rounded-inner px-2.5 py-2 outline-hidden select-none',
        'data-highlighted:bg-accent-tint data-highlighted:text-text data-disabled:pointer-events-none data-disabled:opacity-50',
        className,
      )}
      {...rest}
    />
  );
}

export function DropdownMenuLabel({
  className,
  ...rest
}: ComponentPropsWithoutRef<typeof MenuPrimitive.Label>) {
  return (
    <MenuPrimitive.Label
      className={cn('px-2.5 py-1.5 text-caption text-text-muted', className)}
      {...rest}
    />
  );
}

export function DropdownMenuSeparator({
  className,
  ...rest
}: ComponentPropsWithoutRef<typeof MenuPrimitive.Separator>) {
  return <MenuPrimitive.Separator className={cn('my-1 h-px bg-border', className)} {...rest} />;
}
