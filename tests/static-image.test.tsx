import type ReactDom from 'react-dom';
import { renderToString } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StaticImage } from '@/components/shared/static-image';

const preload = vi.hoisted(() => vi.fn());
vi.mock('react-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof ReactDom>()),
  preload,
}));

describe('<StaticImage> (ADR-064)', () => {
  beforeEach(() => preload.mockClear());

  it('is a plain lazy img of the file as it is: no optimizer, no candidates', () => {
    const html = renderToString(
      <StaticImage
        src="/images/badges/visa.png"
        alt="Visa"
        width={44}
        height={28}
        className="h-5"
      />,
    );
    expect(html).toBe(
      '<img src="/images/badges/visa.png" alt="Visa" width="44" height="28" loading="lazy" decoding="async" class="h-5"/>',
    );
    expect(preload).not.toHaveBeenCalled();
  });

  it('preloads the header logo at high priority and loads it eagerly', () => {
    const html = renderToString(
      <StaticImage
        src="/images/badges/misk-foundation-logo-128.png"
        alt=""
        width={198}
        height={72}
        preload
      />,
    );
    expect(html).toContain('loading="eager"');
    // The priority rides on the preload, never on the img: a page has one high-priority
    // image, its LCP photo.
    expect(html).not.toContain('fetchPriority');
    expect(preload).toHaveBeenCalledWith('/images/badges/misk-foundation-logo-128.png', {
      as: 'image',
      fetchPriority: 'high',
    });
  });
});
