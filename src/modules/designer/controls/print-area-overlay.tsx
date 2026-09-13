'use client';

import { Upload, X } from 'lucide-react';
import { useId, useRef, type ChangeEvent } from 'react';
import { Icon } from '@/components/shared/icon';
import { cn } from '@/lib/cn';
import type { Rect } from '@/modules/designer/print-area';
import { ACCEPTED_TYPES } from '@/modules/designer/use-designer-state';

export interface PrintAreaOverlayCopy {
  /** «اضغط لرفع شعارك أو صورتك» */
  prompt: string;
  /** «PNG أو JPG أو SVG، حتى 10 ميجابايت» */
  helper: string;
  /** Accessible name of the file input. */
  inputAria: string;
  /** «إزالة التصميم» */
  removeAria: string;
  fileError: string;
}

interface PrintAreaOverlayProps {
  /** Print area in stage pixels. */
  area: Rect;
  hasDesign: boolean;
  /** Edit chrome is showing (pointer inside or the design selected): the remove control appears. */
  chrome: boolean;
  fileError: boolean;
  onFile: (file: File) => void;
  onRemove: () => void;
  copy: PrintAreaOverlayCopy;
}

/**
 * HTML layer over the Konva stage, aligned to the print area (BRD 6.4.3, amended
 * 2026-09-13, ADR-036). Empty: the area itself is the upload target, a visually hidden but
 * focusable file input with the prompt as its label, so a click, Enter or Space opens the
 * picker and the focus ring lands on the area. With a design: one «×» at the top-end corner
 * of the area, shown only while the edit chrome is visible.
 */
export function PrintAreaOverlay({
  area,
  hasDesign,
  chrome,
  fileError,
  onFile,
  onRemove,
  copy,
}: PrintAreaOverlayProps) {
  const inputId = useId();
  const errorId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  // Stage coordinates, not layout: Konva's pixel space is physical. // rtl-allow: canvas pixel space
  const style = { top: area.y, left: area.x, width: area.width, height: area.height }; // rtl-allow: canvas pixel space

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) onFile(file);
  }

  if (!hasDesign) {
    // The area is ~100 × 140 px on a phone stage and ~130–200 px wide on desktop: the icon,
    // the small text and the helper line appear as the area grows (container queries on the
    // area's width; the areas are all about 3:4), so the prompt never overflows the box.
    return (
      <div className="@container absolute" style={style} data-print-area-prompt="">
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          aria-label={copy.inputAria}
          aria-describedby={fileError ? errorId : undefined}
          aria-invalid={fileError || undefined}
          onChange={onChange}
          className="peer sr-only"
          data-design-input=""
        />
        <label
          htmlFor={inputId}
          className={cn(
            'flex size-full cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden rounded-inner border-2 border-dashed px-2 text-center transition-colors duration-(--duration-fast) @min-[8rem]:gap-2 @min-[8rem]:px-3',
            'border-primary/50 bg-surface/70 backdrop-blur-[2px] hover:border-primary hover:bg-surface/85',
            'peer-focus-visible:border-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40',
            fileError && 'border-error',
          )}
        >
          <span
            className={cn(
              'hidden size-11 place-items-center rounded-pill bg-accent-tint text-primary',
              // The error takes the icon's room; nothing to upload until the file is fixed.
              !fileError && '@min-[8rem]:grid',
            )}
          >
            <Icon icon={Upload} size={20} />
          </span>
          <span
            className={cn(
              'text-caption leading-snug font-medium text-primary @min-[8rem]:text-small',
              // A narrow area has room for one message: the error takes the prompt's place.
              fileError && '@max-[8rem]:hidden',
            )}
          >
            {copy.prompt}
          </span>
          <span className="hidden text-caption text-text-muted @min-[11rem]:block">
            {copy.helper}
          </span>
          {fileError && (
            <span id={errorId} role="alert" className="text-caption leading-snug text-error">
              {copy.fileError}
            </span>
          )}
        </label>
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute" style={style}>
      <button
        type="button"
        onClick={onRemove}
        aria-label={copy.removeAria}
        data-design-remove=""
        // 44 px target; invisible AND inert while the chrome is hidden, except for keyboard focus.
        className={cn(
          'absolute end-0 top-0 grid size-11 -translate-y-1/2 translate-x-1/2 place-items-center rounded-pill border border-border bg-surface text-text shadow-popover transition-opacity duration-(--duration-fast) hover:text-error focus-visible:pointer-events-auto focus-visible:opacity-100 rtl:-translate-x-1/2',
          chrome ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        )}
      >
        <Icon icon={X} size={18} />
      </button>
    </div>
  );
}
