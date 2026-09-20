/**
 * The photo renditions (ADR-064): every media upload is encoded once, on upload, into one
 * file per rung of this ladder and per format, uploaded beside the original under a name the
 * URL rule below derives, and served from the storage CDN's edge. The image optimizer
 * (`/_next/image`) no longer sits between the browser and a photo: CranL's edge never caches
 * its answers (measured 2026-09-20: 0.15 to 0.45 s warm, 1.5 to 3.2 s after each deploy,
 * against 0.10 s for a file from the edge).
 *
 * Pure data and arithmetic: the media collection, `next.config.ts`, the loaders and the
 * scripts read one definition.
 */
import type { ImageLoaderProps } from 'next/image';
import type { ImageSize } from 'payload';
// A sibling path, not the `@/` alias: `next.config.ts` imports this module, and Next's config
// transpiler rewrites an alias against the project root, which resolves from `src/lib/` to
// nothing (`tests/next-config-imports.test.ts` guards every module the config reaches).
import { PHOTO_QUALITY } from './photo';

/** The candidate widths `next/image` may ask for: `DEVICE_SIZES` and `IMAGE_SIZES`, merged. */
export const RENDITION_WIDTHS = [128, 384, 640, 828, 1080, 1200, 1536, 1920, 2560, 3840] as const;
export type RenditionWidth = (typeof RENDITION_WIDTHS)[number];

/** The widths of a `sizes`-driven photo (`next.config.ts` `images.deviceSizes`). */
export const DEVICE_SIZES = [640, 828, 1080, 1200, 1536, 1920, 2560, 3840] as const;
/** The widths of a fixed-size image (`images.imageSizes`): thumbs and avatars. */
export const IMAGE_SIZES = [128, 384] as const;

export const RENDITION_FORMATS = ['avif', 'webp'] as const;
export type RenditionFormat = (typeof RENDITION_FORMATS)[number];

/**
 * The encode the site shipped through the optimizer, now done once on upload: Next hands
 * sharp `quality * 50 / 80` for AVIF with `effort: 3` (its `image-optimizer.js`, a ratio it
 * verified with dssim and ssimulacra2) and the quality as is for WebP. At sharp's literal
 * `quality: 90` the same AVIF is three times the bytes and four times the time (the CTO's
 * measurement, 2026-09-20: 151.9 KB in 1310 ms against 51.6 KB in 291 ms for the 1920 hero).
 */
export const RENDITION_ENCODE = {
  avif: { quality: Math.round((PHOTO_QUALITY * 50) / 80), effort: 3 },
  webp: { quality: PHOTO_QUALITY },
} as const;

/** The Payload size name of a rung: `avif1080`. */
export const renditionName = (format: RenditionFormat, width: RenditionWidth): string =>
  `${format}${width}`;

/** Every size name, in ladder order: what a complete document's `sizes` holds. */
export const RENDITION_NAMES: readonly string[] = RENDITION_FORMATS.flatMap((format) =>
  RENDITION_WIDTHS.map((width) => renditionName(format, width)),
);

/** A media document's `sizes` as Payload reads it: a group per size, its `filename` null until generated. */
type StoredSizes = Record<string, { filename?: string | null } | null | undefined>;
/** What the checks read: a media document, or the raw `doc` an admin thumbnail is handed. */
type WithSizes = { sizes?: unknown };

function storedSizes(doc: WithSizes): StoredSizes {
  const sizes = doc.sizes;
  return sizes && typeof sizes === 'object' ? (sizes as StoredSizes) : {};
}

/** Whether the document holds the named rendition (a file was generated for it). */
export function hasRendition(doc: WithSizes, name: string): boolean {
  return Boolean(storedSizes(doc)[name]?.filename);
}

/** The size names the document lacks; empty for a complete one (the backfill's test). */
export function missingRenditions(doc: WithSizes): string[] {
  return RENDITION_NAMES.filter((name) => !hasRendition(doc, name));
}

/**
 * The media collection's `upload.imageSizes`: one entry per rung and format, width only (the
 * aspect is the photo's), never enlarged (a 1000 px photo's 1920 file is the photo at 1000,
 * so every name exists for every upload), named from the configured width (Payload hands
 * the function the output's width, the photo's own under a rung it does not reach), and out
 * of the list view's columns, filters and grouping (twenty sizes would be 120 columns).
 */
export function mediaImageSizes(): ImageSize[] {
  return RENDITION_FORMATS.flatMap((format) =>
    RENDITION_WIDTHS.map((width): ImageSize => ({
      name: renditionName(format, width),
      width,
      withoutEnlargement: true,
      formatOptions: { format, options: RENDITION_ENCODE[format] },
      generateImageName: ({ originalName }) => `${originalName}-${width}.${format}`,
      admin: { disableGroupBy: true, disableListColumn: true, disableListFilter: true },
    })),
  );
}

/** The smallest rung at or above `width`; the largest rung past the top. */
export function snapWidth(width: number): RenditionWidth {
  return RENDITION_WIDTHS.find((w) => w >= width) ?? RENDITION_WIDTHS[RENDITION_WIDTHS.length - 1]!;
}

/**
 * The rendition's URL for a media URL: the file's extension replaced by `-{width}.{format}`,
 * `width` snapped to the ladder. Payload names a size `{stem}-{width}.{format}` from the
 * sanitized stem the document's `url` carries, so the two agree for a local file
 * (`/api/payload/media/file/x.jpg`), an S3 object (`https://host/media/x.jpg`) and CI's
 * path-style bucket (`http://localhost:9000/b7r-media/media/x.jpg`).
 */
export function renditionUrl(src: string, width: number, format: RenditionFormat): string {
  const dot = src.lastIndexOf('.');
  const slash = src.lastIndexOf('/');
  const stem = dot > slash ? src.slice(0, dot) : src;
  return `${stem}-${snapWidth(width)}.${format}`;
}

/** `next/image` loaders, one per format: the candidate list is the ladder, one file each. */
export const avifLoader = ({ src, width }: ImageLoaderProps): string =>
  renditionUrl(src, width, 'avif');
export const webpLoader = ({ src, width }: ImageLoaderProps): string =>
  renditionUrl(src, width, 'webp');
