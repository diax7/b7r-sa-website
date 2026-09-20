import { readFile } from 'node:fs/promises';
import type { CollectionBeforeChangeHook, PayloadRequest } from 'payload';
import { BLUR } from '@/lib/photo';

/**
 * The blur-up placeholder of a media document (ADR-029, amended 2026-09-19): a `BLUR.width`
 * px wide WebP of the upload as a data URL, about 300 bytes, stored in the hidden `blur`
 * field and inlined by the photo components as `next/image`'s `blurDataURL`, so a photo's
 * box shows its colours before the AVIF arrives. Computed once, on an upload or a
 * replacement, from `req.file` as it stands in `beforeChange`: the file Payload is about to
 * store, a crop made in the admin already applied (`generateFileData` runs before the hooks
 * and puts the cropped file back on the request), the focal point not (it moves no pixels
 * of the stored file). A save that changes only the alt text keeps the stored value. Never
 * refuses a save: a file sharp cannot read (or a non-raster file) leaves the field empty and
 * logs why.
 */
export const BLUR_FIELD = 'blur';

const RASTER = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

/** The placeholder for a raster image buffer; null for anything else. */
export async function blurDataUrl(data: Buffer, mimetype: string): Promise<string | null> {
  if (!RASTER.has(mimetype)) return null;
  const sharp = (await import('sharp')).default;
  const out = await sharp(data)
    .rotate()
    .resize({ width: BLUR.width })
    .webp({ quality: BLUR.quality })
    .toBuffer();
  return `data:image/webp;base64,${out.toString('base64')}`;
}

/** The bytes of the request's file: in memory, or on disk when Payload buffers to a temp file. */
export async function bytesOf(file: NonNullable<PayloadRequest['file']>): Promise<Buffer | null> {
  if (file.data?.length) return file.data;
  if (file.tempFilePath) return readFile(file.tempFilePath);
  return null;
}

export const stampBlur: CollectionBeforeChangeHook = async ({ data, req }) => {
  const file = req.file;
  if (!file) return data;
  try {
    const bytes = await bytesOf(file);
    return { ...data, [BLUR_FIELD]: bytes ? await blurDataUrl(bytes, file.mimetype) : null };
  } catch (error) {
    req.payload.logger.error({ msg: `media: no blur placeholder for ${file.name}`, error });
    return { ...data, [BLUR_FIELD]: null };
  }
};
