'use client';

import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';
import { NearViewport } from '@/modules/core/lazy-mount';

// `ssr: false` inside a client component keeps the Radix accordion out of the route's initial
// JS; the server-rendered list is shown until the island mounts near the viewport.
const FaqAccordion = dynamic(
  () => import('@/modules/core/faq/faq-accordion').then((m) => m.FaqAccordion),
  {
    ssr: false,
  },
);

interface FaqAccordionLoaderProps {
  items: Array<{ question: string; answer: string }>;
  fallback: ReactNode;
}

export function FaqAccordionLoader({ items, fallback }: FaqAccordionLoaderProps) {
  return (
    <NearViewport fallback={fallback}>
      <FaqAccordion items={items} />
    </NearViewport>
  );
}
