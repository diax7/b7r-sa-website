import { chromium } from '@playwright/test';
const [, , url, out, fraction = '0.5'] = process.argv;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto(url, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.evaluate((f) => {
  const s = document.getElementById('steps');
  const top = s.getBoundingClientRect().top + window.scrollY;
  window.scrollTo(0, top + (s.offsetHeight - window.innerHeight) * Number(f));
}, fraction);
await page.waitForTimeout(700);
await page.screenshot({ path: out });
await browser.close();
