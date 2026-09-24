/**
 * Derives `public/` from `resources/` (ADR-002). Idempotent; run with `pnpm assets`.
 *
 * - fonts:    see scripts/subset-fonts.sh (subset woff2 -> public/fonts/)
 * - logos:    resources/brand/logo/*.png             -> public/images/logo/ (+ favicon.ico)
 * - products: resources/products/{slug}/*.jpg        -> public/images/products/{slug}/ (1:1)
 * - badges:   payment + trust + misk                 -> public/images/badges/
 * - icons-3d: resources/icons-3d/*.jpg (not sheet)   -> public/images/icons-3d/
 * - video:    resources/video/*.mp4 + poster         -> public/video/ (poster = BRD 6.4.5 fallback still
 *             until a frame can be extracted; see RUNBOOK)
 * - integrations: resources/brand/integrations/*.svg -> public/images/integrations/
 * - lifestyle: decorative mockups for the about banner (21:9) and blog covers (16:9)
 *
 * Photos (products, covers, the banner, the 3D icons) are written once, at the source's own
 * resolution and never upscaled, as JPEG q92 with full chroma (`PHOTO_JPEG`, ADR-029 amended
 * 2026-09-19): the image optimizer's encode is the only lossy step the browser sees.
 */
import { copyFileSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { type Box, largestBox, PHOTO_JPEG, squareBox } from '../src/lib/photo';

const root = process.cwd();
const res = (...p: string[]) => join(root, 'resources', ...p);
const pub = (...p: string[]) => join(root, 'public', ...p);

function ensure(dir: string) {
  mkdirSync(dir, { recursive: true });
}

async function logos() {
  ensure(pub('images', 'logo'));
  // The panel's logo and the share images' (both raster, on the "does not follow" list); the
  // site draws its logo and its app icons from the traced paths (spec 010, phase 1d).
  copyFileSync(res('brand', 'logo', 'logo.png'), pub('images', 'logo', 'logo.png'));
  // The panel's 36 px mark and the admin's favicon: 512 px, palette PNG (two flat colours),
  // about 16 KB against the 223 KB source (site audit 2026-09-18, item 15).
  await sharp(res('brand', 'logo', 'icon.png'))
    .resize(512, 512)
    .png({ palette: true, quality: 90, compressionLevel: 9 })
    .toFile(pub('images', 'logo', 'icon.png'));
  // The classic favicon.ico (a 32 px PNG in an ICO container), a format Next cannot draw, for
  // a client that asks for it by path. It sits in `public/`, so no page links it: the tab icon
  // is the one `src/app/icon.tsx` draws in the brand's colours.
  const png32 = await sharp(res('brand', 'logo', 'icon.png'))
    .resize(32, 32)
    .png()
    .toBuffer();
  writeFileSync(pub('favicon.ico'), icoFromPng(png32, 32));
}

/** ICO container around one PNG image (valid since Windows Vista; every browser reads it). */
function icoFromPng(png: Buffer, size: number): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // one image
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size, 0);
  entry.writeUInt8(size, 1);
  entry.writeUInt8(0, 2); // palette
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(header.length + entry.length, 12);
  return Buffer.concat([header, entry, png]);
}

/** A source's pixel size, for the crop arithmetic. */
async function sizeOf(input: string): Promise<Box> {
  const meta = await sharp(input).metadata();
  return { width: meta.width ?? 0, height: meta.height ?? 0 };
}

/** A photo cropped to `box` at the anchor, never scaled up, encoded once. */
async function photo(input: string, box: Box, position: string, out: string) {
  await sharp(input)
    .resize(box.width, box.height, { fit: 'cover', position, withoutEnlargement: true })
    .jpeg(PHOTO_JPEG)
    .toFile(out);
}

/** The catalogue photos (BRD 6.6): the largest centred square of each source. */
async function products() {
  const base = res('products');
  for (const slug of readdirSync(base)) {
    ensure(pub('images', 'products', slug));
    for (const f of readdirSync(join(base, slug))) {
      if (!f.endsWith('.jpg')) continue;
      const input = join(base, slug, f);
      await photo(
        input,
        squareBox(await sizeOf(input)),
        'centre',
        pub('images', 'products', slug, f),
      );
    }
  }
}

async function badges() {
  ensure(pub('images', 'badges'));
  const pay = res('brand', 'trust-badges', 'payment-methods');
  for (const f of readdirSync(pay)) {
    // The strip crops carry ~60 % transparent padding; trim, then ship 2x of 28 px.
    await sharp(join(pay, f))
      .trim()
      .resize({ height: 56 })
      .png()
      .toFile(pub('images', 'badges', f));
  }
  const low = res('brand', 'trust-badges', 'cropped-lowres');
  copyFileSync(
    join(low, 'saudi-business-center.png'),
    pub('images', 'badges', 'saudi-business-center.png'),
  );
  copyFileSync(
    join(low, 'ministry-of-commerce.png'),
    pub('images', 'badges', 'ministry-of-commerce.png'),
  );
  await sharp(res('brand', 'trust-badges', 'misk-foundation-logo.png'))
    .resize({ width: 400 })
    .png()
    .toFile(pub('images', 'badges', 'misk-foundation-logo.png'));
}

async function video() {
  ensure(pub('video'));
  copyFileSync(res('video', 'printer-marketing.mp4'), pub('video', 'printer-marketing.mp4'));
  // The stock still is a transparent PNG; flatten it onto the page ground colour.
  await sharp(res('lifestyle-mockups', 'dtg-printer-stock.png'))
    .flatten({ background: '#f6f8fb' })
    .resize(1280, 720, { fit: 'contain', background: '#f6f8fb' })
    .jpeg({ quality: 80, mozjpeg: true })
    .toFile(pub('video', 'printer-marketing-poster.jpg'));
}

async function integrations() {
  ensure(pub('images', 'integrations'));
  for (const f of readdirSync(res('brand', 'integrations'))) {
    if (f.endsWith('.svg'))
      copyFileSync(res('brand', 'integrations', f), pub('images', 'integrations', f));
  }
}

async function icons3d() {
  ensure(pub('images', 'icons-3d'));
  for (const f of readdirSync(res('icons-3d'))) {
    if (!f.endsWith('.jpg')) continue;
    await sharp(res('icons-3d', f))
      .jpeg(PHOTO_JPEG)
      .toFile(pub('images', 'icons-3d', f));
  }
}

/** Decorative only (BRD 6.8, 6.11): never listed as products. */
async function lifestyle() {
  ensure(pub('images', 'lifestyle'));
  const src = (f: string) => res('lifestyle-mockups', f);
  // BRD 6.8 names hanging-tshirt-mockup.jpg, but that file carries the vendor's
  // "Free t-shirt mockup" sample print; -2 is the same subject with a real design
  // (flagged for Dhia in Appendix G).
  const banner = src('hanging-tshirt-mockup-2.jpg');
  await photo(
    banner,
    largestBox(await sizeOf(banner), 21 / 9),
    'centre',
    pub('images', 'lifestyle', 'hanging-tshirt-mockup.jpg'),
  );
  // 16:9 covers; the focal point of each source is known, so the crop anchor is explicit.
  const covers: Array<[string, string, 'centre' | 'top']> = [
    ['designer-at-desk-stock.jpg', 'cover-start-brand.jpg', 'centre'],
    ['hodie2.jpg', 'cover-print-on-demand.jpg', 'top'],
    ['totebag1.jpg', 'cover-pricing.jpg', 'centre'],
  ];
  for (const [from, to, position] of covers) {
    const input = src(from);
    await photo(
      input,
      largestBox(await sizeOf(input), 16 / 9),
      position,
      pub('images', 'lifestyle', to),
    );
  }
}

await logos();
await products();
await badges();
await icons3d();
await video();
await integrations();
await lifestyle();
console.log('prepare-assets: public/ is up to date.');
