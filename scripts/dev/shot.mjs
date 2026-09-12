import { chromium, devices } from '@playwright/test';
const [, , url, out, mode = 'desktop', full = 'full'] = process.argv;
const browser = await chromium.launch();
const ctx = await browser.newContext(
  mode === 'mobile'
    ? { ...devices['Pixel 7'] }
    : { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 },
);
const page = await ctx.newPage();
await page.goto(url, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(600);
await page.screenshot({ path: out, fullPage: full === 'full' });
await browser.close();
