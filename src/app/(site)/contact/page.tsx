import type { Metadata } from 'next';
import { buildMetadata } from '@/modules/core';
import { ContactPage } from '@/modules/contact';

export const metadata: Metadata = buildMetadata('/contact');

export default function ContactRoute() {
  return <ContactPage />;
}
