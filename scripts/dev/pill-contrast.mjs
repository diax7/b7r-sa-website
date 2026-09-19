// Measures the New pill's contrast on the inbox list (ADR-061) as built and for a few
// candidate colourings, on a running server with at least one New message (origin, .env.local
// for the admin login). Prints numbers only. The e2e asserts the built one at 4.5:1.
import { readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const origin = process.argv[2] ?? 'http://localhost:3014';
const env = Object.fromEntries(
  readFileSync(process.argv[3] ?? '.env.local', 'utf8')
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]),
);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, locale: 'en-US' });
await page.request.post(`${origin}/api/payload/users/login`, {
  data: { email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD },
});
await page.goto(`${origin}/admin/collections/messages`, { waitUntil: 'networkidle' });
const pill = page.locator('td.cell-status [data-admin-status="new"]').first();
const rows = await page.locator('td.cell-status [data-admin-status]').count();
console.log('pills on the list:', rows);
/* oxlint-disable unicorn/consistent-function-scoping -- serialised into the page as one function */
// The e2e's helper (`e2e/admin.spec.ts`, `contrast`): the browser composites every ancestor's
// background over black into a one-pixel canvas, then the pill's, and the pixel is read.
const contrast = (el, style) => {
  Object.assign(el.style, style);
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  const paint = (colour) => {
    ctx.fillStyle = colour;
    ctx.fillRect(0, 0, 1, 1);
  };
  const pixel = () => [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3);
  const layers = [];
  for (let node = el.parentElement; node; node = node.parentElement) {
    layers.push(getComputedStyle(node).backgroundColor);
  }
  paint('rgb(0, 0, 0)');
  for (const layer of layers.toReversed()) paint(layer);
  paint(getComputedStyle(el).backgroundColor);
  const behind = pixel();
  paint('rgb(0, 0, 0)');
  paint(getComputedStyle(el).color);
  const ink = pixel();
  const weights = [0.2126, 0.7152, 0.0722];
  const lum = (c) =>
    c
      .map((v) => v / 255)
      .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
      .reduce((sum, v, i) => sum + v * weights[i], 0);
  const text = lum(ink);
  const back = lum(behind);
  return {
    ratio: (Math.max(text, back) + 0.05) / (Math.min(text, back) + 0.05),
    behind: behind.join(','),
    color: getComputedStyle(el).color,
  };
};
/* oxlint-enable unicorn/consistent-function-scoping */
const tint = (alpha) => `rgb(0 152 224 / ${alpha})`;
const candidates = {
  'as built': {},
  'accent on accent-tint 14%': { color: '#0098e0', backgroundColor: tint(0.14) },
  'accent, tint 10%': { color: '#0098e0', backgroundColor: tint(0.1) },
  'accent, no tint': { color: '#0098e0', backgroundColor: 'transparent' },
  '#1a9de3 on tint 14%': { color: '#1a9de3', backgroundColor: tint(0.14) },
  '#33a8e6 on tint 14%': { color: '#33a8e6', backgroundColor: tint(0.14) },
  '#33a8e6 on tint 10%': { color: '#33a8e6', backgroundColor: tint(0.1) },
  '#4db3e9 on tint 14%': { color: '#4db3e9', backgroundColor: tint(0.14) },
};
for (const [label, style] of Object.entries(candidates)) {
  const r = await pill.evaluate(contrast, style);
  console.log(label.padEnd(40), r.ratio.toFixed(2), 'behind', r.behind, r.color);
}
await browser.close();
