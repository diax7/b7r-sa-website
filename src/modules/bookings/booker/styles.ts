/**
 * The booker's class strings shared by the island and its server-rendered stand-in
 * (ADR-063): the two draw the same card, so the swap at hydration moves nothing. Tokens
 * only; the shapes are the design system's (the 13 px corner, the pill, the tint).
 */
export type BookerMode = 'page' | 'inline' | 'reschedule';

/** The card: the surface tone, the hairline, the island's lift, the 13 px corner. */
export const CARD = 'overflow-hidden rounded-base border border-border bg-surface shadow-island';

/** The three panes at lg (event 280 · calendar 1fr · times 220), two rows at md, one column under. */
export const PANES: Record<BookerMode, string> = {
  page: 'grid md:grid-cols-[minmax(0,1fr)_220px] lg:grid-cols-[280px_minmax(0,1fr)_220px]',
  reschedule: 'grid md:grid-cols-[minmax(0,1fr)_220px] lg:grid-cols-[280px_minmax(0,1fr)_220px]',
  inline: 'grid grid-cols-1',
};

export const EVENT_PANE: Record<BookerMode, string> = {
  page: 'flex flex-col gap-5 border-b border-border p-6 md:col-span-2 lg:col-span-1 lg:border-b-0 lg:border-e',
  reschedule:
    'flex flex-col gap-5 border-b border-border p-6 md:col-span-2 lg:col-span-1 lg:border-b-0 lg:border-e',
  inline: 'flex flex-col gap-3 border-b border-border p-5',
};

export const CALENDAR_PANE: Record<BookerMode, string> = {
  page: 'flex flex-col gap-4 border-b border-border p-5 md:border-b-0 md:border-e md:p-6',
  reschedule: 'flex flex-col gap-4 border-b border-border p-5 md:border-b-0 md:border-e md:p-6',
  inline: 'flex flex-col gap-4 p-4 sm:p-5',
};

/** The times pane fills its cell and scrolls inside it from md on; under md the list runs on. */
export const TIMES_PANE: Record<BookerMode, string> = {
  page: 'md:relative md:min-h-[360px]',
  reschedule: 'md:relative md:min-h-[360px]',
  inline: 'border-t border-border',
};
export const TIMES_SCROLL: Record<BookerMode, string> = {
  page: 'flex flex-col gap-3 p-4 md:absolute md:inset-0 md:overflow-y-auto',
  reschedule: 'flex flex-col gap-3 p-4 md:absolute md:inset-0 md:overflow-y-auto',
  inline: 'flex flex-col gap-3 p-4 sm:p-5',
};

/** The form and the success view take the calendar and times columns. */
export const STEP_PANE: Record<BookerMode, string> = {
  page: 'p-6 md:col-span-2 md:p-8',
  reschedule: 'p-6 md:col-span-2 md:p-8',
  inline: 'p-5',
};

/** The month header: the arrows and the live month line. */
export const MONTH_NAV_BUTTON =
  'grid size-9 place-items-center rounded-pill text-text transition-colors duration-(--duration-fast) hover:bg-ground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40 disabled:pointer-events-none disabled:opacity-30';

export const WEEKDAY_HEAD = 'grid h-8 place-items-center text-caption font-medium text-text-muted';

/** A cell of the grid: square, the day disc centred in it. */
export const DAY_CELL = 'grid aspect-square max-h-12 place-items-center';
export const DAY_DISC =
  'relative grid size-10 place-items-center rounded-pill text-body font-medium tabular transition-[background-color,color,box-shadow,transform] duration-(--duration-fast) md:size-11';
/** A day with free starts: a real button on the ground tone, the accent dot under the number. */
export const DAY_OPEN =
  'bg-ground text-text hover:bg-accent-tint hover:text-primary focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40 active:scale-95';
export const DAY_SELECTED = 'bg-primary text-white hover:bg-primary-hover hover:text-white';
/** A closed, past, full or still-loading day: muted, never focusable. */
export const DAY_MUTED = 'text-text-muted/45';
/** Today, when it is not the selected day: ringed. */
export const DAY_TODAY = 'inset-ring-1 inset-ring-primary/50';
export const DAY_DOT = 'absolute bottom-1.5 size-1 rounded-pill bg-accent';
/** The reschedule's current day: the primary ring with the number in the primary. */
export const DAY_CURRENT = 'inset-ring-2 inset-ring-primary text-primary';

/** A slot row: the time, and the confirm half that opens on a press (the split, ADR-063). */
export const SLOT_ROW =
  'grid grid-cols-[minmax(0,1fr)_minmax(0,0fr)] gap-0 transition-[grid-template-columns,gap] duration-(--duration-base) ease-(--ease-standard) data-armed:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] data-armed:gap-2';
export const SLOT_TIME =
  'h-11 w-full min-w-0 rounded-base border border-primary/35 bg-surface text-body font-medium tabular text-primary transition-[transform,border-color,background-color,box-shadow,color] duration-(--duration-fast) hover:-translate-y-px hover:border-primary hover:shadow-card-hover focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40 aria-pressed:border-primary aria-pressed:bg-accent-tint aria-pressed:shadow-none aria-pressed:hover:translate-y-0 disabled:pointer-events-none disabled:border-border disabled:text-text-muted';
export const SLOT_CONFIRM =
  'h-11 w-full min-w-0 overflow-hidden rounded-base bg-primary text-body font-medium whitespace-nowrap text-white transition-colors duration-(--duration-fast) hover:bg-primary-hover focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40';

/** A loading row of the times pane, and the loading line of a header. */
export const SKELETON_ROW = 'h-11 rounded-base bg-ground animate-pulse';
export const SKELETON_LINE = 'h-4 rounded-inner bg-ground animate-pulse';
