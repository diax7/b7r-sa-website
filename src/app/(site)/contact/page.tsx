import type { Metadata } from 'next';
import { buildMetadata } from '@/modules/core/seo/metadata';
import { ContactPage } from '@/modules/contact';

export const generateMetadata = (): Promise<Metadata> => buildMetadata('/contact');

export default function ContactRoute() {
  return <ContactPage />;
}
