import type { Metadata } from 'next';
import { buildMetadata } from '@/modules/core';
import { FaqPage } from '@/modules/pages';

export const metadata: Metadata = buildMetadata('/faq');

export default function FaqRoute() {
  return <FaqPage />;
}
