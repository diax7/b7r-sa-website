import type { Metadata } from 'next';
import { buildMetadata } from '@/modules/core';
import { HowItWorksPage } from '@/modules/pages';

export const metadata: Metadata = buildMetadata('/how-it-works');

export default function HowItWorksRoute() {
  return <HowItWorksPage />;
}
