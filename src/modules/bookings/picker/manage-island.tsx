'use client';

import { CalendarPlus, Video } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { Button } from '@/components/shared/button';
import { Icon } from '@/components/shared/icon';
import { cn } from '@/lib/cn';
import { type Locale, localePath } from '@/lib/i18n';
import { riyadhDayLabel, riyadhTimeLabel } from '@/lib/riyadh';
import type { PickerSettings } from '@/modules/bookings/picker/days';
import { Picker } from '@/modules/bookings/picker/picker';
import type { PickerCopy } from '@/modules/bookings/picker/validate';

export interface ManageIslandProps {
  locale: Locale;
  copy: PickerCopy;
  settings: PickerSettings;
  whatsappHref: string;
}

/** What `GET /api/bookings/manage` answers: the booking as the page may show it. */
interface ManagedBooking {
  start: string;
  end: string;
  status: string;
  state: 'active' | 'cancelled' | 'past';
  meetLink: string | null;
  token: string;
  canReschedule: boolean;
  canCancel: boolean;
  noticeHours: number;
}

type View =
  | { kind: 'loading' }
  | { kind: 'invalid' }
  | { kind: 'past' }
  | {
      kind: 'booking';
      booking: ManagedBooking;
      notice: 'none' | 'rescheduled' | 'cancelled' | 'taken' | 'tooLate' | 'failure';
    };

type Mode = 'view' | 'reschedule' | 'confirmCancel';

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

/**
 * The manage page's island (ADR-062): reads the booking by the token in the URL, shows it
 * with its state, offers a move (the same picker under the same notice rule) and a cancel
 * (until the start, after a confirmation); a cancelled or past booking shows its sentence
 * and the way to book again.
 */
export function ManageIsland({ locale, copy, settings, whatsappHref }: ManageIslandProps) {
  const id = useId();
  const [view, setView] = useState<View>({ kind: 'loading' });
  const [mode, setMode] = useState<Mode>('view');
  const [start, setStart] = useState<Date | null>(null);
  const [busy, setBusy] = useState(false);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) {
      // oxlint-disable-next-line react/set-state-in-effect -- the token is only known after hydration (the URL)
      setView({ kind: 'invalid' });
      return;
    }
    void readBooking(token).then(setView);
  }, []);

  const bookAgain = (
    <Button asChild variant="secondary" trailingArrow={false} className="self-start">
      <a href={localePath(locale, '/book')}>{copy.booking.bookAgain}</a>
    </Button>
  );
  const whatsapp = (
    <a
      href={whatsappHref}
      target="_blank"
      rel="noopener"
      className="text-body text-primary hover:text-primary-hover"
    >
      {copy.whatsapp}
    </a>
  );

  if (view.kind === 'loading') {
    return (
      <p
        className="text-body text-text-muted"
        aria-live="polite"
        data-booking-manage-state="loading"
      >
        {copy.loading}
      </p>
    );
  }
  if (view.kind === 'invalid') {
    return (
      <div className="flex flex-col gap-4" data-booking-manage-state="invalid">
        <p className="text-body text-text">{copy.booking.invalid}</p>
        {whatsapp}
      </div>
    );
  }
  if (view.kind === 'past') {
    return (
      <div className="flex flex-col gap-4" data-booking-manage-state="past">
        <p className="text-body text-text">{copy.booking.past}</p>
        {bookAgain}
      </div>
    );
  }

  const { booking, notice } = view;
  const when = `${riyadhDayLabel(new Date(booking.start), copy.dateLocale)}${locale === 'ar' ? '، ' : ', '}${riyadhTimeLabel(new Date(booking.start), copy.dateLocale)}`;
  const chosenLine = copy.booking.chosen
    .replace('{day}', riyadhDayLabel(new Date(booking.start), copy.dateLocale))
    .replace('{time}', riyadhTimeLabel(new Date(booking.start), copy.dateLocale));

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
        setMode('view');
        setStart(null);
        return;
      }
      if (res.status === 409) {
        setView({ kind: 'booking', booking, notice: 'taken' });
        setStart(null);
        setRefresh((n) => n + 1);
        return;
      }
      if (res.status === 403) {
        setView({ kind: 'booking', booking, notice: 'tooLate' });
        setMode('view');
        return;
      }
      if (res.status === 410) {
        const refreshed = await readBooking(booking.token);
        setView(refreshed.kind === 'booking' ? { ...refreshed, notice: 'none' } : refreshed);
        setMode('view');
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
            ? copy.booking.tooLate.replace('{hours}', String(booking.noticeHours))
            : notice === 'failure'
              ? copy.booking.failure
              : '';
  const tone = notice === 'rescheduled' || notice === 'cancelled' ? 'text-success' : 'text-error';
  const ics = `/api/bookings/ics?token=${encodeURIComponent(booking.token)}`;

  return (
    <div
      className="flex flex-col gap-6"
      data-booking-manage-state={booking.state}
      data-booking-manage-status={booking.status}
    >
      <p
        aria-live="polite"
        className={cn('text-body', message ? tone : 'hidden')}
        data-testid="manage-message"
      >
        {message}
      </p>
      <div className="flex flex-col gap-2">
        <p className="text-h4 text-text">{settings.title}</p>
        <p className="text-body text-text" data-booking-when={booking.start}>
          {booking.state === 'active' ? chosenLine : when}{' '}
          <span className="text-text-muted">({copy.booking.riyadhTime})</span>
        </p>
        {booking.state === 'cancelled' && notice !== 'cancelled' && (
          <p className="text-body text-text-muted">{copy.booking.cancelled}</p>
        )}
        {booking.state === 'past' && (
          <p className="text-body text-text-muted">{copy.booking.past}</p>
        )}
      </div>
      {booking.state === 'active' && booking.meetLink && (
        <a
          href={booking.meetLink}
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-2 text-body text-primary hover:text-primary-hover"
          data-booking-meet=""
        >
          <Icon icon={Video} size={18} />
          {copy.booking.meetLink}
        </a>
      )}
      {booking.state === 'active' && !booking.meetLink && (
        <p className="text-body text-text">{copy.booking.linkFollows}</p>
      )}
      {booking.state === 'active' && mode === 'view' && (
        <div className="flex flex-wrap items-center gap-3">
          {booking.canReschedule && (
            <Button
              variant="primary"
              trailingArrow={false}
              onClick={() => setMode('reschedule')}
              data-booking-reschedule=""
            >
              {copy.booking.reschedule}
            </Button>
          )}
          {booking.canCancel && (
            <Button
              variant="secondary"
              trailingArrow={false}
              onClick={() => setMode('confirmCancel')}
              data-booking-cancel=""
            >
              {copy.booking.cancel}
            </Button>
          )}
          <Button asChild variant="link" trailingArrow={false}>
            <a href={ics} data-booking-ics="">
              <Icon icon={CalendarPlus} size={18} />
              {copy.booking.addToCalendar}
            </a>
          </Button>
        </div>
      )}
      {booking.state === 'active' && mode === 'confirmCancel' && (
        <div
          className="flex flex-wrap items-center gap-3"
          role="group"
          aria-labelledby={`${id}-cancel`}
        >
          <span id={`${id}-cancel`} className="sr-only">
            {copy.booking.cancel}
          </span>
          <Button
            variant="primary"
            trailingArrow={false}
            loading={busy}
            onClick={() => void post({ action: 'cancel' })}
            data-booking-confirm-cancel=""
          >
            {copy.booking.confirmCancel}
          </Button>
          <Button variant="secondary" trailingArrow={false} onClick={() => setMode('view')}>
            {copy.booking.keep}
          </Button>
        </div>
      )}
      {booking.state === 'active' && mode === 'reschedule' && (
        <div className="flex flex-col gap-6">
          <Picker
            locale={locale}
            copy={copy}
            settings={settings}
            chosen={start}
            onChoose={setStart}
            refresh={refresh}
            idPrefix={id}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              trailingArrow={false}
              disabled={!start}
              loading={busy}
              onClick={() =>
                start && void post({ action: 'reschedule', start: start.toISOString() })
              }
              data-booking-confirm-reschedule=""
            >
              {copy.booking.reschedule}
            </Button>
            <Button variant="secondary" trailingArrow={false} onClick={() => setMode('view')}>
              {copy.booking.keep}
            </Button>
          </div>
        </div>
      )}
      {booking.state !== 'active' && bookAgain}
    </div>
  );
}
