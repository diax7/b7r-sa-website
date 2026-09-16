'use client';

import { useEffect } from 'react';

/**
 * The first-page beacon (ADR-048): one POST when a visitor lands from another site or from
 * nowhere, with the page, the referrer and `utm_source`; nothing on a move between our pages
 * (a same-origin referrer), nothing on a reload or a back/forward (the navigation entry says
 * so), nothing stored in the browser. A bot that runs scripts is dropped by the server.
 */
export function LandingBeacon() {
  useEffect(() => {
    const entry = performance.getEntriesByType('navigation')[0] as
      | PerformanceNavigationTiming
      | undefined;
    if (entry && entry.type !== 'navigate') return;
    const referrer = document.referrer;
    if (referrer) {
      try {
        if (new URL(referrer).origin === location.origin) return;
      } catch {
        // A malformed referrer is sent as it is; the server bounds it.
      }
    }
    const utmSource = new URLSearchParams(location.search).get('utm_source') ?? '';
    void fetch('/api/traffic/landing', {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: location.pathname, referrer, utmSource }),
    }).catch(() => undefined);
  }, []);
  return null;
}
