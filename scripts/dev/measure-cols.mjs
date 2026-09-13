import { chromium } from '@playwright/test';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto('http://localhost:3004/', { waitUntil: 'load' });
const measure = (sel) =>
  page
    .locator(sel)
    .evaluate((el) =>
      [...el.children].map((c) =>
        [...c.children].map((g) => Math.round(g.getBoundingClientRect().height)),
      ),
    );
console.log('fallback', JSON.stringify(await measure('[data-designer-fallback]')));
await page.locator('#designer').scrollIntoViewIfNeeded();
await page.waitForSelector('[data-designer-island] canvas', { timeout: 15000 });
await page.waitForTimeout(400);
console.log('island  ', JSON.stringify(await measure('[data-designer-island]')));
await browser.close();
