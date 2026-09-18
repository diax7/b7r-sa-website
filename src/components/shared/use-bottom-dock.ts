'use client';

import { type RefObject, useEffect, useLayoutEffect } from 'react';

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

/**
 * Publishes the consent card's top edge as `--consent-top` while the card is shown: its
 * height above the widgets' base line (the viewport's bottom edge plus `--bottom-dock`), so
 * the WhatsApp panel opens above the card instead of over its buttons on a phone (site audit
 * 2026-09-18, item 6). Re-measured when the card's size changes (text wrap, breakpoint).
 * Two constants move together: the widget's 24 px `bottom` above the dock line
 * (`dockClass` in `whatsapp-widget.tsx`) and the panel's `-12px` in `panelBottom`, which
 * turns this edge into "12 px above the card"; the card itself sits 88 px up, above the
 * 56 px button, at every width.
 */
export function useConsentDock(card: RefObject<HTMLElement | null>, visible: boolean) {
  useLayoutEffect(() => {
    const el = card.current;
    if (!el || !visible) return;
    const root = document.documentElement;
    const apply = () => {
      const dock = Number.parseFloat(getComputedStyle(root).getPropertyValue('--bottom-dock')) || 0;
      const bottom = Number.parseFloat(getComputedStyle(el).bottom) || 0;
      root.style.setProperty('--consent-top', `${Math.round(bottom - dock + el.offsetHeight)}px`);
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(el);
    return () => {
      observer.disconnect();
      root.style.removeProperty('--consent-top');
    };
  }, [card, visible]);
}
