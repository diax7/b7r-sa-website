import { chromium } from '@playwright/test';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on('pageerror', (e) => console.error('pageerror', e.message));
await page.goto('http://localhost:3004/', { waitUntil: 'load' });
await page.waitForTimeout(500);
for (const frac of [0, 0.4, 0.75]) {
  await page.evaluate((f) => {
    const s = document.getElementById('steps');
    const top = s.getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, top + (s.offsetHeight - window.innerHeight) * f);
  }, frac);
  await page.waitForTimeout(400);
  console.log(
    frac,
    await page.evaluate(() => {
      const s = document.getElementById('steps');
      const r = s.getBoundingClientRect();
      return {
        active: s.dataset.active,
        progress: s.style.getPropertyValue('--progress'),
        top: Math.round(r.top),
        h: Math.round(r.height),
        vh: innerHeight,
        js: document.documentElement.classList.contains('js'),
      };
    }),
  );
}
await browser.close();
