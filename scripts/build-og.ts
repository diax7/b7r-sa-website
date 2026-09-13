/**
 * Renders the Open Graph images (BRD 7.3, ADR-020) with Playwright from an HTML template
 * using the self-hosted ITF Rayat Round files, so Arabic is shaped by a real browser:
 *
 *   public/og/default.png            white, colour logo, tagline, the five product photos
 *   public/og/products/{slug}.png    product photo, name, «يبدأ من {price}» with the riyal symbol
 *
 * Idempotent; run with `pnpm og` after a product or tagline change. PNGs are committed.
 */
import { mkdirSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { chromium } from '@playwright/test';
import sharp from 'sharp';
import { productsPage } from '../src/content/pages';
import { products } from '../src/content/seed/products';
import { site } from '../src/content/seed/site';
import { stripColorFor } from '../src/lib/product-helpers';
import { TOKEN_HEX } from '../src/lib/tokens';

const root = process.cwd();
const pub = (...p: string[]) => join(root, 'public', ...p);
// Chromium refuses file:// subresources from a blank page, so `public/` is served on a fake
// origin through a Playwright route instead.
const ORIGIN = 'https://og.local';
const fileUrl = (...p: string[]) => `${ORIGIN}/${p.join('/')}`;
const HTML = 'text/html; charset=utf-8';
const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
};

const WIDTH = 1200;
const HEIGHT = 630;

// The riyal symbol path from components/shared/sar-symbol.tsx (BRD 3.11).
const SAR_SVG = readFileSync(join(root, 'src', 'components', 'shared', 'sar-symbol.tsx'), 'utf8');
const SAR_PATHS = [...SAR_SVG.matchAll(/<path d="([^"]+)"/g)]
  .map((m) => m[1])
  .join('" /><path d="');
const sar = (size: number) =>
  `<svg viewBox="0 0 1124.14 1256.39" width="${size}" height="${size * 1.12}" fill="currentColor" aria-hidden="true"><path d="${SAR_PATHS}" /></svg>`;

function shell(body: string): string {
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><style>
@font-face{font-family:Rayat;font-weight:700;src:url(${fileUrl('fonts', 'ITFRayatRound-Bold.woff2')}) format('woff2')}
@font-face{font-family:Rayat;font-weight:500;src:url(${fileUrl('fonts', 'ITFRayatRound-Medium.woff2')}) format('woff2')}
@font-face{font-family:Rayat;font-weight:900;src:url(${fileUrl('fonts', 'ITFRayatRound-Black.woff2')}) format('woff2')}
html,body{margin:0;width:${WIDTH}px;height:${HEIGHT}px;overflow:hidden;background:${TOKEN_HEX.surface};color:${TOKEN_HEX.text};font-family:Rayat,sans-serif}
.card{position:relative;width:${WIDTH}px;height:${HEIGHT}px;box-sizing:border-box}
.bar{position:absolute;inset-inline:0;bottom:0;height:14px;background:${TOKEN_HEX.primary}}
</style></head><body>${body}</body></html>`;
}

function defaultTemplate(): string {
  const photos = products
    .toSorted((a, b) => a.sortOrder - b.sortOrder)
    .map((p) => {
      const color = p.colors.find((c) => c.slug === stripColorFor(p)) ?? p.colors[0];
      return `<img src="${fileUrl(...color!.images.front.split('/').filter(Boolean))}" style="width:184px;height:184px;object-fit:cover;border-radius:20px;background:#f6f8fb">`;
    })
    .join('');
  return shell(`<div class="card" style="padding:52px 64px 48px;display:flex;flex-direction:column;justify-content:space-between">
  <div style="display:flex;flex-direction:column;gap:20px;align-items:flex-start">
    <img src="${fileUrl('images', 'logo', 'logo.png')}" style="height:84px;width:auto">
    <div style="font-weight:900;font-size:54px;line-height:1.2">${site.tagline}</div>
  </div>
  <div style="display:flex;gap:24px;justify-content:space-between">${photos}</div>
  <div class="bar"></div>
</div>`);
}

function productTemplate(slug: string): string {
  const product = products.find((p) => p.slug === slug);
  if (!product) throw new Error(`unknown product ${slug}`);
  const color = product.colors.find((c) => c.slug === stripColorFor(product)) ?? product.colors[0];
  if (!color) throw new Error(`product ${slug} has no colours`);
  return shell(`<div class="card" style="display:flex">
  <div style="flex:1;padding:64px 64px 64px 48px;display:flex;flex-direction:column;justify-content:space-between">
    <img src="${fileUrl('images', 'logo', 'logo.png')}" style="height:72px;width:auto;align-self:flex-start">
    <div>
      <div style="font-weight:900;font-size:64px;line-height:1.15">${product.name}</div>
      <div style="margin-top:20px;font-weight:500;font-size:30px;color:${TOKEN_HEX['text-muted']};line-height:1.5">${product.shortDescription}</div>
    </div>
    <div style="display:inline-flex;align-items:center;gap:16px;align-self:flex-start;background:${TOKEN_HEX.primary};color:#fff;border-radius:999px;padding:14px 32px;font-weight:700;font-size:34px">
      <span>${productsPage.pricePrefix}</span>
      <bdi dir="ltr" style="display:inline-flex;align-items:center;gap:8px">${sar(30)}<span>${product.baseCost}</span></bdi>
    </div>
  </div>
  <img src="${fileUrl(...color.images.front.split('/').filter(Boolean))}" style="width:${HEIGHT}px;height:${HEIGHT}px;object-fit:cover">
  <div class="bar"></div>
</div>`);
}

async function main() {
  mkdirSync(pub('og', 'products'), { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
  });
  let current = '';
  await page.route(`${ORIGIN}/**`, (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/index.html') {
      return route.fulfill({ body: current, contentType: HTML });
    }
    return route.fulfill({
      body: readFileSync(pub(...path.split('/').filter(Boolean))),
      contentType: MIME[extname(path)] ?? 'application/octet-stream',
    });
  });
  const shoot = async (html: string, out: string) => {
    current = html;
    await page.goto(`${ORIGIN}/index.html`, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const png = await page.screenshot({
      type: 'png',
      clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT },
    });
    // Palette PNG: same look at this size, roughly half the bytes of the raw screenshot.
    await sharp(png)
      .png({ palette: true, quality: 80, dither: 0.5, compressionLevel: 9 })
      .toFile(out);
  };
  await shoot(defaultTemplate(), pub('og', 'default.png'));
  for (const product of products) {
    await shoot(productTemplate(product.slug), pub('og', 'products', `${product.slug}.png`));
  }
  await browser.close();
  console.warn(`build-og: default + ${products.length} product images written to public/og/.`);
}

await main();
