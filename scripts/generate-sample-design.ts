/**
 * Renders the designer's default sample design «تصميمك هنا» (BRD §6.4.3) to a transparent
 * 1200 × 600 PNG through headless Chromium, which shapes Arabic correctly (ADR-007).
 * Run once with `pnpm assets:sample-design`; the output is committed.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const root = process.cwd();
const font = readFileSync(join(root, 'public', 'fonts', 'ITFRayatRound-Bold.woff2')).toString(
  'base64',
);

const html = `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8">
<style>
  @font-face { font-family: R; src: url(data:font/woff2;base64,${font}) format('woff2'); font-weight: 700; }
  html, body { margin: 0; background: transparent; }
  body { width: 1200px; height: 600px; display: grid; place-items: center; }
  .t { font: 700 250px/1 R, sans-serif; color: #0058B0; letter-spacing: 0; white-space: nowrap; }
</style></head>
<body><div class="t">تصميمك هنا</div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1200, height: 600 },
  deviceScaleFactor: 1,
});
await page.setContent(html);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({
  path: join(root, 'public', 'designs', 'sample-tasmeemak.png'),
  omitBackground: true,
  clip: { x: 0, y: 0, width: 1200, height: 600 },
});
await browser.close();
console.log('generate-sample-design: public/designs/sample-tasmeemak.png');
