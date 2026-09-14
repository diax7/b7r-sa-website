/**
 * Hero placeholder variants (BRD §3.9, §6.4.1). Desktop 16:9 at 1920 wide; mobile 4:5 at
 * 1080 wide, cropped from the same shot centred on the product cluster. The placeholders are
 * smaller than the final-photo spec, so desktop is upscaled slightly; final photos replace them.
 *
 * The English document mirrors the layout (the copy sits at the left, ADR-044), so its
 * placeholders are the same shots flipped (`public/images/hero-en/`): the cluster moves to
 * the right and the calm area to the left, under the copy. A flipped shot mirrors the printed
 * logo too; Dhia's English photographs replace these in the admin (RUNBOOK).
 */
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const root = process.cwd();

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

async function crops(input: string, name: string, clusterX: number, out: string, flip: boolean) {
  const shot = () => (flip ? sharp(input).flop() : sharp(input));
  const meta = await sharp(input).metadata();
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;

  // Desktop: crop to 16:9 keeping the bottom (the product cluster sits low), resize to 1920.
  const targetH = Math.round((w * 9) / 16);
  const cropH = Math.min(h, targetH);
  await shot()
    .extract({ left: 0, top: h - cropH, width: w, height: cropH })
    .resize(1920, 1080, { fit: 'cover', position: 'south' })
    .jpeg({ quality: 80, mozjpeg: true })
    .toFile(join(out, `${name}-desktop.jpg`));

  // Mobile: 4:5 window centred on the cluster, full height.
  const cropW = Math.min(w, Math.round((h * 4) / 5));
  const centre = flip ? 1 - clusterX : clusterX;
  const left = Math.max(0, Math.min(w - cropW, Math.round(centre * w - cropW / 2)));
  await shot()
    .extract({ left, top: 0, width: cropW, height: h })
    .resize(1080, 1350, { fit: 'cover' })
    .jpeg({ quality: 80, mozjpeg: true })
    .toFile(join(out, `${name}-mobile.jpg`));
}

for (const [folder, flip] of [
  ['hero', false],
  ['hero-en', true],
] as const) {
  const out = join(root, 'public', 'images', folder);
  mkdirSync(out, { recursive: true });
  for (const s of sources) {
    const input = join(root, 'resources', 'hero', 'examples', s.file);
    await crops(input, s.name, s.clusterX, out, flip);
    console.log(`hero-crops: ${folder}/${s.name} desktop 1920x1080, mobile 1080x1350`);
  }
}
