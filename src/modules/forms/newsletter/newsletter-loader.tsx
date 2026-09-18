'use client';

import { lazy, type ReactNode } from 'react';
import { NearViewport } from '@/modules/core/lazy-mount';
import type { NewsletterCopy } from '@/modules/forms/newsletter/newsletter-fields';

// The `import()` in a client module keeps the form's state and submit code out of every
// route's first-paint JS; the server-rendered inert rows stay on screen until the island
// mounts near the viewport (the footer, or the blog index's newsletter section).
const NewsletterIsland = lazy(() =>
  import('@/modules/forms/newsletter/newsletter-island').then((m) => ({
    default: m.NewsletterIsland,
  })),
);

interface NewsletterLoaderProps {
  copy: NewsletterCopy;
  tone: 'dark' | 'light';
  /** The inert `NewsletterFields`: the same boxes, so the swap moves nothing. */
  fallback: ReactNode;
}

/** Mounts the newsletter island near the viewport over its server-rendered stand-in. */
export function NewsletterLoader({ copy, tone, fallback }: NewsletterLoaderProps) {
  return (
    <NearViewport fallback={fallback}>
      <NewsletterIsland copy={copy} tone={tone} />
    </NearViewport>
  );
}
