'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/cn';

/**
 * Radix Dialog primitives restyled to the tokens (BRD 3.10). Focus trap, Escape, scroll
 * lock and focus restore come from Radix; the look is ours. Consumers compose:
 * <Dialog><DialogTrigger/><DialogContent title=…>…</DialogContent></Dialog>
 */
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogPortal = DialogPrimitive.Portal;
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;

export function DialogOverlay({
  className,
  ...rest
}: ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      className={cn(
        'fixed inset-0 z-40 bg-navy/40',
        'data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out',
        className,
      )}
      {...rest}
    />
  );
}

interface DialogContentProps extends ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  /** Full-screen sheet (mobile menu) instead of a centred card. */
  variant?: 'card' | 'sheet';
}

export function DialogContent({ className, variant = 'card', ...rest }: DialogContentProps) {
  return (
    <DialogPortal>
      {/* Radix mounts its scroll lock inside the Overlay, so the sheet keeps one (invisible). */}
      <DialogOverlay className={variant === 'sheet' ? 'bg-transparent' : undefined} />
      <DialogPrimitive.Content
        className={cn(
          'fixed z-50 bg-surface focus:outline-hidden',
          variant === 'card' &&
            'start-1/2 top-1/2 w-[calc(100vw-32px)] max-w-md -translate-y-1/2 translate-x-1/2 rounded-base p-6 shadow-popover',
          variant === 'sheet' && 'inset-0 overflow-y-auto',
          className,
        )}
        {...rest}
      />
    </DialogPortal>
  );
}
