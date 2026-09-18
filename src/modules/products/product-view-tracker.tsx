'use client';

import { useEffect } from 'react';
import { track } from '@/modules/core/analytics/track';

/** Fires `product_view{slug}` once per detail page mount (BRD 6.6). */
export function ProductViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    track('product_view', { slug });
  }, [slug]);
  return null;
}
