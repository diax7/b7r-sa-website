'use client';

import type { FormEvent } from 'react';
import { Button } from '@/components/shared/button';
import { Input } from '@/components/shared/input';
import { Textarea } from '@/components/shared/textarea';
import type {
  BookerCopy,
  BookerErrors,
  BookerField,
  BookerValues,
} from '@/modules/bookings/booker/copy';
import { NOTE_MAX } from '@/modules/bookings/booker/copy';

export interface BookingFormProps {
  copy: BookerCopy;
  values: BookerValues;
  errors: BookerErrors;
  submitting: boolean;
  /** The failure line above the button, with the WhatsApp way beside it. */
  failure: string | null;
  whatsappHref: string;
  idPrefix: string;
  onChange(field: keyof BookerValues, value: string): void;
  onSubmit(e: FormEvent<HTMLFormElement>): void;
}

/**
 * The form step (ADR-063, BRD 4.11's labels, placeholders and messages): the name, the
 * phone, the e-mail, the optional notes, the honeypot, «أكّد الحجز» with its pending state.
 * The island owns the values, the rules, the Turnstile container and the request; the
 * failure keeps the values and points to WhatsApp.
 */
export function BookingForm({
  copy,
  values,
  errors,
  submitting,
  failure,
  whatsappHref,
  idPrefix,
  onChange,
  onSubmit,
}: BookingFormProps) {
  const fieldId = (field: keyof BookerValues) => `${idPrefix}-${field}`;
  const errorId = (field: BookerField) => `${idPrefix}-${field}-error`;
  const describedBy = (field: BookerField) => (errors[field] ? errorId(field) : undefined);
  const errorLine = (field: BookerField) =>
    errors[field] ? (
      <p id={errorId(field)} className="text-small text-error">
        {errors[field]}
      </p>
    ) : null;
  return (
    <form
      className="flex max-w-[560px] flex-col gap-5"
      onSubmit={onSubmit}
      noValidate
      data-testid="booking-form"
    >
      {/* Honeypot: hidden from people, tempting to bots. */}
      <div aria-hidden="true" className="absolute -m-px h-px w-px overflow-hidden">
        <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>
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
          onChange={(e) => onChange('name', e.target.value)}
          invalid={Boolean(errors.name)}
          aria-describedby={describedBy('name')}
        />
        {errorLine('name')}
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
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
            onChange={(e) => onChange('phone', e.target.value)}
            invalid={Boolean(errors.phone)}
            aria-describedby={describedBy('phone')}
          />
          {errorLine('phone')}
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
            onChange={(e) => onChange('email', e.target.value)}
            invalid={Boolean(errors.email)}
            aria-describedby={describedBy('email')}
          />
          {errorLine('email')}
        </div>
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
          onChange={(e) => onChange('note', e.target.value)}
          className="min-h-24"
        />
      </div>
      {failure && (
        <p className="text-small text-error" role="alert" data-testid="booking-message">
          {failure}{' '}
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {copy.whatsapp}
          </a>
        </p>
      )}
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" size="lg" loading={submitting} data-booking-submit="">
          {submitting ? copy.booking.submitting : copy.booking.submit}
        </Button>
      </div>
    </form>
  );
}
