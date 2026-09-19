'use client';

import { CalendarPlus, Check, Video } from 'lucide-react';
import { type FormEvent, useId, useState } from 'react';
import { Button } from '@/components/shared/button';
import { Icon } from '@/components/shared/icon';
import { Input } from '@/components/shared/input';
import { Textarea } from '@/components/shared/textarea';
import { useTurnstile } from '@/components/shared/use-turnstile';
import { cn } from '@/lib/cn';
import { type Locale, localePath } from '@/lib/i18n';
import { riyadhDayLabel, riyadhTimeLabel } from '@/lib/riyadh';
import { track } from '@/modules/core/analytics/track';
import type { PickerSettings } from '@/modules/bookings/picker/days';
import { Picker } from '@/modules/bookings/picker/picker';
import {
  NOTE_MAX,
  type PickerCopy,
  type PickerErrors,
  type PickerField,
  type PickerValues,
  validatePicker,
} from '@/modules/bookings/picker/validate';

export interface BookingIslandProps {
  locale: Locale;
  copy: PickerCopy;
  settings: PickerSettings;
  turnstileSiteKey: string | undefined;
  whatsappHref: string;
  /** The path the booking is made from, for the row. */
  page: string;
}

/** What the API answers on a booking: the fields the confirmation shows. */
export interface BookedView {
  start: string;
  end: string;
  meetLink: string | null;
  token: string;
}

type Status = 'idle' | 'submitting' | 'taken' | 'failure';

const EMPTY: PickerValues = { name: '', phone: '', email: '', note: '' };

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

/** The confirmation (BRD 4.19): the time, the Meet link or "the link follows", the calendar file, the manage link. */
export function Confirmation({
  locale,
  copy,
  booking,
  title,
}: {
  locale: Locale;
  copy: PickerCopy;
  booking: BookedView;
  title: string;
}) {
  const start = new Date(booking.start);
  const manage = `${localePath(locale, '/book/manage')}?token=${encodeURIComponent(booking.token)}`;
  const ics = `/api/bookings/ics?token=${encodeURIComponent(booking.token)}`;
  return (
    <div role="status" className="flex flex-col gap-5" data-testid="booking-success">
      <span className="grid size-14 place-items-center rounded-pill bg-success/10 text-success">
        <Icon icon={Check} size={28} strokeWidth={2.25} />
      </span>
      <div className="flex flex-col gap-2">
        <p className="text-h4 text-text">{copy.booking.confirmedTitle}</p>
        <p className="text-body text-text">{title}</p>
        <p className="text-body text-text">
          {copy.booking.chosen
            .replace('{day}', riyadhDayLabel(start, copy.dateLocale))
            .replace('{time}', riyadhTimeLabel(start, copy.dateLocale))}{' '}
          <span className="text-text-muted">({copy.booking.riyadhTime})</span>
        </p>
        <p className="text-body text-text-muted">{copy.booking.confirmedText}</p>
      </div>
      {booking.meetLink ? (
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
      ) : (
        <p className="text-body text-text" data-booking-link-follows="">
          {copy.booking.linkFollows}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="secondary" trailingArrow={false}>
          <a href={ics} data-booking-ics="">
            <Icon icon={CalendarPlus} size={18} />
            {copy.booking.addToCalendar}
          </a>
        </Button>
        <Button asChild variant="link" trailingArrow={false}>
          <a href={manage} data-booking-manage="">
            {copy.booking.manageLink}
          </a>
        </Button>
      </div>
    </div>
  );
}

/**
 * The booking island (ADR-062): the picker, then the merchant's name, phone, e-mail and note
 * with Turnstile at submit, then the confirmation. A 409 (the slot was taken meanwhile)
 * reloads the day's slots and says so; a failure keeps the values and points to WhatsApp.
 */
export function BookingIsland({
  locale,
  copy,
  settings,
  turnstileSiteKey,
  whatsappHref,
  page,
}: BookingIslandProps) {
  const id = useId();
  const [start, setStart] = useState<Date | null>(null);
  const [values, setValues] = useState<PickerValues>(EMPTY);
  const [errors, setErrors] = useState<PickerErrors>({});
  const [status, setStatus] = useState<Status>('idle');
  const [refresh, setRefresh] = useState(0);
  const [booked, setBooked] = useState<BookedView | null>(null);
  const { mount: mountTurnstile, getToken } = useTurnstile(turnstileSiteKey);

  const set = (field: keyof PickerValues) => (value: string) => {
    setValues((v) => ({ ...v, [field]: value }));
    if (field !== 'note' && errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
    if (status !== 'idle' && status !== 'submitting') setStatus('idle');
  };

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!start) return;
    const form = e.currentTarget;
    const website = (form.elements.namedItem('website') as HTMLInputElement | null)?.value ?? '';
    const found = validatePicker(values, copy);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      const first = Object.keys(found)[0] as PickerField | undefined;
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
        track('booking_submit', { page });
        return;
      }
      if (res.status === 409) {
        setStatus('taken');
        setStart(null);
        setRefresh((n) => n + 1);
        return;
      }
      setStatus('failure');
    } catch {
      setStatus('failure');
    }
  }

  if (booked) {
    return <Confirmation locale={locale} copy={copy} booking={booked} title={settings.title} />;
  }

  const fieldId = (field: keyof PickerValues) => `${id}-${field}`;
  const errorId = (field: PickerField) => `${id}-${field}-error`;
  const describedBy = (field: PickerField) => (errors[field] ? errorId(field) : undefined);
  const errorLine = (field: PickerField) =>
    errors[field] ? (
      <p id={errorId(field)} className="text-small text-error">
        {errors[field]}
      </p>
    ) : null;
  const message =
    status === 'taken' ? copy.booking.taken : status === 'failure' ? copy.booking.failure : '';

  return (
    <div className="flex flex-col gap-8" data-booking-island="">
      <Picker
        locale={locale}
        copy={copy}
        settings={settings}
        chosen={start}
        onChoose={setStart}
        refresh={refresh}
        idPrefix={id}
      />
      <p
        aria-live="polite"
        className={cn('text-small', message ? 'text-error' : 'hidden')}
        data-testid="booking-message"
      >
        {message}
      </p>
      {/* Turnstile mounts here when a site key exists, from the island's first render (the
          hook renders the widget once, on mount), and stays empty unless interaction is
          required; the form below appears once a slot is chosen. */}
      <div ref={mountTurnstile} data-turnstile="" className={cn(!turnstileSiteKey && 'hidden')} />
      {start && (
        <form
          className="flex flex-col gap-5"
          onSubmit={onSubmit}
          noValidate
          data-testid="booking-form"
        >
          {/* Honeypot: hidden from people, tempting to bots. */}
          <div aria-hidden="true" className="absolute -m-px h-px w-px overflow-hidden">
            <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label htmlFor={fieldId('name')} className="text-small font-medium text-text">
                {copy.labels.name}
              </label>
              <Input
                id={fieldId('name')}
                name="name"
                autoComplete="name"
                placeholder={copy.placeholders.name}
                value={values.name}
                onChange={(e) => set('name')(e.target.value)}
                invalid={Boolean(errors.name)}
                aria-describedby={describedBy('name')}
              />
              {errorLine('name')}
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor={fieldId('phone')} className="text-small font-medium text-text">
                {copy.labels.phone}
              </label>
              <Input
                id={fieldId('phone')}
                name="phone"
                type="tel"
                dir="ltr"
                inputMode="tel"
                autoComplete="tel"
                placeholder={copy.placeholders.phone}
                value={values.phone}
                onChange={(e) => set('phone')(e.target.value)}
                invalid={Boolean(errors.phone)}
                aria-describedby={describedBy('phone')}
              />
              {errorLine('phone')}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor={fieldId('email')} className="text-small font-medium text-text">
              {copy.labels.email}
            </label>
            <Input
              id={fieldId('email')}
              name="email"
              type="email"
              dir="ltr"
              inputMode="email"
              autoComplete="email"
              placeholder={copy.placeholders.email}
              value={values.email}
              onChange={(e) => set('email')(e.target.value)}
              invalid={Boolean(errors.email)}
              aria-describedby={describedBy('email')}
            />
            {errorLine('email')}
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor={fieldId('note')} className="text-small font-medium text-text">
              {copy.booking.note}
            </label>
            <Textarea
              id={fieldId('note')}
              name="note"
              maxLength={NOTE_MAX}
              placeholder={copy.booking.notePlaceholder}
              value={values.note}
              onChange={(e) => set('note')(e.target.value)}
              className="min-h-24"
            />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Button type="submit" size="lg" loading={status === 'submitting'}>
              {status === 'submitting' ? copy.booking.submitting : copy.booking.submit}
            </Button>
            {status === 'failure' && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener"
                className="text-body text-primary hover:text-primary-hover"
              >
                {copy.whatsapp}
              </a>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
