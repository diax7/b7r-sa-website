import { describe, expect, it } from 'vitest';
import { PHOTO_QUALITY } from '@/lib/photo';
import {
  avifLoader,
  DEVICE_SIZES,
  hasRendition,
  IMAGE_SIZES,
  mediaImageSizes,
  missingRenditions,
  RENDITION_ENCODE,
  RENDITION_NAMES,
  RENDITION_WIDTHS,
  renditionName,
  renditionUrl,
  snapWidth,
  webpLoader,
} from '@/lib/renditions';

describe('the ladder (ADR-064)', () => {
  it("is next/image's candidate list, one rung per file", () => {
    expect([...DEVICE_SIZES, ...IMAGE_SIZES].toSorted((a, b) => a - b)).toEqual([
      ...RENDITION_WIDTHS,
    ]);
    expect(RENDITION_NAMES).toHaveLength(20);
    expect(RENDITION_NAMES[0]).toBe('avif128');
    expect(RENDITION_NAMES[19]).toBe('webp3840');
  });

  it("encodes the way Next's optimizer did: AVIF at q * 50 / 80 with effort 3, WebP as is", () => {
    expect(RENDITION_ENCODE).toEqual({
      avif: { quality: 56, effort: 3 },
      webp: { quality: PHOTO_QUALITY },
    });
  });

  it('snaps a width up to the next rung, and to the top past it', () => {
    expect(snapWidth(1)).toBe(128);
    expect(snapWidth(128)).toBe(128);
    expect(snapWidth(129)).toBe(384);
    expect(snapWidth(1000)).toBe(1080);
    expect(snapWidth(3840)).toBe(3840);
    expect(snapWidth(6000)).toBe(3840);
  });
});

describe('renditionUrl', () => {
  it('replaces the extension of a local, an S3 and a path-style bucket URL', () => {
    expect(renditionUrl('/api/payload/media/file/x.jpg', 1080, 'avif')).toBe(
      '/api/payload/media/file/x-1080.avif',
    );
    expect(renditionUrl('https://storage.example/media/tee-a1b2c3d4.jpg', 1000, 'webp')).toBe(
      'https://storage.example/media/tee-a1b2c3d4-1080.webp',
    );
    expect(renditionUrl('http://localhost:9000/b7r-media/media/x.png', 5000, 'avif')).toBe(
      'http://localhost:9000/b7r-media/media/x-3840.avif',
    );
  });

  it('touches the file name only, never a dot in a folder', () => {
    expect(renditionUrl('https://cdn.example.com/media.v2/x', 640, 'webp')).toBe(
      'https://cdn.example.com/media.v2/x-640.webp',
    );
  });

  it('is what the two loaders return', () => {
    expect(avifLoader({ src: '/m/a.jpg', width: 828 })).toBe('/m/a-828.avif');
    expect(webpLoader({ src: '/m/a.jpg', width: 828, quality: 90 })).toBe('/m/a-828.webp');
  });
});

describe('mediaImageSizes: the collection config', () => {
  const sizes = mediaImageSizes();

  it('is one width-only size per rung and format, never enlarged, out of the list view', () => {
    expect(sizes.map((s) => s.name)).toEqual([...RENDITION_NAMES]);
    for (const size of sizes) {
      expect(size.height).toBeUndefined();
      expect(size.withoutEnlargement).toBe(true);
      expect(size.admin).toEqual({
        disableGroupBy: true,
        disableListColumn: true,
        disableListFilter: true,
      });
    }
    expect(sizes.find((s) => s.name === renditionName('avif', 1920))).toMatchObject({
      width: 1920,
      formatOptions: { format: 'avif', options: RENDITION_ENCODE.avif },
    });
    expect(sizes.find((s) => s.name === 'webp384')?.formatOptions).toEqual({
      format: 'webp',
      options: RENDITION_ENCODE.webp,
    });
  });

  it('names a file from the configured rung whatever width the photo reached', () => {
    const size = sizes.find((s) => s.name === 'avif1920')!;
    const name = (width: number) =>
      size.generateImageName!({
        extension: 'avif',
        height: Math.round(width * 0.6),
        originalName: 'hoodie-black-front-ec087492',
        sizeName: size.name,
        width,
      });
    // A 3000 px photo reaches the rung; a 1000 px one is stored at 1000 under the same name.
    expect(name(1920)).toBe('hoodie-black-front-ec087492-1920.avif');
    expect(name(1000)).toBe('hoodie-black-front-ec087492-1920.avif');
    // The name is the URL rule's, so the loader finds the file.
    expect(avifLoader({ src: '/media/hoodie-black-front-ec087492.jpg', width: 1920 })).toBe(
      `/media/${name(1000)}`,
    );
  });
});

describe('what a document holds', () => {
  it('reads a generated size by its filename, and lists the missing ones', () => {
    const complete = {
      sizes: Object.fromEntries(RENDITION_NAMES.map((n) => [n, { filename: `x-${n}` }])),
    };
    expect(hasRendition(complete, 'avif1080')).toBe(true);
    expect(missingRenditions(complete)).toEqual([]);
    // Payload reads a group of nulls for a size not generated yet (the columns exist).
    const partial = { sizes: { avif128: { filename: 'x-128.avif' }, webp128: { filename: null } } };
    expect(hasRendition(partial, 'webp128')).toBe(false);
    expect(missingRenditions(partial)).toHaveLength(19);
    expect(missingRenditions({})).toEqual([...RENDITION_NAMES]);
    expect(missingRenditions({ sizes: null })).toHaveLength(20);
  });
});
