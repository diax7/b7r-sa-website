// The island header at rest and scrolled, desktop and phone, against the review server.
import { chromium, devices } from '@playwright/test';
const out = process.argv[2];
const browser = await chromium.launch();
for (const [name, ctx] of [
  ['desktop', { viewport: { width: 1280, height: 800 } }],
  ['phone', { ...devices['iPhone 15'] }],
]) {
  const context = await browser.newContext(ctx);
  const page = await context.newPage();
  await page.goto('http://localhost:3004/', { waitUntil: 'networkidle' });
  await page.screenshot({
    path: `${out}/island-${name}-rest.png`,
    clip: { x: 0, y: 0, width: ctx.viewport?.width ?? 393, height: 160 },
  });
  await page.evaluate(() => window.scrollTo(0, 600));
  await page.waitForTimeout(700);
  await page.screenshot({
    path: `${out}/island-${name}-scrolled.png`,
    clip: { x: 0, y: 0, width: ctx.viewport?.width ?? 393, height: 160 },
  });
  const box = await page.locator('header').boundingBox();
  console.log(name, JSON.stringify(box));
  await context.close();
}
await browser.close();
