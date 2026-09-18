import { useId } from 'react';
import {
  NewsletterFields,
  type NewsletterCopy,
} from '@/modules/forms/newsletter/newsletter-fields';
import { NewsletterLoader } from '@/modules/forms/newsletter/newsletter-loader';

export type { NewsletterCopy };

interface NewsletterFormProps {
  copy: NewsletterCopy;
  /** Footer (navy) or inline (surface) styling. */
  tone?: 'dark' | 'light';
}

/**
 * Newsletter form (BRD 6.3.3, 6.14): the server renders the rows inert, the island with the
 * submit code mounts near the viewport over the same boxes (site audit 2026-09-18, item 12:
 * nothing below the fold in the first-paint JS).
 */
export function NewsletterForm({ copy, tone = 'dark' }: NewsletterFormProps) {
  // The blog index renders two (its own section and the footer's): each gets its own id.
  const id = useId();
  return (
    <NewsletterLoader
      copy={copy}
      tone={tone}
      fallback={<NewsletterFields copy={copy} tone={tone} id={id} status="idle" email="" inert />}
    />
  );
}
