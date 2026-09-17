// The header CTA up close (the shiny variant), at rest and hovered.
import { chromium } from '@playwright/test';
const out = process.argv[2];
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 2,
});
await page.goto('http://localhost:3004/', { waitUntil: 'networkidle' });
await page.evaluate(() => window.scrollTo(0, 600));
await page.waitForTimeout(700);
const cta = page.locator('header a[data-location="header"]');
await cta.screenshot({ path: `${out}/cta-rest.png` });
await cta.hover();
await page.waitForTimeout(800);
await page.locator('header').screenshot({ path: `${out}/cta-hover.png` });
await browser.close();
