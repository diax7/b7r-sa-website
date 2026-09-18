'use client';

import dynamic from 'next/dynamic';
import type { ContactFormProps } from '@/modules/contact/contact-form';

// Every designed page imports the block registry, so the form imported statically would sit
// in the first-paint JS of every CMS page (Radix Select, floating-ui, the Turnstile hook:
// about 30 KB gzip). The `import()` has to live in a client module to split the client
// bundle: a dynamic import in the server component still lands in the route's entry chunks.
// The form stays server-rendered and hydrates with the page where the block renders.
const ContactForm = dynamic(() =>
  import('@/modules/contact/contact-form').then((m) => m.ContactForm),
);

/** The contact form's client-side split point (site audit 2026-09-18, item 12). */
export function ContactFormLoader(props: ContactFormProps) {
  return <ContactForm {...props} />;
}
