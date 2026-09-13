import { chromium, devices } from '@playwright/test';
const [, , url, outDir, mode = 'desktop'] = process.argv;
const browser = await chromium.launch();
const ctx = await browser.newContext(
  mode === 'mobile'
    ? { ...devices['Pixel 7'] }
    : { viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 },
);
const page = await ctx.newPage();
await page.goto(url, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
for (const id of ['why-us', 'testimonials', 'integrations', 'faq']) {
  await page.locator(`#${id}`).scrollIntoViewIfNeeded();
  await page.waitForTimeout(700);
  await page.locator(`#${id}`).screenshot({ path: `${outDir}/${mode}-${id}.png` });
}
await browser.close();
