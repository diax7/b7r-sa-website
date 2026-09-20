'use client';

import { CalendarX2, type Check, Clock, Link2Off } from 'lucide-react';
import { type ReactNode, useEffect, useId, useRef, useState } from 'react';
import { Button } from '@/components/shared/button';
import { Icon } from '@/components/shared/icon';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/cn';
import { htmlDir, type Locale, localePath } from '@/lib/i18n';
import { riyadh, riyadhDayShortLabel, riyadhTimeLabel } from '@/lib/riyadh';
import { CalendarMenu } from '@/modules/bookings/booker/calendar-menu';
import { type BookerCopy, fill } from '@/modules/bookings/booker/copy';
import { EventPane } from '@/modules/bookings/booker/event-pane';
import { MonthGrid } from '@/modules/bookings/booker/month-grid';
import type { BookerSettings } from '@/modules/bookings/booker/props';
import { BookerStandIn } from '@/modules/bookings/booker/stand-in';
import { CALENDAR_PANE, CARD, PANES, STEP_PANE } from '@/modules/bookings/booker/styles';
import {
  calendarEventOf,
  SummaryRow,
  whenLines,
  WhenSpan,
  WhereRow,
} from '@/modules/bookings/booker/success-view';
import { TimesPane } from '@/modules/bookings/booker/times-pane';
import { useCalendar } from '@/modules/bookings/booker/use-calendar';

export interface ManageIslandProps {
  locale: Locale;
  copy: BookerCopy;
  settings: BookerSettings;
  whatsappHref: string;
}

/** What `GET /api/bookings/manage` answers: the booking as the page may show it. */
interface ManagedBooking {
  start: string;
  end: string;
  status: 'booked' | 'rescheduled' | 'cancelled' | 'completed';
  state: 'active' | 'cancelled' | 'past';
  meetLink: string | null;
  token: string;
  canReschedule: boolean;
  canCancel: boolean;
  noticeHours: number;
}

type Notice = 'none' | 'rescheduled' | 'cancelled' | 'taken' | 'tooLate' | 'failure';

type View =
  | { kind: 'loading' }
  | { kind: 'invalid' }
  | { kind: 'past' }
  | { kind: 'booking'; booking: ManagedBooking; notice: Notice };

async function readBooking(token: string): Promise<View> {
  try {
    const res = await fetch(`/api/bookings/manage?token=${encodeURIComponent(token)}`, {
      headers: { accept: 'application/json' },
    });
    if (res.status === 410) return { kind: 'past' };
    if (!res.ok) return { kind: 'invalid' };
    const body = (await res.json()) as { ok: boolean; booking: ManagedBooking };
    return { kind: 'booking', booking: body.booking, notice: 'none' };
  } catch {
    return { kind: 'invalid' };
  }
}

const PILL: Record<ManagedBooking['status'], string> = {
  booked: 'bg-success/10 text-success',
  rescheduled: 'bg-warning/15 text-text',
  cancelled: 'bg-error/10 text-error',
  completed: 'bg-ground text-text-muted',
};

/** A full-card message: an icon disc, a sentence, one way on. */
function FullCard({
  icon,
  tone,
  text,
  action,
  state,
}: {
  icon: typeof Check;
  tone: 'success' | 'muted' | 'error';
  text: string;
  action: ReactNode;
  state: string;
}) {
  return (
    <div
      className="mx-auto flex max-w-[480px] flex-col items-center gap-5 px-6 py-12 text-center animate-step-in"
      data-booking-manage-state={state}
    >
      <span
        className={cn(
          'grid size-14 place-items-center rounded-pill',
          tone === 'success' && 'bg-success/10 text-success animate-pop-in',
          tone === 'muted' && 'bg-ground text-text-muted',
          tone === 'error' && 'bg-error/10 text-error',
        )}
      >
        <Icon icon={icon} size={28} strokeWidth={2.25} />
      </span>
      <p className="text-body text-text">{text}</p>
      {action}
    </div>
  );
}

/**
 * The manage page's island (ADR-063): the same card, the event pane holding the booking's
 * time and its status pill, the summary rows with the add-to-calendar menu, «غيّر الموعد»
 * opening the calendar and the times inline (the current slot marked and not selectable,
 * the confirm reading «أكّد التغيير», the same notice rule on both ends), «ألغِ الحجز»
 * through the site's dialog with the consequence; a cancelled, past or invalid link as a
 * full-card message with the way to book again.
 */
export function ManageIsland({ locale, copy, settings, whatsappHref }: ManageIslandProps) {
  const id = useId();
  const [view, setView] = useState<View>({ kind: 'loading' });
  const [rescheduling, setRescheduling] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [minHeight, setMinHeight] = useState<number | undefined>(undefined);
  const panesRef = useRef<HTMLDivElement>(null);
  const timesRef = useRef<HTMLDivElement>(null);
  const calendar = useCalendar({
    locale,
    horizonDays: settings.horizonDays,
    autoSelect: false,
  });
  const { rootRef, picked, refreshDay, clearSplit } = calendar;

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) {
      // oxlint-disable-next-line react/set-state-in-effect -- the token is only known after hydration (the URL)
      setView({ kind: 'invalid' });
      return;
    }
    void readBooking(token).then(setView);
  }, []);

  useEffect(() => {
    if (picked === 0 || !window.matchMedia('(max-width: 767px)').matches) return;
    timesRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [picked]);

  const bookAgain = (
    <Button asChild variant="primary" trailingArrow={false}>
      <a href={localePath(locale, '/book')} data-booking-book-again="">
        {copy.booking.bookAgain}
      </a>
    </Button>
  );
  const whatsapp = (
    <Button asChild variant="secondary" trailingArrow={false}>
      <a href={whatsappHref} target="_blank" rel="noopener">
        {copy.whatsapp}
      </a>
    </Button>
  );

  if (view.kind === 'loading') {
    return (
      <BookerStandIn
        mode="reschedule"
        copy={copy}
        settings={settings}
        month={calendar.month}
        today={calendar.today}
      />
    );
  }
  if (view.kind === 'invalid') {
    return (
      <div className={CARD} data-booking-island="" data-booking-mode="reschedule">
        <FullCard
          icon={Link2Off}
          tone="error"
          text={copy.booking.invalid}
          action={whatsapp}
          state="invalid"
        />
      </div>
    );
  }
  if (view.kind === 'past') {
    return (
      <div className={CARD} data-booking-island="" data-booking-mode="reschedule">
        <FullCard
          icon={Clock}
          tone="muted"
          text={copy.booking.past}
          action={bookAgain}
          state="past"
        />
      </div>
    );
  }

  const { booking, notice } = view;

  async function post(body: Record<string, unknown>): Promise<void> {
    setBusy(true);
    try {
      const res = await fetch('/api/bookings/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: booking.token, ...body }),
      });
      if (res.ok) {
        const next = (await res.json()) as { booking: ManagedBooking };
        setView({
          kind: 'booking',
          booking: next.booking,
          notice: body['action'] === 'cancel' ? 'cancelled' : 'rescheduled',
        });
        setRescheduling(false);
        setCancelOpen(false);
        // The day's list is stale now (the old slot free, the new one taken): read again next time.
        if (body['action'] === 'reschedule') refreshDay();
        return;
      }
      if (res.status === 409) {
        setView({ kind: 'booking', booking, notice: 'taken' });
        refreshDay();
        return;
      }
      if (res.status === 403) {
        setView({ kind: 'booking', booking, notice: 'tooLate' });
        setRescheduling(false);
        return;
      }
      if (res.status === 410) {
        const refreshed = await readBooking(booking.token);
        setView(refreshed.kind === 'booking' ? { ...refreshed, notice: 'none' } : refreshed);
        setRescheduling(false);
        setCancelOpen(false);
        return;
      }
      setView({ kind: 'booking', booking, notice: 'failure' });
    } catch {
      setView({ kind: 'booking', booking, notice: 'failure' });
    } finally {
      setBusy(false);
    }
  }

  const message =
    notice === 'rescheduled'
      ? copy.booking.rescheduled
      : notice === 'cancelled'
        ? copy.booking.cancelled
        : notice === 'taken'
          ? copy.booking.taken
          : notice === 'tooLate'
            ? fill(copy.booking.tooLate, { hours: booking.noticeHours })
            : notice === 'failure'
              ? copy.booking.failure
              : '';
  const good = notice === 'rescheduled' || notice === 'cancelled';
  const messageLine = (
    <p
      aria-live="polite"
      role={good ? 'status' : 'alert'}
      className={cn(
        'rounded-base px-4 py-3 text-small',
        good ? 'bg-success/10 text-success' : 'bg-error/10 text-error',
        !message && 'hidden',
      )}
      data-testid="manage-message"
    >
      {message}
    </p>
  );

  if (booking.state !== 'active') {
    const cancelled = booking.state === 'cancelled';
    return (
      <div
        className={CARD}
        data-booking-island=""
        data-booking-mode="reschedule"
        data-booking-manage-state={booking.state}
        data-booking-manage-status={booking.status}
      >
        <FullCard
          icon={cancelled ? CalendarX2 : Clock}
          tone={cancelled && notice === 'cancelled' ? 'success' : 'muted'}
          text={cancelled ? copy.booking.cancelled : copy.booking.past}
          action={bookAgain}
          state={booking.state}
        />
      </div>
    );
  }

  const start = new Date(booking.start);
  const comma = copy.dateLocale.startsWith('ar') ? '،' : ',';
  const when = whenLines(booking, copy);
  const currentDay = riyadh(start).dateKey;
  const closedReasons = new Map(settings.closedDates.map((c) => [c.date, c.reason]));
  // The booking's own slot is not free (it holds it), so the day's list from the route has
  // no row for it: it is put back in its place, marked and not selectable.
  const slots: typeof calendar.slots =
    calendar.slots.kind === 'ready' &&
    calendar.day === currentDay &&
    !calendar.slots.starts.some((s) => s.getTime() === start.getTime())
      ? {
          kind: 'ready',
          starts: [...calendar.slots.starts, start].toSorted((a, b) => a.getTime() - b.getTime()),
        }
      : calendar.slots;

  const openReschedule = () => {
    if (window.matchMedia('(min-width: 768px)').matches) {
      setMinHeight(panesRef.current?.offsetHeight);
    }
    setRescheduling(true);
  };
  const closeReschedule = () => {
    clearSplit();
    setRescheduling(false);
  };

  return (
    <div
      ref={rootRef}
      className={CARD}
      data-booking-island=""
      data-booking-mode="reschedule"
      data-booking-manage-state={booking.state}
      data-booking-manage-status={booking.status}
      data-booking-step={rescheduling ? 'reschedule' : 'view'}
    >
      <div ref={panesRef} className={PANES.reschedule} style={{ minHeight }}>
        <EventPane settings={settings} copy={copy} mode="reschedule">
          <div className="flex flex-col gap-3 border-t border-border pt-4">
            <span
              className={cn(
                'inline-flex h-7 items-center self-start rounded-pill px-3 text-caption font-medium',
                PILL[booking.status],
              )}
              data-booking-status={booking.status}
            >
              {copy.booking.status[booking.status]}
            </span>
            <p
              className="flex items-start gap-2 text-small text-text"
              data-booking-when={booking.start}
            >
              <Icon icon={Clock} size={18} className="mt-0.5 text-primary" />
              <span>
                {riyadhDayShortLabel(start, copy.dateLocale)}
                {comma} {riyadhTimeLabel(start, copy.dateLocale)}
              </span>
            </p>
            {rescheduling && (
              <button
                type="button"
                onClick={closeReschedule}
                className="inline-flex h-9 items-center gap-1.5 self-start rounded-inner text-small font-medium text-primary transition-colors duration-(--duration-fast) hover:text-primary-hover focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40"
                data-booking-back=""
              >
                {copy.booking.back}
              </button>
            )}
          </div>
        </EventPane>
        {rescheduling ? (
          <>
            <div className={cn(CALENDAR_PANE.reschedule, 'animate-step-in')}>
              {message && messageLine}
              <MonthGrid
                month={calendar.month}
                days={calendar.days}
                failed={calendar.daysFailed}
                bounds={calendar.bounds}
                today={calendar.today}
                selected={calendar.day}
                current={currentDay}
                closedReasons={closedReasons}
                copy={copy}
                dir={htmlDir(locale)}
                idPrefix={id}
                onSelect={calendar.selectDay}
                onMonth={calendar.turnMonth}
              />
            </div>
            <TimesPane
              ref={timesRef}
              mode="reschedule"
              day={calendar.day}
              slots={slots}
              armed={calendar.armed}
              current={booking.start}
              confirmLabel={copy.booking.confirmReschedule}
              copy={copy}
              idPrefix={id}
              stagger={calendar.stagger}
              onStaggered={calendar.markStaggered}
              onPress={calendar.press}
              onConfirm={(chosen) =>
                !busy && void post({ action: 'reschedule', start: chosen.toISOString() })
              }
            />
          </>
        ) : (
          <div className={cn(STEP_PANE.reschedule, 'flex flex-col gap-6 animate-step-in')}>
            {messageLine}
            <dl className="flex flex-col divide-y divide-border border-y border-border">
              <SummaryRow icon={Clock} label={copy.booking.when} testId="when">
                <span className="font-medium">{when.day}</span>
                <WhenSpan when={when} />
              </SummaryRow>
              <WhereRow booking={booking} copy={copy} />
            </dl>
            <div className="flex flex-wrap items-center gap-3">
              {booking.canReschedule && (
                <Button
                  variant="primary"
                  trailingArrow={false}
                  onClick={openReschedule}
                  data-booking-reschedule=""
                >
                  {copy.booking.reschedule}
                </Button>
              )}
              {booking.canCancel && (
                <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
                  <DialogTrigger asChild>
                    <Button variant="secondary" trailingArrow={false} data-booking-cancel="">
                      {copy.booking.cancel}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="flex flex-col gap-5" data-booking-cancel-dialog="">
                    <div className="flex flex-col gap-2">
                      <DialogTitle className="text-h4 text-text">
                        {copy.booking.cancelTitle}
                      </DialogTitle>
                      <DialogDescription className="text-body text-text-muted">
                        {copy.booking.cancelText}
                      </DialogDescription>
                    </div>
                    <div className="flex flex-wrap justify-end gap-3">
                      <DialogClose asChild>
                        <Button variant="secondary" trailingArrow={false} data-booking-keep="">
                          {copy.booking.keep}
                        </Button>
                      </DialogClose>
                      <Button
                        variant="primary"
                        trailingArrow={false}
                        loading={busy}
                        onClick={() => void post({ action: 'cancel' })}
                        data-booking-confirm-cancel=""
                        className="bg-error hover:bg-error/90"
                      >
                        {copy.booking.cancel}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              <CalendarMenu
                event={calendarEventOf(booking, settings, copy)}
                token={booking.token}
                copy={copy}
                variant="ghost"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
