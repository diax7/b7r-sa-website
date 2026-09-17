// The shiny buttons across the home page: the hero, the ribbon, the designer's card.
import { chromium } from '@playwright/test';
const out = process.argv[2];
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 2,
});
await page.goto('http://localhost:3004/', { waitUntil: 'networkidle' });
await page.locator('a[data-location="hero"]').screenshot({ path: `${out}/shiny-hero.png` });
await page.locator('a[data-location="ribbon"]').scrollIntoViewIfNeeded();
await page.waitForTimeout(500);
await page
  .locator('section[aria-labelledby="cta-ribbon-title"]')
  .screenshot({ path: `${out}/shiny-ribbon.png` });
await browser.close();
