'use client';

import { useEffect } from 'react';
import { armReveal } from '@/modules/core/reveal-arm';

/**
 * Mounts the scroll reveal (ADR-055) once the page has hydrated: rendered by `PageExtras`
 * in the site layout, so it lives across client navigations and the MutationObserver in
 * `armReveal` arms every page that follows.
 */
export function RevealObserver() {
  useEffect(() => armReveal(), []);
  return null;
}
