import { chromium } from '@playwright/test';
const [, , url, out, selector, scale = '2'] = process.argv;
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: Number(scale),
});
await page.goto(url, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(500);
await page.locator(selector).first().screenshot({ path: out });
await browser.close();
