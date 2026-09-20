'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/shared/icon';
import { cn } from '@/lib/cn';
import { riyadhDayLabel } from '@/lib/riyadh';
import { type BookerCopy, fill } from '@/modules/bookings/booker/copy';
import {
  firstOpen,
  keyStep,
  lastOpen,
  monthLabel,
  monthRows,
  moveFocus,
  shiftMonth,
  weekdayNames,
} from '@/modules/bookings/booker/month';
import {
  DAY_CELL,
  DAY_CURRENT,
  DAY_DISC,
  DAY_DOT,
  DAY_MUTED,
  DAY_OPEN,
  DAY_SELECTED,
  DAY_TODAY,
  MONTH_NAV_BUTTON,
  WEEKDAY_HEAD,
} from '@/modules/bookings/booker/styles';
import { riyadhInstant } from '@/modules/bookings/slots';

export interface MonthGridProps {
  month: string;
  /** The month's free counts, or none while they load. */
  days: Record<string, number> | undefined;
  failed: boolean;
  bounds: { first: string; last: string };
  today: string;
  selected: string | null;
  /** The reschedule's current day, marked. */
  current?: string | null;
  closedReasons: ReadonlyMap<string, string>;
  copy: BookerCopy;
  dir: 'ltr' | 'rtl';
  idPrefix: string;
  onSelect(day: string): void;
  onMonth(month: string): void;
}

const cellId = (prefix: string, key: string) => `${prefix}-day-${key}`;

/**
 * The calendar pane (ADR-063): a month grid Sunday first with the weekday initials of the
 * locale, ‹ › bounded by today's and the horizon's months (mirrored by meaning: previous is
 * toward the past whatever the direction), today ringed, an open day a real button with the
 * accent dot, a closed, past or full day muted and never focusable, the selected day the
 * filled disc. One cell is in the Tab order (the selected day, else the first open one);
 * the arrows move by reading direction, a week up and down, Home and End along the row,
 * skipping closed days and turning the page at the month's edge; Enter and Space select
 * (the button's own click). The month line is live, so a page turn is announced.
 */
export function MonthGrid({
  month,
  days,
  failed,
  bounds,
  today,
  selected,
  current,
  closedReasons,
  copy,
  dir,
  idPrefix,
  onSelect,
  onMonth,
}: MonthGridProps) {
  const [focused, setFocused] = useState<string | null>(null);
  const wantFocus = useRef<'first' | 'last' | null>(null);
  const open = new Set(Object.keys(days ?? {}).filter((key) => (days?.[key] ?? 0) > 0));
  const inMonth = (key: string | null) => key !== null && key.startsWith(month) && open.has(key);
  const tabbable = inMonth(focused) ? focused : inMonth(selected) ? selected : firstOpen(days);

  // After a keyboard page turn, the first or the last open day of the new month takes the focus.
  useEffect(() => {
    if (!days || !wantFocus.current) return;
    const target = wantFocus.current === 'first' ? firstOpen(days) : lastOpen(days);
    wantFocus.current = null;
    if (!target) return;
    setFocused(target);
    document.getElementById(cellId(idPrefix, target))?.focus();
  }, [days, idPrefix]);

  const turn = (n: 1 | -1, focus: 'first' | 'last' | null) => {
    const next = shiftMonth(month, n);
    if (next < bounds.first || next > bounds.last) return false;
    wantFocus.current = focus;
    onMonth(next);
    return true;
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const from = (e.target as HTMLElement).dataset['bookingDay'];
    const step = keyStep(e.key, dir);
    if (!from || step === null) return;
    e.preventDefault();
    const to = moveFocus(from, step, open);
    if (to === null) return;
    if (to === 'next' || to === 'previous') {
      turn(to === 'next' ? 1 : -1, to === 'next' ? 'first' : 'last');
      return;
    }
    setFocused(to);
    document.getElementById(cellId(idPrefix, to))?.focus();
  };

  const weekdays = weekdayNames(copy.dateLocale);
  const monthId = `${idPrefix}-month`;
  const label = monthLabel(month, copy.dateLocale);
  return (
    <div className="flex flex-col gap-3" data-booking-calendar="">
      <div className="flex items-center justify-between gap-2">
        <p
          id={monthId}
          aria-live="polite"
          className="text-body font-medium text-text"
          data-booking-month={month}
        >
          {label}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className={MONTH_NAV_BUTTON}
            aria-label={copy.booking.previousMonth}
            disabled={month <= bounds.first}
            onClick={() => turn(-1, null)}
            data-booking-month-previous=""
          >
            <Icon icon={ChevronLeft} size={20} />
          </button>
          <button
            type="button"
            className={MONTH_NAV_BUTTON}
            aria-label={copy.booking.nextMonth}
            disabled={month >= bounds.last}
            onClick={() => turn(1, null)}
            data-booking-month-next=""
          >
            <Icon icon={ChevronRight} size={20} />
          </button>
        </div>
      </div>
      <div
        role="grid"
        tabIndex={-1}
        aria-labelledby={monthId}
        aria-busy={days === undefined && !failed ? true : undefined}
        className="flex flex-col gap-1 outline-hidden"
        onKeyDown={onKeyDown}
        data-booking-days={failed ? 'error' : days ? 'ready' : 'loading'}
      >
        <div role="row" className="grid grid-cols-7">
          {weekdays.map((day) => (
            <div key={day.long} role="columnheader" aria-label={day.long} className={WEEKDAY_HEAD}>
              <span aria-hidden="true">{day.initial}</span>
            </div>
          ))}
        </div>
        {monthRows(month).map((row) => {
          const first = row.find(Boolean);
          // A row with no day of the month (a short month's sixth) keeps the pane's height
          // and stays out of the grid's semantics: a row must hold a cell.
          if (!first) {
            // On a phone the times sit under the grid: the blank row is not kept there.
            return (
              <div
                key={`${month}-blank`}
                aria-hidden="true"
                className="grid grid-cols-7 max-md:hidden"
              >
                {row.map((_, c) => (
                  <div key={weekdays[c]?.long} className={DAY_CELL} />
                ))}
              </div>
            );
          }
          return (
            <div key={first.key} role="row" className="grid grid-cols-7">
              {row.map((cell, c) => {
                if (!cell) {
                  return <div key={weekdays[c]?.long} aria-hidden="true" className={DAY_CELL} />;
                }
                const count = days?.[cell.key];
                const isOpen = (count ?? 0) > 0;
                const isSelected = selected === cell.key;
                const isToday = today === cell.key;
                const isCurrent = current === cell.key;
                const full = riyadhDayLabel(riyadhInstant(cell.key, 12 * 60), copy.dateLocale);
                const reason = closedReasons.get(cell.key);
                if (!isOpen) {
                  const state = days === undefined ? 'loading' : reason ? 'closed' : 'off';
                  return (
                    <div
                      key={cell.key}
                      role="gridcell"
                      aria-disabled="true"
                      aria-label={full}
                      title={reason ? fill(copy.booking.closed, { reason }) : undefined}
                      className={DAY_CELL}
                      data-booking-day={cell.key}
                      data-booking-day-state={state}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          DAY_DISC,
                          DAY_MUTED,
                          isToday && DAY_TODAY,
                          isCurrent && DAY_CURRENT,
                        )}
                      >
                        {cell.day}
                      </span>
                    </div>
                  );
                }
                return (
                  <div
                    key={cell.key}
                    role="gridcell"
                    aria-selected={isSelected}
                    className={DAY_CELL}
                  >
                    <button
                      type="button"
                      id={cellId(idPrefix, cell.key)}
                      tabIndex={tabbable === cell.key ? 0 : -1}
                      aria-label={full}
                      aria-current={isToday ? 'date' : undefined}
                      onFocus={() => setFocused(cell.key)}
                      onClick={() => onSelect(cell.key)}
                      className={cn(
                        DAY_DISC,
                        isSelected ? DAY_SELECTED : DAY_OPEN,
                        isToday && !isSelected && DAY_TODAY,
                        isCurrent && !isSelected && DAY_CURRENT,
                      )}
                      data-booking-day={cell.key}
                      data-booking-day-state={isSelected ? 'selected' : 'open'}
                    >
                      {cell.day}
                      {!isSelected && <span aria-hidden="true" className={DAY_DOT} />}
                    </button>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      {failed && (
        <p className="text-small text-error" role="alert">
          {copy.booking.failure}
        </p>
      )}
      {days === undefined && !failed && (
        <p className="sr-only" aria-live="polite">
          {copy.booking.loadingDays}
        </p>
      )}
    </div>
  );
}
