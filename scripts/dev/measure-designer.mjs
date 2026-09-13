import { chromium, devices } from '@playwright/test';
const browser = await chromium.launch();
for (const [name, opts] of [
  ['desktop', { viewport: { width: 1280, height: 800 } }],
  ['tablet', { viewport: { width: 900, height: 800 } }],
  ['mobile', { ...devices['Pixel 7'] }],
]) {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  await page.goto('http://localhost:3004/', { waitUntil: 'load' });
  const before = await page
    .locator('[data-designer-fallback]')
    .evaluate((el) => el.getBoundingClientRect().height);
  await page.locator('#designer').scrollIntoViewIfNeeded();
  await page.waitForSelector('[data-designer-island] canvas', { timeout: 15000 });
  await page.waitForTimeout(500);
  const after = await page
    .locator('[data-designer-island]')
    .evaluate((el) => el.getBoundingClientRect().height);
  console.log(name, { fallback: Math.round(before), island: Math.round(after) });
  await ctx.close();
}
await browser.close();
