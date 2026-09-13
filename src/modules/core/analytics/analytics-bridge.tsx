'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { readConsent, type Consent } from '@/lib/consent';
import {
  CTA_LOCATIONS,
  registerSink,
  trackEvent,
  WHATSAPP_LOCATIONS,
  type TrackEvent,
} from '@/modules/core/analytics/track';

declare global {
  interface Window {
    umami?: { track: (name: string, data?: Record<string, unknown>) => void };
  }
}

/** `gtag` is defined by the inline consent-default script in the layout (when GA is set). */
function gtag(...args: unknown[]): void {
  const fn = (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag;
  fn?.(...args);
}

// Loaded only once consent is granted, so the GA loader never sits in the first-paint JS.
const GoogleAnalytics = dynamic(
  () => import('@next/third-parties/google').then((m) => m.GoogleAnalytics),
  {
    ssr: false,
  },
);

const CONSENT_EVENT = 'b7r:consent';

/** The consent bar announces a decision; the bridge owns everything that follows. */
export function announceConsent(value: Consent): void {
  window.dispatchEvent(new CustomEvent<Consent>(CONSENT_EVENT, { detail: value }));
}

export function isAppHost(hostname: string): boolean {
  return hostname === 'b7r.app' || hostname.endsWith('.b7r.app');
}

const isCta = (l: string): l is (typeof CTA_LOCATIONS)[number] =>
  (CTA_LOCATIONS as readonly string[]).includes(l);
const isWa = (l: string): l is (typeof WHATSAPP_LOCATIONS)[number] =>
  (WHATSAPP_LOCATIONS as readonly string[]).includes(l);

/** Turns a click on an element carrying `data-track` (or a link to the app) into events. */
export function eventsForClick(target: Element | null): TrackEvent[] {
  const el = target?.closest<HTMLElement>('[data-track], a[href]');
  if (!el) return [];
  const events: TrackEvent[] = [];
  const name = el.dataset['track'];
  const location = el.dataset['location'] ?? '';
  if (name === 'cta_click' && isCta(location)) events.push({ name, props: { location } });
  if (name === 'whatsapp_click' && isWa(location)) events.push({ name, props: { location } });
  if (el instanceof HTMLAnchorElement) {
    try {
      const url = new URL(el.href, window.location.href);
      if (isAppHost(url.hostname))
        events.push({ name: 'outbound_app_click', props: { href: url.pathname } });
    } catch {
      // Non-URL hrefs (mailto:, tel:) are not outbound app clicks.
    }
  }
  return events;
}

interface AnalyticsBridgeProps {
  gaId: string | undefined;
}

/**
 * Wires `track()` to the analytics vendors (BRD 6.16): Umami always, GA4 only after consent.
 * Owns the granted-on-reload path (consent update + GA mount) and delegated click tracking
 * for server-rendered links (`data-track` / `data-location`, outbound b7r.app links).
 */
export function AnalyticsBridge({ gaId }: AnalyticsBridgeProps) {
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    const apply = (value: Consent | null) => {
      if (value === 'granted') {
        gtag('consent', 'update', { analytics_storage: 'granted' });
        setGranted(true);
      } else {
        setGranted(false);
      }
    };
    // oxlint-disable-next-line react/set-state-in-effect -- the cookie is only readable after hydration
    apply(readConsent());
    const onConsent = (e: Event) => apply((e as CustomEvent<Consent>).detail);
    window.addEventListener(CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(CONSENT_EVENT, onConsent);
  }, []);

  useEffect(() => {
    const unregisterUmami = registerSink((event) => {
      window.umami?.track(event.name, event.props);
    });
    const unregisterGa = registerSink((event) => {
      if (granted && gaId) gtag('event', event.name, event.props);
    });
    return () => {
      unregisterUmami();
      unregisterGa();
    };
  }, [granted, gaId]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      for (const event of eventsForClick(e.target as Element | null)) trackEvent(event);
    };
    document.addEventListener('click', onClick, { capture: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, []);

  return granted && gaId ? <GoogleAnalytics gaId={gaId} /> : null;
}
