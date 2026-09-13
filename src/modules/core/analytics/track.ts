/**
 * Event helper (BRD 6.16). Phase 1a ships the typed sink only; Phase 1b wires Umami (always)
 * and GA4 (after consent). Components call `track()` today so no call sites change later.
 */
export type TrackEvent =
  | {
      name: 'cta_click';
      props: { location: 'header' | 'hero' | 'designer' | 'ribbon' | 'menu' | 'product' };
    }
  | { name: 'whatsapp_click'; props: { location: 'widget' | 'menu' | 'contact' | 'footer' } }
  | { name: 'outbound_app_click'; props: { href: string } }
  | { name: 'designer_product_change'; props: { product: string } }
  | { name: 'designer_upload'; props: { type: string; bytes: number } }
  | { name: 'calculator_change'; props: { product: string; sell: number; daily: number } }
  | { name: 'product_view'; props: { slug: string } }
  | { name: 'faq_open'; props: { question: string } }
  | { name: 'newsletter_submit'; props: Record<string, never> }
  | { name: 'contact_submit'; props: { inquiry: string } };

type Sink = (event: TrackEvent) => void;

const sinks: Sink[] = [];
/** Events fired before any sink exists (mount-time `product_view`) wait for the first one. */
const pending: TrackEvent[] = [];
const PENDING_MAX = 50;

/** Registered by the analytics bridge; the first sink receives everything fired before it. */
export function registerSink(sink: Sink): () => void {
  sinks.push(sink);
  if (pending.length > 0) {
    const queued = pending.splice(0, pending.length);
    for (const event of queued) sink(event);
  }
  return () => {
    const i = sinks.indexOf(sink);
    if (i >= 0) sinks.splice(i, 1);
  };
}

export function trackEvent(event: TrackEvent): void {
  if (sinks.length === 0) {
    if (pending.length < PENDING_MAX) pending.push(event);
    return;
  }
  for (const sink of sinks) sink(event);
}

export function track<E extends TrackEvent>(name: E['name'], props: E['props']): void {
  trackEvent({ name, props } as TrackEvent);
}

export const CTA_LOCATIONS = ['header', 'hero', 'designer', 'ribbon', 'menu', 'product'] as const;
export const WHATSAPP_LOCATIONS = ['widget', 'menu', 'contact', 'footer'] as const;
