import { APIError, type CollectionBeforeOperationHook } from 'payload';
import { inLanguage } from '@/modules/cms/fields/message';
import { bytesOf } from '@/modules/cms/hooks/blur';

/**
 * An animated upload is refused before anything is encoded (ADR-064): the library accepts
 * WebP, which can be animated, and Payload would read every frame and hand sharp a tall
 * strip of them for each of the twenty renditions. The check runs in `beforeOperation`
 * (`req.file` is on the request before the operation starts) because `beforeValidate` runs
 * after `generateFileData`, once the encodes are spent. A file sharp cannot read passes
 * through: the blur hook logs it and the mime check, not this one, is what refuses a
 * non-image.
 */
const REFUSAL = {
  ar: 'الصور المتحركة غير مقبولة؛ ارفع صورة ثابتة',
  en: 'Animated images are not accepted; upload a still image',
};

/** The frame count of an image buffer; 1 for anything sharp cannot read. */
export async function frameCount(data: Buffer): Promise<number> {
  const sharp = (await import('sharp')).default;
  try {
    return (await sharp(data, { pages: -1 }).metadata()).pages ?? 1;
  } catch {
    return 1;
  }
}

export const refuseAnimated: CollectionBeforeOperationHook = async ({ args, operation, req }) => {
  if (operation !== 'create' && operation !== 'update') return args;
  const file = req.file;
  if (!file) return args;
  const bytes = await bytesOf(file);
  if (bytes && (await frameCount(bytes)) > 1) {
    throw new APIError(inLanguage(req, REFUSAL), 400);
  }
  return args;
};
