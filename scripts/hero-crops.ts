/**
 * Hero placeholder variants (BRD §3.9, §6.4.1). Desktop 16:9 at 1920 wide; mobile 4:5 at
 * 1080 wide, cropped from the same shot centred on the product cluster. The placeholders are
 * smaller than the final-photo spec, so desktop is upscaled slightly; final photos replace them.
 */
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const out = join(root, 'public', 'images', 'hero');
mkdirSync(out, { recursive: true });

interface Source {
  file: string;
  name: string;
  /** Horizontal centre of the product cluster as a fraction of width, for the mobile crop. */
  clusterX: number;
}

const sources: Source[] = [
  { file: 'hero-set-A-black-b7r-merch.png', name: 'set-a', clusterX: 0.5 },
  { file: 'hero-set-B-blue-tasmeemak.png', name: 'set-b', clusterX: 0.42 },
];

for (const s of sources) {
  const input = join(root, 'resources', 'hero', 'examples', s.file);
  const meta = await sharp(input).metadata();
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;

  // Desktop: crop to 16:9 keeping the bottom (the product cluster sits low), resize to 1920.
  const targetH = Math.round((w * 9) / 16);
  const cropH = Math.min(h, targetH);
  await sharp(input)
    .extract({ left: 0, top: h - cropH, width: w, height: cropH })
    .resize(1920, 1080, { fit: 'cover', position: 'south' })
    .jpeg({ quality: 80, mozjpeg: true })
    .toFile(join(out, `${s.name}-desktop.jpg`));

  // Mobile: 4:5 window centred on the cluster, full height.
  const cropW = Math.min(w, Math.round((h * 4) / 5));
  const left = Math.max(0, Math.min(w - cropW, Math.round(s.clusterX * w - cropW / 2)));
  await sharp(input)
    .extract({ left, top: 0, width: cropW, height: h })
    .resize(1080, 1350, { fit: 'cover' })
    .jpeg({ quality: 80, mozjpeg: true })
    .toFile(join(out, `${s.name}-mobile.jpg`));

  console.log(`hero-crops: ${s.name} desktop 1920x1080, mobile 1080x1350`);
}
