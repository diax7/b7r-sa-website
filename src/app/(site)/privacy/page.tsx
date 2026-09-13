import type { Metadata } from 'next';
import { buildMetadata } from '@/modules/core/seo/metadata';
import { LegalPage } from '@/modules/pages';

export const generateMetadata = (): Promise<Metadata> => buildMetadata('/privacy');

export default function LegalRoute() {
  return <LegalPage slug="privacy" />;
}
