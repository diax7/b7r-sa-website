import { describe, expect, it } from 'vitest';
import {
  BLUR,
  heroMobileWindow,
  largestBox,
  PHOTO_JPEG,
  PHOTO_MAX_WIDTH,
  PHOTO_QUALITY,
  squareBox,
} from '@/lib/photo';

/** The pipeline's numbers are data (ADR-029, amended 2026-09-19): one lossy encode, then q90. */
describe('the photo encode (ADR-029)', () => {
  it('writes JPEG q92 with full chroma through mozjpeg, and the components ask for 90', () => {
    expect(PHOTO_JPEG).toEqual({ quality: 92, mozjpeg: true, chromaSubsampling: '4:4:4' });
    expect(PHOTO_QUALITY).toBe(90);
    expect(PHOTO_MAX_WIDTH).toBe(3840);
    expect(BLUR).toEqual({ width: 24, quality: 50 });
  });
});

describe('largestBox: a crop at the source resolution, never an upscale', () => {
  it('keeps the height of a source wider than the aspect, the width of a taller one', () => {
    // The set A placeholder (1586x992) as a 16:9 desktop crop: 1586 wide, 892 tall.
    expect(largestBox({ width: 1586, height: 992 }, 16 / 9)).toEqual({ width: 1586, height: 892 });
    // A 2000x2306 portrait as a 16:9 cover keeps its width.
    expect(largestBox({ width: 2000, height: 2306 }, 16 / 9)).toEqual({
      width: 2000,
      height: 1125,
    });
    // A 1024x574 source (wider than 16:9 by a hair) keeps its height instead of growing.
    expect(largestBox({ width: 1024, height: 574 }, 16 / 9)).toEqual({ width: 1020, height: 574 });
  });

  it('never returns a box larger than the source', () => {
    for (const [w, h, aspect] of [
      [1586, 992, 16 / 9],
      [794, 992, 4 / 5],
      [2000, 2000, 21 / 9],
      [3000, 1500, 16 / 9],
      [640, 800, 1],
    ] as const) {
      const box = largestBox({ width: w, height: h }, aspect);
      expect(box.width).toBeLessThanOrEqual(w);
      expect(box.height).toBeLessThanOrEqual(h);
      expect(Math.abs(box.width / box.height - aspect)).toBeLessThan(0.01);
    }
  });

  it('caps the width at the largest device size', () => {
    expect(largestBox({ width: 6000, height: 4000 }, 16 / 9)).toEqual({
      width: 3840,
      height: 2160,
    });
  });

  it('squareBox is the largest centred square', () => {
    expect(squareBox({ width: 1000, height: 1000 })).toEqual({ width: 1000, height: 1000 });
    expect(squareBox({ width: 2400, height: 2000 })).toEqual({ width: 2000, height: 2000 });
  });
});

describe('heroMobileWindow: a 4:5 window over the cluster, clamped to the shot', () => {
  it('centres on the cluster and keeps the full height', () => {
    expect(heroMobileWindow({ width: 1586, height: 992 }, 0.5)).toEqual({
      left: 396,
      top: 0,
      width: 794,
      height: 992,
    });
  });

  it('clamps at the edges', () => {
    expect(heroMobileWindow({ width: 1586, height: 992 }, 0.05).left).toBe(0);
    expect(heroMobileWindow({ width: 1586, height: 992 }, 0.95).left).toBe(1586 - 794);
  });

  it('takes the whole width of a portrait source', () => {
    expect(heroMobileWindow({ width: 600, height: 1200 }, 0.5)).toEqual({
      left: 0,
      top: 0,
      width: 600,
      height: 1200,
    });
  });
});
