import { describe, expect, it } from 'vitest';
import { eventsForClick, isAppHost } from '@/modules/core/analytics/analytics-bridge';

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
