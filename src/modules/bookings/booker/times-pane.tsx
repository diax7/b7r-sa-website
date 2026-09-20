'use client';

import { CalendarX2 } from 'lucide-react';
import { type CSSProperties, type Ref, useEffect, useState } from 'react';
import { Icon } from '@/components/shared/icon';
import { cn } from '@/lib/cn';
import { riyadhDayShortLabel, riyadhTimeLabel } from '@/lib/riyadh';
import type { BookerCopy } from '@/modules/bookings/booker/copy';
import {
  type BookerMode,
  SKELETON_LINE,
  SKELETON_ROW,
  SLOT_CONFIRM,
  SLOT_ROW,
  SLOT_TIME,
  TIMES_PANE,
  TIMES_SCROLL,
} from '@/modules/bookings/booker/styles';
import { riyadhInstant } from '@/modules/bookings/slots';

export type SlotsView =
  | { kind: 'loading'; rows: number }
  | { kind: 'error' }
  | { kind: 'ready'; starts: Date[] };

export interface TimesPaneProps {
  mode: BookerMode;
  /** The selected day, or none (the pane then shows its skeleton). */
  day: string | null;
  slots: SlotsView;
  /** The ISO start whose confirm half is open. */
  armed: string | null;
  /** The reschedule's current start: marked and not selectable. */
  current?: string | null;
  /** A line above the list: the slot was taken, the read failed. */
  notice?: string | null;
  confirmLabel: string;
  copy: BookerCopy;
  idPrefix: string;
  /** Stagger the rows in (the day changed); off on a re-render of the same day. */
  stagger: boolean;
  /** The day's rows have rendered with their stagger: the island remembers the day. */
  onStaggered(): void;
  onPress(iso: string): void;
  onConfirm(start: Date): void;
  /** The pane's element, for the scroll on a phone. */
  ref?: Ref<HTMLDivElement>;
}

/** The loading rows: as many as the day has free starts, six when unknown, never more than eight. */
export function skeletonRows(count: number | undefined): number {
  return Math.min(8, Math.max(3, count ?? 6));
}

interface SlotRowsProps {
  starts: Date[];
  armed: string | null;
  current: string | null;
  confirmLabel: string;
  copy: BookerCopy;
  headingId: string;
  stagger: boolean;
  onStaggered(): void;
  onPress(iso: string): void;
  onConfirm(start: Date): void;
}

/**
 * The day's rows, keyed by the day: whether they stagger in is fixed at mount (a re-render
 * while they animate never cuts the animation short), and the island hears the day has
 * staggered the moment they render, so a list mounted again for the same day (the return
 * from the form step, the read after a refusal) stands at once.
 */
function SlotRows({
  starts,
  armed,
  current,
  confirmLabel,
  copy,
  headingId,
  stagger: staggerNow,
  onStaggered,
  onPress,
  onConfirm,
}: SlotRowsProps) {
  const [stagger] = useState(staggerNow);
  useEffect(() => {
    if (stagger) onStaggered();
  }, [stagger, onStaggered]);
  return (
    <ul className="flex flex-col gap-2" aria-labelledby={headingId} data-booking-list="">
      {starts.map((start, i) => {
        const iso = start.toISOString();
        const isArmed = armed === iso;
        const isCurrent = current === iso;
        return (
          <li
            key={iso}
            className={cn(SLOT_ROW, stagger && 'booker-row')}
            style={stagger ? ({ '--i': i } as CSSProperties) : undefined}
            data-armed={isArmed ? '' : undefined}
            data-booking-row={iso}
          >
            <button
              type="button"
              className={SLOT_TIME}
              aria-pressed={isArmed}
              disabled={isCurrent}
              title={isCurrent ? copy.booking.current : undefined}
              onClick={() => onPress(iso)}
              data-booking-slot={iso}
              data-booking-slot-state={isCurrent ? 'current' : isArmed ? 'armed' : 'free'}
            >
              <bdi dir="ltr">{riyadhTimeLabel(start, copy.dateLocale)}</bdi>
              {isCurrent && <span className="sr-only">{`: ${copy.booking.current}`}</span>}
            </button>
            <button
              type="button"
              className={cn(SLOT_CONFIRM, !isArmed && 'invisible')}
              tabIndex={isArmed ? 0 : -1}
              aria-hidden={isArmed ? undefined : true}
              onClick={() => onConfirm(start)}
              data-booking-confirm={isArmed ? iso : undefined}
            >
              {confirmLabel}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * The times pane (ADR-063): the day as its header, the free starts down a column as
 * full-width buttons («10:00 ص»), staggered in; a tap splits the row into the time (its
 * `aria-pressed` says it is armed) and «أكّد», a real button that takes focus the moment it
 * appears and is a width transition, never a re-mount, so the focus stays where it was.
 * The island collapses the split on a pointer elsewhere; nothing here reacts to a focus-out.
 * The rows stagger in once per day change (`stagger`, decided by the island from the day
 * they last did); a list mounted again for the same day draws them standing.
 */
export function TimesPane({
  mode,
  day,
  slots,
  armed,
  current,
  notice,
  confirmLabel,
  copy,
  idPrefix,
  stagger,
  onStaggered,
  onPress,
  onConfirm,
  ref,
}: TimesPaneProps) {
  const headingId = `${idPrefix}-times`;
  const header = day ? riyadhDayShortLabel(riyadhInstant(day, 12 * 60), copy.dateLocale) : null;
  return (
    <div
      ref={ref}
      className={cn(TIMES_PANE[mode], 'scroll-mt-24')}
      data-booking-times=""
      data-booking-slots={slots.kind}
    >
      <div className={TIMES_SCROLL[mode]}>
        {header ? (
          <p
            id={headingId}
            className="text-small font-medium text-text"
            data-booking-times-day={day}
          >
            {header}
            <span className="sr-only">{`: ${copy.booking.pickTime}`}</span>
          </p>
        ) : (
          <p id={headingId} className="sr-only">
            {copy.booking.pickTime}
          </p>
        )}
        {notice && (
          <p className="text-small text-error" role="alert" data-testid="booking-message">
            {notice}
          </p>
        )}
        {slots.kind === 'loading' && (
          <div className="flex flex-col gap-2" aria-hidden="true">
            {!header && <div className={cn(SKELETON_LINE, 'w-2/3')} />}
            {Array.from({ length: slots.rows }, (_, i) => (
              <div key={i} className={SKELETON_ROW} />
            ))}
          </div>
        )}
        {slots.kind === 'loading' && (
          <p className="sr-only" aria-live="polite">
            {copy.booking.loadingSlots}
          </p>
        )}
        {slots.kind === 'error' && (
          <p className="text-small text-error" role="alert">
            {copy.booking.failure}
          </p>
        )}
        {slots.kind === 'ready' && slots.starts.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-8 text-center" data-booking-empty="">
            <span className="grid size-12 place-items-center rounded-pill bg-ground text-text-muted">
              <Icon icon={CalendarX2} size={22} />
            </span>
            <p className="text-small text-text-muted">{copy.booking.noSlots}</p>
          </div>
        )}
        {slots.kind === 'ready' && slots.starts.length > 0 && (
          <SlotRows
            key={day}
            starts={slots.starts}
            armed={armed}
            current={current ?? null}
            confirmLabel={confirmLabel}
            copy={copy}
            headingId={headingId}
            stagger={stagger}
            onStaggered={onStaggered}
            onPress={onPress}
            onConfirm={onConfirm}
          />
        )}
      </div>
    </div>
  );
}
