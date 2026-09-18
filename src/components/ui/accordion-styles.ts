/**
 * The accordion's classes, shared by the Radix wrappers in `accordion.tsx` and by the
 * server-rendered closed rows an island replaces near the viewport (`FaqClosedList`): both
 * paint the same box, so the swap moves nothing (the FAQ page's CLS, site audit 2026-09-18).
 */
export const ACCORDION_ROOT = 'border-t border-border';
export const ACCORDION_ITEM = 'border-b border-border';
export const ACCORDION_HEADING = 'm-0 text-body';
export const ACCORDION_TRIGGER =
  'group flex w-full items-center justify-between gap-4 py-5 text-start font-medium text-text transition-colors duration-(--duration-fast) hover:text-primary focus-visible:outline-accent';
export const ACCORDION_CHEVRON =
  'shrink-0 text-text-muted transition-transform duration-(--duration-base) ease-(--ease-standard) group-data-[state=open]:rotate-180';
export const ACCORDION_PANEL = 'group/panel data-[state=closed]:invisible';
export const ACCORDION_PANEL_GRID =
  'grid grid-rows-[0fr] transition-[grid-template-rows,visibility] duration-(--duration-base) ease-(--ease-standard) motion-reduce:transition-none group-data-[state=closed]/panel:invisible group-data-[state=open]/panel:visible group-data-[state=open]/panel:grid-rows-[1fr]';
export const ACCORDION_PANEL_CLIP = 'min-h-0 overflow-hidden';
export const ACCORDION_PANEL_BODY = 'pb-5 text-text-muted';
