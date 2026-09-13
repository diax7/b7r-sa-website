import type { Metadata } from 'next';
import { buildMetadata } from '@/modules/core';
import { LegalPage } from '@/modules/pages';

export const metadata: Metadata = buildMetadata('/terms');

export default function LegalRoute() {
  return <LegalPage slug="terms" />;
}
