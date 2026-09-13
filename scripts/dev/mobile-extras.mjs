import { chromium, devices } from '@playwright/test';
const [, , url, out] = process.argv;
const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices['Pixel 7'] });
const page = await ctx.newPage();
await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(2200);
await page.screenshot({ path: out.replace('.png', '-consent.png') });
await page.getByTestId('whatsapp-button').click();
await page.waitForTimeout(400);
await page.screenshot({ path: out.replace('.png', '-widget.png') });
await page.keyboard.press('Escape');
await page.locator('#designer').scrollIntoViewIfNeeded();
await page.waitForSelector('[data-designer-island] canvas', { timeout: 15000 });
await page.evaluate(() => window.scrollBy(0, 300));
await page.waitForTimeout(600);
await page.screenshot({ path: out.replace('.png', '-dock.png') });
console.log(
  await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--bottom-dock'),
  ),
);
await browser.close();
