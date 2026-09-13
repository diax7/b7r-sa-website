import type { Metadata } from 'next';
import { buildMetadata } from '@/modules/core';
import { AboutPage } from '@/modules/pages';

export const metadata: Metadata = buildMetadata('/about');

export default function AboutRoute() {
  return <AboutPage />;
}
