/**
 * Hero placeholder variants (BRD §3.9, §6.4.1). Desktop 16:9 keeping the bottom of the shot
 * (the product cluster sits low); mobile 4:5 cropped from the same shot centred on the
 * cluster. Both are written at the source's own resolution and never upscaled (ADR-029,
 * amended 2026-09-19): the 1586 px placeholder is served at 1586, a 3000 px photograph at
 * 3000, and the optimizer's encode is the only lossy step after this one (`PHOTO_JPEG`).
 * Final photos replace the placeholders through the admin.
 *
 * The English document mirrors the layout (the copy sits at the left, ADR-044), so its
 * placeholders are the same shots flipped (`public/images/hero-en/`): the cluster moves to
 * the right and the calm area to the left, under the copy. A flipped shot mirrors the printed
 * logo too; Dhia's English photographs replace these in the admin (RUNBOOK).
 */
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { heroMobileWindow, largestBox, PHOTO_JPEG } from '../src/lib/photo';

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
  const source = { width: meta.width ?? 0, height: meta.height ?? 0 };

  // Desktop: the largest 16:9 box of the shot, anchored at the bottom.
  const desktop = largestBox(source, 16 / 9);
  await shot()
    .resize(desktop.width, desktop.height, {
      fit: 'cover',
      position: 'south',
      withoutEnlargement: true,
    })
    .jpeg(PHOTO_JPEG)
    .toFile(join(out, `${name}-desktop.jpg`));

  // Mobile: the 4:5 window over the cluster, full height.
  const window = heroMobileWindow(source, flip ? 1 - clusterX : clusterX);
  const mobile = largestBox(window, 4 / 5);
  await shot()
    .extract(window)
    .resize(mobile.width, mobile.height, { fit: 'cover', withoutEnlargement: true })
    .jpeg(PHOTO_JPEG)
    .toFile(join(out, `${name}-mobile.jpg`));
  return { desktop, mobile };
}

for (const [folder, flip] of [
  ['hero', false],
  ['hero-en', true],
] as const) {
  const out = join(root, 'public', 'images', folder);
  mkdirSync(out, { recursive: true });
  for (const s of sources) {
    const input = join(root, 'resources', 'hero', 'examples', s.file);
    const { desktop, mobile } = await crops(input, s.name, s.clusterX, out, flip);
    console.log(
      `hero-crops: ${folder}/${s.name} desktop ${desktop.width}x${desktop.height}, mobile ${mobile.width}x${mobile.height}`,
    );
  }
}
