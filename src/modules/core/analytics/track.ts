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
  | { name: 'designer_sample'; props: Record<string, never> }
  | { name: 'calculator_change'; props: { product: string; sell: number; daily: number } }
  | { name: 'video_play'; props: Record<string, never> }
  | { name: 'product_view'; props: { slug: string } }
  | { name: 'faq_open'; props: { question: string } }
  | { name: 'newsletter_submit'; props: Record<string, never> }
  | { name: 'contact_submit'; props: { inquiry: string } };

type Sink = (event: TrackEvent) => void;

const sinks: Sink[] = [];

/** Registered by the analytics island in Phase 1b. */
export function registerSink(sink: Sink): () => void {
  sinks.push(sink);
  return () => {
    const i = sinks.indexOf(sink);
    if (i >= 0) sinks.splice(i, 1);
  };
}

export function track<E extends TrackEvent>(name: E['name'], props: E['props']): void {
  const event = { name, props } as TrackEvent;
  for (const sink of sinks) sink(event);
}
