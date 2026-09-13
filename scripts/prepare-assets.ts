/**
 * Derives `public/` from `resources/` (ADR-002). Idempotent; run with `pnpm assets`.
 *
 * - fonts:    see scripts/subset-fonts.sh (subset woff2 -> public/fonts/)
 * - logos:    resources/brand/logo/*.png             -> public/images/logo/ (+ app icons)
 * - products: resources/products/{slug}/*.jpg        -> public/images/products/{slug}/ (q82)
 * - badges:   payment + trust + misk                 -> public/images/badges/
 * - icons-3d: resources/icons-3d/*.jpg (not sheet)   -> public/images/icons-3d/
 * - video:    resources/video/*.mp4 + poster         -> public/video/ (poster = BRD 6.4.5 fallback still
 *             until a frame can be extracted; see RUNBOOK)
 * - integrations: resources/brand/integrations/*.svg -> public/images/integrations/
 * - lifestyle: decorative mockups for the about banner (21:9) and blog covers (16:9)
 */
import { copyFileSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const res = (...p: string[]) => join(root, 'resources', ...p);
const pub = (...p: string[]) => join(root, 'public', ...p);

function ensure(dir: string) {
  mkdirSync(dir, { recursive: true });
}

async function logos() {
  ensure(pub('images', 'logo'));
  for (const f of ['logo.png', 'logo-white.png', 'logo-black.png', 'icon.png', 'small-icon.png']) {
    copyFileSync(res('brand', 'logo', f), pub('images', 'logo', f));
  }
  // Header lockups at 2x of their rendered height (36 px desktop) keep bytes small.
  await sharp(res('brand', 'logo', 'logo.png'))
    .resize({ height: 144 })
    .png()
    .toFile(pub('images', 'logo', 'logo-header.png'));
  await sharp(res('brand', 'logo', 'logo-white.png'))
    .resize({ height: 160 })
    .png()
    .toFile(pub('images', 'logo', 'logo-white-footer.png'));
  // App Router file-convention icons (served as <link rel="icon"> / apple-touch-icon). The
  // favicon is fetched at high priority on every page, so it stays small (96 px).
  await sharp(res('brand', 'logo', 'icon.png'))
    .resize(96, 96)
    .png()
    .toFile(join(root, 'src', 'app', 'icon.png'));
  await sharp(res('brand', 'logo', 'icon.png'))
    .resize(180, 180)
    .flatten({ background: '#ffffff' })
    .png()
    .toFile(join(root, 'src', 'app', 'apple-icon.png'));
  // Manifest icons (BRD 7.3) and a classic favicon.ico (a 32 px PNG in an ICO container).
  ensure(pub('icons'));
  for (const size of [192, 512]) {
    await sharp(res('brand', 'logo', 'icon.png'))
      .resize(size, size)
      .png()
      .toFile(pub('icons', `icon-${size}.png`));
  }
  const png32 = await sharp(res('brand', 'logo', 'icon.png'))
    .resize(32, 32)
    .png()
    .toBuffer();
  writeFileSync(join(root, 'src', 'app', 'favicon.ico'), icoFromPng(png32, 32));
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

async function products() {
  const base = res('products');
  for (const slug of readdirSync(base)) {
    ensure(pub('images', 'products', slug));
    for (const f of readdirSync(join(base, slug))) {
      if (!f.endsWith('.jpg')) continue;
      await sharp(join(base, slug, f))
        .resize(1000, 1000, { fit: 'cover' })
        .jpeg({ quality: 82, mozjpeg: true })
        .toFile(pub('images', 'products', slug, f));
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
      .jpeg({ quality: 82, mozjpeg: true })
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
  await sharp(src('hanging-tshirt-mockup-2.jpg'))
    .resize(1920, 823, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(pub('images', 'lifestyle', 'hanging-tshirt-mockup.jpg'));
  // 16:9 covers; the focal point of each source is known, so the crop anchor is explicit.
  const covers: Array<[string, string, 'centre' | 'top']> = [
    ['designer-at-desk-stock.jpg', 'cover-start-brand.jpg', 'centre'],
    ['hodie2.jpg', 'cover-print-on-demand.jpg', 'top'],
    ['totebag1.jpg', 'cover-pricing.jpg', 'centre'],
  ];
  for (const [from, to, position] of covers) {
    await sharp(src(from))
      .resize(1600, 900, { fit: 'cover', position })
      .jpeg({ quality: 80, mozjpeg: true })
      .toFile(pub('images', 'lifestyle', to));
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
