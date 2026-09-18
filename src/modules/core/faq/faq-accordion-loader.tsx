'use client';

import { lazy, type ReactNode } from 'react';
import { NearViewport } from '@/modules/core/lazy-mount';

// The `import()` in a client module keeps the Radix accordion (about 6 KB gzip with its
// collection, collapsible and presence helpers) out of every route's first-paint JS; the
// server-rendered closed rows stay on screen until the island mounts near the viewport.
const FaqAccordion = lazy(() =>
  import('@/modules/core/faq/faq-accordion').then((m) => ({ default: m.FaqAccordion })),
);

interface FaqAccordionLoaderProps {
  items: Array<{ question: string; answer: string }>;
  /** `FaqClosedList` with the same items: the same boxes, so the swap moves nothing. */
  fallback: ReactNode;
}

/** Mounts the FAQ accordion near the viewport over its server-rendered closed rows. */
export function FaqAccordionLoader({ items, fallback }: FaqAccordionLoaderProps) {
  return (
    <NearViewport fallback={fallback}>
      <FaqAccordion items={items} />
    </NearViewport>
  );
}
