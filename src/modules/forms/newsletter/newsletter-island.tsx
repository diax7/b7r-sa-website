'use client';

import { useId, useState, type FormEvent } from 'react';
import { track } from '@/modules/core/analytics/track';
import {
  NewsletterFields,
  type NewsletterCopy,
  type NewsletterStatus,
} from '@/modules/forms/newsletter/newsletter-fields';

interface NewsletterIslandProps {
  copy: NewsletterCopy;
  tone: 'dark' | 'light';
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * The newsletter form's behaviour (BRD 6.3.3, 6.14): validation, the POST, the BRD 4.5
 * messages by status code, disabled while submitting. Mounted near the viewport by
 * `NewsletterLoader` over the inert rows the server rendered.
 */
export function NewsletterIsland({ copy, tone }: NewsletterIslandProps) {
  const id = useId();
  const [status, setStatus] = useState<NewsletterStatus>('idle');
  const [email, setEmail] = useState('');

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

  return (
    <NewsletterFields
      copy={copy}
      tone={tone}
      id={id}
      status={status}
      email={email}
      onChange={(e) => {
        setEmail(e.target.value);
        if (status !== 'idle') setStatus('idle');
      }}
      onSubmit={onSubmit}
    />
  );
}
