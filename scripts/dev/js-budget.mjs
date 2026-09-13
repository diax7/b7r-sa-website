import { chromium } from '@playwright/test';
const [, , url] = process.argv;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const rows = [];
// Same rule as the e2e budget: route prefetches belong to the next navigation.
await page.route('**/*', (route) => {
  const h = route.request().headers();
  if (h['next-router-prefetch'] || h['rsc']) return route.abort();
  return route.continue();
});
page.on('response', async (r) => {
  if (r.request().resourceType() !== 'script') return;
  try {
    const s = await r.request().sizes();
    rows.push([s.responseBodySize, r.url().replace(url, '')]);
  } catch {}
});
await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(1500);
rows.sort((a, b) => b[0] - a[0]);
for (const [b, u] of rows) console.log(String(b).padStart(8), u);
console.log(
  'total',
  rows.reduce((n, r) => n + r[0], 0),
  'budget',
  180 * 1024,
);
await browser.close();
