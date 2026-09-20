import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { Product } from '@/content/schema';
import { MockupPicture } from '@/modules/designer/mockup-picture';
import { mockupSourceOf } from '@/modules/designer/mockup';

const SRC = 'https://storage.example/media/tee-essential-white-front-37b6722f.jpg';

describe('<MockupPicture> (ADR-064)', () => {
  it('names exactly the two files the canvas will load, lazily, filling its box', () => {
    const html = renderToString(
      <MockupPicture src={SRC} alt="تيشيرت أساسي" blur="data:image/webp;base64,AA==" />,
    );
    expect(html).toBe(
      '<picture><source type="image/avif" srcSet="https://storage.example/media/tee-essential-white-front-37b6722f-1080.avif"/>' +
        '<img src="https://storage.example/media/tee-essential-white-front-37b6722f-1080.webp" alt="تيشيرت أساسي" ' +
        'style="position:absolute;inset:0;width:100%;height:100%;color:transparent;' +
        'background-image:url(&quot;data:image/webp;base64,AA==&quot;);background-size:cover;' +
        'background-position:50% 50%;background-repeat:no-repeat" loading="lazy" decoding="async" data-mockup=""/></picture>',
    );
    // One candidate per format: no srcset on the img, no sizes anywhere.
    expect(html).not.toContain('srcSet="' + SRC);
    expect(html).not.toContain('sizes=');
  });

  it('shows no background without a placeholder', () => {
    expect(renderToString(<MockupPicture src={SRC} alt="" />)).not.toContain('background');
  });
});

const product = (colors: Array<[string, string]>): Product =>
  ({
    colors: colors.map(([slug, front]) => ({ slug, name: slug, hex: '#fff', images: { front } })),
  }) as unknown as Product;

describe('mockupSourceOf', () => {
  it('is the white front, else the first colour, else nothing', () => {
    expect(
      mockupSourceOf(
        product([
          ['black', '/b.jpg'],
          ['white', '/w.jpg'],
        ]),
      ),
    ).toBe('/w.jpg');
    expect(mockupSourceOf(product([['beige', '/beige.jpg']]))).toBe('/beige.jpg');
    expect(mockupSourceOf(product([]))).toBeUndefined();
  });
});
