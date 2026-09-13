import { describe, expect, it, vi } from 'vitest';
import { eventsForClick, isAppHost, sendToUmami } from '@/modules/core/analytics/analytics-bridge';
import { registerSink, track } from '@/modules/core/analytics/track';

function el(html: string): Element {
  const root = document.createElement('div');
  root.innerHTML = html;
  return root.firstElementChild!;
}

describe('analytics bridge click mapping (BRD 6.16)', () => {
  it('recognises app hosts exactly', () => {
    expect(isAppHost('b7r.app')).toBe(true);
    expect(isAppHost('www.b7r.app')).toBe(true);
    expect(isAppHost('b7r.sa')).toBe(false);
    expect(isAppHost('notb7r.app')).toBe(false);
  });

  it('maps a data-track link to the app into two events', () => {
    const a = el(
      '<a href="https://b7r.app/register?utm_campaign=hero" data-track="cta_click" data-location="hero">x</a>',
    );
    expect(eventsForClick(a)).toEqual([
      { name: 'cta_click', props: { location: 'hero' } },
      { name: 'outbound_app_click', props: { href: '/register' } },
    ]);
  });

  it('ignores unknown locations and non-http hrefs', () => {
    expect(
      eventsForClick(
        el('<a href="mailto:x@y.z" data-track="cta_click" data-location="nowhere">x</a>'),
      ),
    ).toEqual([]);
    expect(
      eventsForClick(el('<button data-track="whatsapp_click" data-location="widget">x</button>')),
    ).toEqual([{ name: 'whatsapp_click', props: { location: 'widget' } }]);
    expect(eventsForClick(null)).toEqual([]);
  });

  it('walks up from a child of the tracked element', () => {
    const a = el(
      '<a href="/products" data-track="cta_click" data-location="ribbon"><span>x</span></a>',
    );
    expect(eventsForClick(a.firstElementChild)).toEqual([
      { name: 'cta_click', props: { location: 'ribbon' } },
    ]);
  });
});

describe('Umami queue (events fired before the script loads)', () => {
  it('holds events until window.umami exists, then flushes them in order', async () => {
    vi.useFakeTimers();
    const w = window as { umami?: { track: (n: string, d?: unknown) => void } };
    delete w.umami;
    sendToUmami({ name: 'product_view', props: { slug: 'hoodie' } });
    sendToUmami({ name: 'newsletter_submit', props: {} });
    const umamiTrack = vi.fn();
    vi.advanceTimersByTime(600);
    expect(umamiTrack).not.toHaveBeenCalled();
    w.umami = { track: umamiTrack };
    vi.advanceTimersByTime(300);
    expect(umamiTrack.mock.calls).toEqual([
      ['product_view', { slug: 'hoodie' }],
      ['newsletter_submit', {}],
    ]);
    // Once the script is there, new events go straight through.
    sendToUmami({ name: 'faq_open', props: { question: 'q' } });
    expect(umamiTrack).toHaveBeenCalledTimes(3);
    vi.useRealTimers();
    delete w.umami;
  });
});

describe('track() before any sink exists', () => {
  it('replays mount-time events to the first sink, once', () => {
    track('product_view', { slug: 'tote-bag' });
    const first = vi.fn();
    const unregister = registerSink(first);
    expect(first).toHaveBeenCalledWith({ name: 'product_view', props: { slug: 'tote-bag' } });
    const second = vi.fn();
    const unregisterSecond = registerSink(second);
    expect(second).not.toHaveBeenCalled();
    unregister();
    unregisterSecond();
  });
});
