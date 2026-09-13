import { chromium, devices } from '@playwright/test';
const [, , url, out, mode = 'desktop'] = process.argv;
const browser = await chromium.launch();
const ctx = await browser.newContext(
  mode === 'mobile'
    ? { ...devices['Pixel 7'] }
    : { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 },
);
const page = await ctx.newPage();
page.on('pageerror', (e) => console.error('pageerror', e.message));
await page.goto(url, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
// Scroll through the page so lazy islands and reveals mount.
const h = await page.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < h; y += 600) {
  await page.evaluate((top) => window.scrollTo(0, top), y);
  await page.waitForTimeout(120);
}
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(800);
await page.screenshot({ path: out, fullPage: true });
await browser.close();
