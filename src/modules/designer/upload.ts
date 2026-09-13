import {
  ACCEPTED_TYPES,
  type Design,
  MAX_UPLOAD_BYTES,
} from '@/modules/designer/use-designer-state';

const EXTENSIONS = /\.(png|jpe?g|svg|webp)$/i;

export function isAccepted(file: File): boolean {
  return (
    (ACCEPTED_TYPES.includes(file.type) || EXTENSIONS.test(file.name)) &&
    file.size <= MAX_UPLOAD_BYTES
  );
}

/** Reads the intrinsic size; SVGs without width/height fall back to their viewBox, then 600 × 300. */
async function measure(file: File, url: string): Promise<{ width: number; height: number }> {
  const img = new Image();
  const loaded = new Promise<void>((resolve, reject) => {
    img.addEventListener('load', () => resolve(), { once: true });
    img.addEventListener('error', () => reject(new Error('decode failed')), { once: true });
  });
  img.src = url;
  await loaded;
  if (img.naturalWidth > 0 && img.naturalHeight > 0)
    return { width: img.naturalWidth, height: img.naturalHeight };
  if (file.type === 'image/svg+xml') {
    const text = await file.text();
    const m = /viewBox=["']\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)/.exec(text);
    if (m) return { width: Number(m[1]), height: Number(m[2]) };
  }
  return { width: 600, height: 300 };
}

/**
 * Turns a chosen file into a design (BRD 6.4.3). Files stay in memory as object URLs and
 * never leave the browser (the island revokes a replaced URL). `null` means the file was
 * refused (type or size) or could not be decoded.
 */
export async function acceptFile(file: File): Promise<Design | null> {
  if (!isAccepted(file)) return null;
  const url = URL.createObjectURL(file);
  try {
    const size = await measure(file, url);
    return { url, ...size };
  } catch {
    URL.revokeObjectURL(url);
    return null;
  }
}
