import type ReactDom from 'react-dom';
import { renderToString } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Photo } from '@/components/shared/photo';

const preload = vi.hoisted(() => vi.fn());
vi.mock('react-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof ReactDom>()),
  preload,
}));

const SRC = 'https://storage.example/media/tee-essential-white-front-37b6722f.jpg';

/** The `srcset` of the first element matching `tag` in `html`, and its candidate URLs. */
function srcSet(html: string, tag: 'source' | 'img'): { raw: string; urls: string[] } {
  const match = new RegExp(`<${tag}[^>]*\\ssrc[sS]et="([^"]*)"`).exec(html);
  const raw = match?.[1] ?? '';
  return { raw, urls: raw.split(',').map((c) => c.trim().split(' ')[0]!) };
}

describe('<Photo> (ADR-064)', () => {
  beforeEach(() => preload.mockClear());

  it('is a <picture> whose AVIF source and WebP img name the same renditions', () => {
    const html = renderToString(
      <Photo src={SRC} alt="تيشيرت" fill sizes="(min-width: 1024px) 560px, 100vw" />,
    );
    expect(html).toMatch(
      /^<picture><source type="image\/avif" srcSet="[^"]+" sizes="\(min-width: 1024px\) 560px, 100vw"\/><img /,
    );
    const avif = srcSet(html, 'source');
    const webp = srcSet(html, 'img');
    expect(avif.urls.length).toBeGreaterThan(3);
    // Every candidate is a file beside the original, named by the URL rule, and the two
    // formats agree candidate for candidate.
    for (const url of avif.urls)
      expect(url).toMatch(/\/media\/tee-essential-white-front-37b6722f-\d+\.avif$/);
    expect(avif.raw).toBe(webp.raw.replaceAll('.webp', '.avif'));
    // The original is never a candidate.
    expect(html).not.toContain('37b6722f.jpg');
    // next/image's own attributes are on the img: lazy by default, async decoding.
    expect(html).toMatch(/<img [^>]*loading="lazy"/);
    expect(html).toMatch(/<img [^>]*decoding="async"/);
    expect(preload).not.toHaveBeenCalled();
  });

  it('inlines the blur-up placeholder as the background and keeps the box for fill', () => {
    const blur = 'data:image/webp;base64,UklGRgAAAABXRUJQ';
    const html = renderToString(<Photo src={SRC} alt="" fill sizes="100vw" blur={blur} />);
    expect(html).toContain('background-image:url(');
    expect(html).toContain('UklGRgAAAABXRUJQ');
    expect(html).toMatch(/<img [^>]*style="position:absolute;height:100%;width:100%/);
    // Nothing without a placeholder.
    expect(renderToString(<Photo src={SRC} alt="" fill sizes="100vw" />)).not.toContain(
      'background-image',
    );
  });

  it('a fixed-size photo gets 1x and 2x candidates from the ladder', () => {
    const html = renderToString(<Photo src={SRC} alt="" width={112} height={112} />);
    const avif = srcSet(html, 'source');
    expect(avif.raw).toMatch(/-128\.avif 1x, .*-\d+\.avif 2x$/);
    expect(html).toMatch(/<img [^>]*width="112" height="112"/);
  });

  it("preloads the AVIF candidates, typed, with the caller's priority, and loads the img eagerly", () => {
    const html = renderToString(
      <Photo src={SRC} alt="" fill sizes="100vw" preload fetchPriority="high" />,
    );
    expect(preload).toHaveBeenCalledTimes(1);
    const [href, options] = preload.mock.calls[0]!;
    expect(href).toMatch(/-\d+\.avif$/);
    expect(options).toMatchObject({
      as: 'image',
      type: 'image/avif',
      imageSizes: '100vw',
      fetchPriority: 'high',
    });
    expect(options.imageSrcSet).toBe(srcSet(html, 'source').raw);
    expect(html).toMatch(/<img [^>]*loading="eager"/);
    expect(html).toMatch(/<img [^>]*fetchPriority="high"/);
    // A preloaded card that is not the LCP keeps the default priority.
    preload.mockClear();
    renderToString(<Photo src={SRC} alt="" fill sizes="100vw" preload />);
    expect(preload.mock.calls[0]![1]).not.toHaveProperty('fetchPriority', 'high');
  });
});
