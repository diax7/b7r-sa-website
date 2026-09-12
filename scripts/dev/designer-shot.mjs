import { chromium, devices } from '@playwright/test';
const [, , url, out, mode = 'desktop'] = process.argv;
const browser = await chromium.launch();
const ctx = await browser.newContext(
  mode === 'mobile'
    ? { ...devices['Pixel 7'] }
    : { viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 },
);
const page = await ctx.newPage();
page.on('pageerror', (e) => console.error('pageerror', e.message));
page.on('console', (m) => {
  if (m.type() === 'error') console.error('console', m.text());
});
await page.goto(url, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.locator('#designer').scrollIntoViewIfNeeded();
await page.waitForSelector('[data-designer-island] canvas', { timeout: 15000 });
await page.waitForTimeout(1200);
await page.locator('#designer').screenshot({ path: out });
await browser.close();
