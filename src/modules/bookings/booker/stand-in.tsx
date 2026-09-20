import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Icon } from '@/components/shared/icon';
import { cn } from '@/lib/cn';
import type { BookerCopy } from '@/modules/bookings/booker/copy';
import { EventPane } from '@/modules/bookings/booker/event-pane';
import { monthLabel, monthRows, weekdayNames } from '@/modules/bookings/booker/month';
import type { BookerSettings } from '@/modules/bookings/booker/props';
import {
  type BookerMode,
  CALENDAR_PANE,
  CARD,
  DAY_CELL,
  DAY_DISC,
  DAY_MUTED,
  DAY_TODAY,
  MONTH_NAV_BUTTON,
  PANES,
  SKELETON_LINE,
  SKELETON_ROW,
  STEP_PANE,
  TIMES_PANE,
  TIMES_SCROLL,
  WEEKDAY_HEAD,
} from '@/modules/bookings/booker/styles';

export interface BookerStandInProps {
  mode: BookerMode;
  copy: BookerCopy;
  settings: BookerSettings;
  heading?: string;
  /** Today's month and day in Riyadh, at the render. */
  month: string;
  today: string;
}

/** The month grid as the island draws it while the counts load: the numbers muted, nothing focusable. */
function MonthGridStandIn({
  month,
  today,
  copy,
  mode,
}: Pick<BookerStandInProps, 'month' | 'today' | 'copy' | 'mode'>) {
  const weekdays = weekdayNames(copy.dateLocale);
  return (
    <div className="flex flex-col gap-3" data-booking-calendar="">
      <div className="flex items-center justify-between gap-2">
        <p className="text-body font-medium text-text" data-booking-month={month}>
          {monthLabel(month, copy.dateLocale)}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className={MONTH_NAV_BUTTON}
            aria-label={copy.booking.previousMonth}
            aria-disabled="true"
          >
            <Icon icon={ChevronLeft} size={20} />
          </button>
          <button
            type="button"
            className={MONTH_NAV_BUTTON}
            aria-label={copy.booking.nextMonth}
            aria-disabled="true"
          >
            <Icon icon={ChevronRight} size={20} />
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-1" aria-busy="true" data-booking-days="loading">
        <div className="grid grid-cols-7">
          {weekdays.map((day) => (
            <div key={day.long} className={WEEKDAY_HEAD} aria-label={day.long}>
              <span aria-hidden="true">{day.initial}</span>
            </div>
          ))}
        </div>
        {monthRows(month).map((row) => (
          <div
            key={row.find(Boolean)?.key ?? `${month}-blank`}
            className={cn(
              'grid grid-cols-7',
              !row.some(Boolean) && (mode === 'inline' ? 'hidden' : 'max-md:hidden'),
            )}
          >
            {row.map((cell, c) =>
              cell ? (
                <div key={cell.key} className={DAY_CELL} data-booking-day-state="loading">
                  <span
                    aria-hidden="true"
                    className={cn(DAY_DISC, DAY_MUTED, today === cell.key && DAY_TODAY)}
                  >
                    {cell.day}
                  </span>
                </div>
              ) : (
                <div key={weekdays[c]?.long} className={DAY_CELL} />
              ),
            )}
          </div>
        ))}
        <p className="sr-only">{copy.booking.loadingDays}</p>
      </div>
    </div>
  );
}

/** The times pane before a day is chosen: a header line and six rows. */
function TimesStandIn({ mode, copy }: Pick<BookerStandInProps, 'mode' | 'copy'>) {
  return (
    <div className={TIMES_PANE[mode]} data-booking-times="" data-booking-slots="loading">
      <div className={TIMES_SCROLL[mode]}>
        <p className="sr-only">{copy.booking.loadingSlots}</p>
        <div className="flex flex-col gap-2" aria-hidden="true">
          <div className={cn(SKELETON_LINE, 'w-2/3')} />
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className={SKELETON_ROW} />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * The booker's server-rendered stand-in (ADR-063): the real event pane (the host's photo,
 * the name, the role, the title, the meta rows, the blurb: the words the page opens on)
 * and, for the other panes, the island's own loading state at the same dimensions, so the
 * island hydrates over it with no shift. The arrows are `aria-disabled` rather than
 * `disabled` so a Tab or a tap on one mounts the island (`NearViewport`). On the manage
 * page the event pane carries a loading line where the booking's time goes.
 */
export function BookerStandIn({ mode, copy, settings, heading, month, today }: BookerStandInProps) {
  if (mode === 'reschedule') {
    return (
      <div className={CARD} data-booking-stand-in="" data-booking-mode={mode}>
        <div className={PANES.reschedule}>
          <EventPane settings={settings} copy={copy} mode={mode}>
            <div className="flex flex-col gap-3 border-t border-border pt-4" aria-hidden="true">
              <div className={cn(SKELETON_LINE, 'h-7 w-20 rounded-pill')} />
              <div className={cn(SKELETON_LINE, 'w-3/4')} />
            </div>
          </EventPane>
          <div className={cn(STEP_PANE.reschedule, 'flex flex-col gap-6')}>
            <p className="sr-only" aria-live="polite" data-booking-manage-state="loading">
              {copy.loading}
            </p>
            <div className="flex flex-col gap-4 border-y border-border py-4" aria-hidden="true">
              <div className={cn(SKELETON_LINE, 'w-1/2')} />
              <div className={cn(SKELETON_LINE, 'w-2/3')} />
            </div>
            <div className="flex gap-3" aria-hidden="true">
              <div className={cn(SKELETON_ROW, 'w-36')} />
              <div className={cn(SKELETON_ROW, 'w-36')} />
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className={CARD} data-booking-stand-in="" data-booking-mode={mode}>
      <div className={PANES[mode]}>
        <EventPane settings={settings} copy={copy} mode={mode} {...(heading ? { heading } : {})} />
        <div className={CALENDAR_PANE[mode]}>
          <MonthGridStandIn month={month} today={today} copy={copy} mode={mode} />
        </div>
        {mode === 'page' && <TimesStandIn mode={mode} copy={copy} />}
      </div>
    </div>
  );
}
