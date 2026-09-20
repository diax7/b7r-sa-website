'use client';

import { type FormEvent, useEffect, useId, useRef, useState } from 'react';
import { useTurnstile } from '@/components/shared/use-turnstile';
import { cn } from '@/lib/cn';
import { htmlDir, type Locale } from '@/lib/i18n';
import { track } from '@/modules/core/analytics/track';
import { BookingForm } from '@/modules/bookings/booker/booking-form';
import {
  type BookerCopy,
  type BookerErrors,
  type BookerField,
  type BookerValues,
  validateBooker,
} from '@/modules/bookings/booker/copy';
import { EventPane } from '@/modules/bookings/booker/event-pane';
import { MonthGrid } from '@/modules/bookings/booker/month-grid';
import type { BookerSettings } from '@/modules/bookings/booker/props';
import {
  CALENDAR_PANE,
  CARD,
  PANES,
  STEP_PANE,
  type BookerMode,
} from '@/modules/bookings/booker/styles';
import { type BookedView, SuccessView } from '@/modules/bookings/booker/success-view';
import { TimesPane } from '@/modules/bookings/booker/times-pane';
import { useCalendar } from '@/modules/bookings/booker/use-calendar';

export interface BookingIslandProps {
  locale: Locale;
  copy: BookerCopy;
  settings: BookerSettings;
  mode: Extract<BookerMode, 'page' | 'inline'>;
  /** The contact card's own title, as the header row's heading in `inline` mode. */
  heading?: string;
  turnstileSiteKey: string | undefined;
  whatsappHref: string;
  /** The path the booking is made from, for the row. */
  page: string;
}

type Step = 'pick' | 'form' | 'done';
type Status = 'idle' | 'submitting' | 'taken' | 'failure';

const EMPTY: BookerValues = { name: '', phone: '', email: '', note: '' };

/** The campaign parameters of the page's own URL, for the row (never the referrer). */
function utmOf(search: string): { source?: string; medium?: string; campaign?: string } {
  const params = new URLSearchParams(search);
  const read = (key: string) => params.get(key)?.trim().slice(0, 100) || '';
  const source = read('utm_source');
  const medium = read('utm_medium');
  const campaign = read('utm_campaign');
  return {
    ...(source ? { source } : {}),
    ...(medium ? { medium } : {}),
    ...(campaign ? { campaign } : {}),
  };
}

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * The booker (ADR-063): one card in three panes. The event pane (who, what, how long,
 * where, which clock), the month grid, the times column with the split confirm; then the
 * form step in place of the two right panes, the event pane keeping the chosen time and
 * the way back; then the success view over the whole card. A 409 (the slot was taken
 * meanwhile) returns to the times with the day read again and a line saying so; a failure
 * keeps the values and points to WhatsApp. `page` is `/book`, `inline` the contact card
 * (the header row for the event pane, the times unfolding under the grid on a pick).
 */
export function BookingIsland({
  locale,
  copy,
  settings,
  mode,
  heading,
  turnstileSiteKey,
  whatsappHref,
  page,
}: BookingIslandProps) {
  const id = useId();
  const calendar = useCalendar({
    locale,
    horizonDays: settings.horizonDays,
    autoSelect: mode === 'page',
  });
  const { rootRef, picked, day, refreshDay, clearSplit } = calendar;
  const [step, setStep] = useState<Step>('pick');
  const [start, setStart] = useState<Date | null>(null);
  const [values, setValues] = useState<BookerValues>(EMPTY);
  const [errors, setErrors] = useState<BookerErrors>({});
  const [status, setStatus] = useState<Status>('idle');
  const [booked, setBooked] = useState<BookedView | null>(null);
  const [minHeight, setMinHeight] = useState<number | undefined>(undefined);
  const panesRef = useRef<HTMLDivElement>(null);
  const timesRef = useRef<HTMLDivElement>(null);
  const { mount: mountTurnstile, getToken } = useTurnstile(turnstileSiteKey);

  // A pick by the person on a phone (or in the contact card) brings the times into view.
  useEffect(() => {
    if (picked === 0) return;
    const narrow = mode === 'inline' || window.matchMedia('(max-width: 767px)').matches;
    if (!narrow) return;
    timesRef.current?.scrollIntoView({
      block: 'start',
      behavior: reducedMotion() ? 'auto' : 'smooth',
    });
  }, [picked, mode]);

  // The form step opens on its first field; the way back lands on the first time again.
  useEffect(() => {
    if (step === 'form') document.getElementById(`${id}-name`)?.focus();
  }, [step, id]);

  const confirm = (chosen: Date) => {
    if (window.matchMedia('(min-width: 768px)').matches) {
      setMinHeight(panesRef.current?.offsetHeight);
    }
    setStart(chosen);
    setStatus('idle');
    setStep('form');
  };

  const back = () => {
    clearSplit();
    setStep('pick');
    requestAnimationFrame(() => {
      rootRef.current?.querySelector<HTMLButtonElement>('[data-booking-slot]')?.focus();
    });
  };

  const change = (field: keyof BookerValues, value: string) => {
    setValues((v) => ({ ...v, [field]: value }));
    if (field !== 'note' && errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
    if (status === 'failure') setStatus('idle');
  };

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!start) return;
    const form = e.currentTarget;
    const website = (form.elements.namedItem('website') as HTMLInputElement | null)?.value ?? '';
    const found = validateBooker(values, copy);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      const first = Object.keys(found)[0] as BookerField | undefined;
      if (first) document.getElementById(`${id}-${first}`)?.focus();
      return;
    }
    setStatus('submitting');
    try {
      const turnstileToken = await getToken();
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          start: start.toISOString(),
          locale,
          page,
          utm: utmOf(window.location.search),
          website,
          turnstileToken,
        }),
      });
      if (res.status === 201) {
        const body = (await res.json()) as { booking: BookedView };
        setBooked(body.booking);
        setStatus('idle');
        setStep('done');
        track('booking_submit', { page });
        return;
      }
      if (res.status === 409) {
        setStatus('taken');
        setStart(null);
        refreshDay();
        setStep('pick');
        return;
      }
      setStatus('failure');
    } catch {
      setStatus('failure');
    }
  }

  const closedReasons = new Map(settings.closedDates.map((c) => [c.date, c.reason]));
  const showTimes = mode === 'page' || day !== null;

  return (
    <div
      ref={rootRef}
      className="flex flex-col"
      data-booking-island=""
      data-booking-mode={mode}
      data-booking-step={step}
    >
      <div className={CARD}>
        {step === 'done' && booked ? (
          <div className={STEP_PANE[mode]} style={{ minHeight }}>
            <SuccessView
              locale={locale}
              copy={copy}
              settings={settings}
              booking={booked}
              merchant={values.name.trim()}
              note={values.note}
            />
          </div>
        ) : (
          <div
            ref={panesRef}
            className={PANES[mode]}
            style={step === 'form' ? { minHeight } : undefined}
          >
            <EventPane
              settings={settings}
              copy={copy}
              mode={mode}
              {...(heading ? { heading } : {})}
              chosen={step === 'form' ? start : null}
              {...(step === 'form' ? { onBack: back } : {})}
            />
            {step === 'pick' ? (
              <>
                <div className={CALENDAR_PANE[mode]}>
                  <MonthGrid
                    month={calendar.month}
                    days={calendar.days}
                    failed={calendar.daysFailed}
                    bounds={calendar.bounds}
                    today={calendar.today}
                    selected={calendar.day}
                    closedReasons={closedReasons}
                    copy={copy}
                    dir={htmlDir(locale)}
                    idPrefix={id}
                    compact={mode === 'inline'}
                    onSelect={calendar.selectDay}
                    onMonth={calendar.turnMonth}
                  />
                </div>
                {showTimes && (
                  <TimesPane
                    ref={timesRef}
                    mode={mode}
                    day={calendar.day}
                    slots={calendar.slots}
                    armed={calendar.armed}
                    notice={status === 'taken' ? copy.booking.taken : null}
                    confirmLabel={copy.booking.confirm}
                    copy={copy}
                    idPrefix={id}
                    onPress={calendar.press}
                    onConfirm={confirm}
                  />
                )}
              </>
            ) : (
              <div className={cn(STEP_PANE[mode], 'animate-step-in')}>
                <BookingForm
                  copy={copy}
                  values={values}
                  errors={errors}
                  submitting={status === 'submitting'}
                  failure={status === 'failure' ? copy.booking.failure : null}
                  whatsappHref={whatsappHref}
                  idPrefix={id}
                  onChange={change}
                  onSubmit={onSubmit}
                />
              </div>
            )}
          </div>
        )}
      </div>
      {/* Turnstile mounts here when a site key exists, from the island's first render (the
          hook renders the widget once, on mount), and stays empty unless interaction is
          required. */}
      <div ref={mountTurnstile} data-turnstile="" className={cn(!turnstileSiteKey && 'hidden')} />
    </div>
  );
}
