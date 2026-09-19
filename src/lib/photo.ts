/**
 * The photo pipeline's numbers (ADR-029, amended 2026-09-19): one lossy encode before the
 * image optimizer. The files under `public/images` and in the media library are written once
 * at the source's own resolution, JPEG q92 with full-resolution chroma (mozjpeg); `next/image`
 * then encodes what the browser asked for at quality 90 (`PHOTO_QUALITY`). A second lossy
 * pass at q80 over a q82 file was what made every photo soft (docs/audits/2026-09-19-photo-quality.md).
 * Pure data and arithmetic, so the scripts and the tests share one definition.
 */
import type { Region } from 'sharp';

/** The JPEG the assets scripts write: sharp's `jpeg()` options. */
export const PHOTO_JPEG = { quality: 92, mozjpeg: true, chromaSubsampling: '4:4:4' } as const;

/**
 * The `quality` the photo components hand `next/image` (one value serves AVIF and WebP);
 * logos, icons and badges keep Next's default. Must be in `images.qualities`.
 */
export const PHOTO_QUALITY = 90;

/**
 * No photo is written wider than the largest `deviceSizes` entry: the optimizer never serves
 * more, and a 6000 px export would otherwise land in the repository and the bucket at full
 * size. A 3000 px photograph stays at 3000.
 */
export const PHOTO_MAX_WIDTH = 3840;

/** The blur-up placeholder: a 24 px wide WebP at q50, about 300 bytes as a data URL. */
export const BLUR = { width: 24, quality: 50 } as const;

export interface Box {
  width: number;
  height: number;
}

/**
 * The largest box of `aspect` (width over height) that fits a source, at the source's own
 * resolution, so a crop never scales up. A source wider than the aspect keeps its height; a
 * taller one keeps its width. Capped at `PHOTO_MAX_WIDTH` (the height follows).
 */
export function largestBox(source: Box, aspect: number): Box {
  const wider = source.width / source.height > aspect;
  let width = wider ? Math.round(source.height * aspect) : source.width;
  let height = wider ? source.height : Math.round(source.width / aspect);
  if (width > PHOTO_MAX_WIDTH) {
    width = PHOTO_MAX_WIDTH;
    height = Math.round(width / aspect);
  }
  return { width, height };
}

/** The largest centred square of a source: a product photo (BRD 6.6, 1:1). */
export function squareBox(source: Box): Box {
  return largestBox(source, 1);
}

/**
 * The hero's mobile window (BRD 6.4.1): a 4:5 crop of the full height, centred on the
 * product cluster at `clusterX` (a fraction of the width), clamped to the source.
 */
export function heroMobileWindow(source: Box, clusterX: number): Region {
  const width = Math.min(source.width, Math.round((source.height * 4) / 5));
  const left = Math.max(
    0,
    Math.min(source.width - width, Math.round(clusterX * source.width - width / 2)),
  );
  return { left, top: 0, width, height: source.height };
}
