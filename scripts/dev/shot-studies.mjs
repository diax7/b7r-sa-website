// One look at the header studies page (design review): each concept's stage, scrolled.
//   node scripts/dev/shot-studies.mjs <html file> <out dir>
import { chromium } from '@playwright/test';
import { pathToFileURL } from 'node:url';

const [file, out] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto(pathToFileURL(file).href);
await page.waitForTimeout(800);
for (const id of ['c1', 'c2', 'c3', 'c4']) {
  await page.evaluate((section) => {
    const s = document.querySelector(`#${section}`);
    s.scrollIntoView();
    for (const p of s.querySelectorAll('.page')) p.scrollTop = 420;
  }, id);
  await page.waitForTimeout(600);
  if (id === 'c2') await page.hover('#c2 .rail');
  if (id === 'c3') {
    // The bar hides on the way down; a step back up brings it back, then the menu opens.
    await page.evaluate(() => { for (const p of document.querySelectorAll('#c3 .page')) p.scrollTop = 360; });
    await page.waitForTimeout(500);
    await page.click('#c3 .laptop [data-open]');
  }
  await page.waitForTimeout(500);
  await page.locator(`#${id} .stage`).screenshot({ path: `${out}/${id}.png` });
}
await browser.close();
