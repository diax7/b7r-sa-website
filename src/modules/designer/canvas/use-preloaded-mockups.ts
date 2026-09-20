'use client';

import { useEffect } from 'react';
import type { Product } from '@/content/schema';
import { loadMockup, preloadMockups } from '@/modules/designer/canvas/mockup-image';
import { mockupSourceOf } from '@/modules/designer/mockup';

/**
 * Warms the other products' mockups once the current one has arrived (ADR-064): five files
 * of about 12 KB, fetched one after the other at low priority in picker order, so a click
 * on any chip draws from memory under the crossfade. A product switch re-walks the list,
 * which costs nothing: the loader hands back what is there or in flight.
 */
export function usePreloadedMockups(products: Product[], current: Product): void {
  const sources = products.map(mockupSourceOf).filter((s): s is string => Boolean(s));
  const first = mockupSourceOf(current);
  const key = sources.join('\n');
  useEffect(() => {
    let cancelled = false;
    const others = key.split('\n').filter((s) => s && s !== first);
    const ready = first ? loadMockup(first).catch(() => undefined) : Promise.resolve();
    void ready.then(() => {
      if (!cancelled) void preloadMockups(others);
    });
    return () => {
      cancelled = true;
    };
  }, [key, first]);
}
