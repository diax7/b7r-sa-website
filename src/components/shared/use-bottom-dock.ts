'use client';

import { useEffect } from 'react';

/** Height of the sticky bottom bars (designer results, product CTA) on phones. */
export const BOTTOM_DOCK_HEIGHT = '72px';

/**
 * Tells the fixed widgets (WhatsApp, consent card) how much of the bottom edge a sticky bar
 * occupies, so they lift above it on phones; the value is `0px` on desktop and when hidden.
 */
export function useBottomDock(visible: boolean) {
  useEffect(() => {
    const root = document.documentElement;
    const mobile = window.matchMedia('(max-width: 1023px)');
    const apply = () =>
      root.style.setProperty(
        '--bottom-dock',
        visible && mobile.matches ? BOTTOM_DOCK_HEIGHT : '0px',
      );
    apply();
    mobile.addEventListener('change', apply);
    return () => {
      mobile.removeEventListener('change', apply);
      root.style.removeProperty('--bottom-dock');
    };
  }, [visible]);
}
