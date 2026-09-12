/**
 * Derives `public/` from `resources/` (ADR-002). Idempotent; run with `pnpm assets`.
 *
 * - fonts:    see scripts/subset-fonts.sh (subset woff2 -> public/fonts/)
 * - logos:    resources/brand/logo/*.png             -> public/images/logo/ (+ app icons)
 * - products: resources/products/{slug}/*.jpg        -> public/images/products/{slug}/ (q82)
 * - badges:   payment + trust + misk                 -> public/images/badges/
 * - icons-3d: resources/icons-3d/*.jpg (not sheet)   -> public/images/icons-3d/
 */
import { copyFileSync, mkdirSync, readdirSync } from 'node:fs';
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

async function icons3d() {
  ensure(pub('images', 'icons-3d'));
  for (const f of readdirSync(res('icons-3d'))) {
    if (!f.endsWith('.jpg')) continue;
    await sharp(res('icons-3d', f))
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(pub('images', 'icons-3d', f));
  }
}

await logos();
await products();
await badges();
await icons3d();
console.log('prepare-assets: public/ is up to date.');
