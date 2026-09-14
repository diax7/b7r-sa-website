'use client';

import { useId, useState, type FormEvent } from 'react';
import { Button } from '@/components/shared/button';
import { Input } from '@/components/shared/input';
import { cn } from '@/lib/cn';
import { track } from '@/modules/core';

export interface NewsletterCopy {
  label: string;
  placeholder: string;
  button: string;
  success: string;
  invalid: string;
  unavailable: string;
}

type Status = 'idle' | 'submitting' | 'success' | 'invalid' | 'unavailable';

interface NewsletterFormProps {
  copy: NewsletterCopy;
  /** Footer (navy) or inline (surface) styling. */
  tone?: 'dark' | 'light';
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Newsletter form (BRD 6.3.3, 6.14): email + button, honeypot, inline `aria-live` messages,
 * disabled while submitting. Maps the API's status codes to the BRD 4.5 copy.
 */
export function NewsletterForm({ copy, tone = 'dark' }: NewsletterFormProps) {
  const id = useId();
  const [status, setStatus] = useState<Status>('idle');
  const [email, setEmail] = useState('');
  const dark = tone === 'dark';

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const website = (form.elements.namedItem('website') as HTMLInputElement | null)?.value ?? '';
    if (!EMAIL.test(email)) {
      setStatus('invalid');
      return;
    }
    setStatus('submitting');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, website }),
      });
      if (res.ok) {
        setStatus('success');
        track('newsletter_submit', {});
      } else if (res.status === 400) {
        setStatus('invalid');
      } else {
        setStatus('unavailable');
      }
    } catch {
      setStatus('unavailable');
    }
  }

  const message =
    status === 'success'
      ? copy.success
      : status === 'invalid'
        ? copy.invalid
        : status === 'unavailable'
          ? copy.unavailable
          : '';

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={onSubmit}
      noValidate
      data-testid="newsletter-form"
    >
      <label htmlFor={id} className={cn('text-small', dark ? 'text-white/75' : 'text-text-muted')}>
        {copy.label}
      </label>
      {/* Honeypot: hidden from people, tempting to bots (BRD 6.3.3). */}
      <div aria-hidden="true" className="absolute -m-px h-px w-px overflow-hidden">
        <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>
      <div className="flex gap-2">
        <Input
          id={id}
          type="email"
          name="email"
          dir="ltr"
          inputMode="email"
          autoComplete="email"
          placeholder={copy.placeholder}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status !== 'idle') setStatus('idle');
          }}
          invalid={status === 'invalid'}
          aria-describedby={`${id}-msg`}
          disabled={status === 'submitting' || status === 'success'}
          className={cn(
            dark &&
              'border-white/15 bg-white/5 text-white placeholder:text-white/40 focus:border-accent',
          )}
        />
        <Button
          type="submit"
          variant={dark ? 'inverse' : 'primary'}
          size="md"
          loading={status === 'submitting'}
          disabled={status === 'success'}
        >
          {copy.button}
        </Button>
      </div>
      <p
        id={`${id}-msg`}
        aria-live="polite"
        className={cn(
          'min-h-5 text-small',
          // On the navy footer neither status colour reaches 4.5:1; the message reads in
          // white there and the field's invalid state carries the error affordance.
          status === 'success'
            ? dark
              ? 'text-white'
              : 'text-success'
            : status === 'idle' || status === 'submitting'
              ? ''
              : dark
                ? 'text-white'
                : 'text-error',
        )}
        data-testid="newsletter-message"
      >
        {message}
      </p>
    </form>
  );
}
