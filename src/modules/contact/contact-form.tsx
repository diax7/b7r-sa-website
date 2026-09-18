'use client';

import { Check } from 'lucide-react';
import { useId, useState, type FormEvent } from 'react';
import { Button } from '@/components/shared/button';
import { Icon } from '@/components/shared/icon';
import { Input } from '@/components/shared/input';
import { Textarea } from '@/components/shared/textarea';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/cn';
import type { Locale } from '@/lib/i18n';
import { track } from '@/modules/core/analytics/track';
import {
  type ContactCopy,
  validateContact,
  type ContactErrors,
  type ContactField,
  type ContactValues,
} from '@/modules/contact/validate';
import { useTurnstile } from '@/components/shared/use-turnstile';

export interface ContactFormProps {
  locale: Locale;
  copy: ContactCopy;
  whatsappHref: string;
  turnstileSiteKey: string | undefined;
}

type Field = ContactField;
type Values = ContactValues;
type Errors = ContactErrors;
type Status = 'idle' | 'submitting' | 'success' | 'failure';

const EMPTY: Values = { name: '', phone: '', email: '', inquiry: '', message: '' };

/**
 * Contact form (BRD 6.9, 4.11): the BRD messages under each field on submit,
 * honeypot, Turnstile executed at submit, «جارٍ الإرسال» while pending, a success card on
 * 2xx, and the failure line above the button with values kept otherwise.
 */
export function ContactForm({ locale, copy, whatsappHref, turnstileSiteKey }: ContactFormProps) {
  const id = useId();
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>('idle');
  const { mount: mountTurnstile, getToken } = useTurnstile(turnstileSiteKey);

  const set = (field: Field) => (value: string) => {
    setValues((v) => ({ ...v, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
    if (status === 'failure') setStatus('idle');
  };

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const website = (form.elements.namedItem('website') as HTMLInputElement | null)?.value ?? '';
    const found = validateContact(values, copy);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      const first = Object.keys(found)[0] as Field | undefined;
      if (first) document.getElementById(`${id}-${first}`)?.focus();
      return;
    }
    setStatus('submitting');
    try {
      const turnstileToken = await getToken();
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, locale, website, turnstileToken }),
      });
      if (res.ok) {
        setStatus('success');
        track('contact_submit', { inquiry: values.inquiry });
      } else {
        setStatus('failure');
      }
    } catch {
      setStatus('failure');
    }
  }

  if (status === 'success') {
    return (
      <div
        role="status"
        className="flex flex-col items-center gap-4 py-10 text-center"
        data-testid="contact-success"
      >
        <span className="grid size-14 place-items-center rounded-pill bg-success/10 text-success">
          <Icon icon={Check} size={28} strokeWidth={2.25} />
        </span>
        <p className="text-h4 text-text">{copy.success}</p>
        <Button asChild variant="secondary" trailingArrow={false}>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener"
            data-track="whatsapp_click"
            data-location="contact"
          >
            {copy.successWhatsapp}
          </a>
        </Button>
      </div>
    );
  }

  const fieldId = (field: Field) => `${id}-${field}`;
  const errorId = (field: Field) => `${id}-${field}-error`;
  const describedBy = (field: Field) => (errors[field] ? errorId(field) : undefined);

  const errorLine = (field: Field) =>
    errors[field] ? (
      <p id={errorId(field)} className="text-small text-error">
        {errors[field]}
      </p>
    ) : null;

  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit} noValidate data-testid="contact-form">
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
        <label
          id={`${id}-inquiry-label`}
          htmlFor={fieldId('inquiry')}
          className="text-small font-medium text-text"
        >
          {copy.labels.inquiry}
        </label>
        <Select
          id={fieldId('inquiry')}
          name="inquiry"
          value={values.inquiry}
          onValueChange={set('inquiry')}
          options={copy.inquiryOptions}
          placeholder={copy.labels.inquiry}
          invalid={Boolean(errors.inquiry)}
          aria-labelledby={`${id}-inquiry-label`}
          aria-describedby={describedBy('inquiry')}
        />
        {errorLine('inquiry')}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={fieldId('message')} className="text-small font-medium text-text">
          {copy.labels.message}
        </label>
        <Textarea
          id={fieldId('message')}
          name="message"
          placeholder={copy.placeholders.message}
          value={values.message}
          onChange={(e) => set('message')(e.target.value)}
          invalid={Boolean(errors.message)}
          aria-describedby={describedBy('message')}
        />
        {errorLine('message')}
      </div>

      {/* Turnstile mounts here when a site key exists; empty unless interaction is required. */}
      <div ref={mountTurnstile} data-turnstile="" className={cn(!turnstileSiteKey && 'hidden')} />

      <p
        aria-live="polite"
        className={cn('min-h-5 text-small', status === 'failure' ? 'text-error' : '')}
        data-testid="contact-message"
      >
        {status === 'failure' ? copy.failure : ''}
      </p>

      <Button type="submit" size="lg" loading={status === 'submitting'} className="self-start">
        {status === 'submitting' ? copy.sending : copy.submit}
      </Button>
    </form>
  );
}
