import type { ChangeEvent, FormEvent } from 'react';
import { Button } from '@/components/shared/button';
import { Input } from '@/components/shared/input';
import { cn } from '@/lib/cn';

export interface NewsletterCopy {
  label: string;
  placeholder: string;
  button: string;
  success: string;
  invalid: string;
  unavailable: string;
}

export type NewsletterStatus = 'idle' | 'submitting' | 'success' | 'invalid' | 'unavailable';

interface NewsletterFieldsProps {
  copy: NewsletterCopy;
  /** Footer (navy) or inline (surface) styling. */
  tone: 'dark' | 'light';
  /** A stable id for the field, its label and its message. */
  id: string;
  status: NewsletterStatus;
  email: string;
  /** The server-rendered rows before the island mounts: nothing can be typed or sent. */
  inert?: boolean;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  onSubmit?: (e: FormEvent<HTMLFormElement>) => void;
}

/**
 * The newsletter form's markup (BRD 6.3.3, 6.14): email + button, honeypot, inline
 * `aria-live` message. Rendered by the island with its state, and by the server as the
 * inert stand-in the island replaces near the viewport; one markup, so the swap moves nothing.
 */
export function NewsletterFields({
  copy,
  tone,
  id,
  status,
  email,
  inert = false,
  onChange,
  onSubmit,
}: NewsletterFieldsProps) {
  const dark = tone === 'dark';
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
          onChange={onChange}
          invalid={status === 'invalid'}
          aria-describedby={`${id}-msg`}
          disabled={inert || status === 'submitting' || status === 'success'}
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
          disabled={inert || status === 'success'}
          // The stand-in is disabled, not dimmed: it paints exactly as the island will.
          className={cn(inert && 'disabled:opacity-100')}
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
