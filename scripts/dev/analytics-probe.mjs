// Does the live site really send to Umami and GA4? A real browser visits, accepts the consent
// bar, walks two pages, and every request to the two services is listed with its status.
// Usage: node scripts/dev/analytics-probe.mjs [origin]
import { chromium } from '@playwright/test';

const origin = process.argv[2] ?? 'https://b7r-sa-website-dkrtv6.cranl.net';
const browser = await chromium.launch();
const ctx = await browser.newContext({ locale: 'ar-SA', viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();
const hits = [];
const errors = [];
page.on('response', (r) => {
  const u = r.url();
  if (/umami|google-analytics|googletagmanager|analytics\.google/.test(u)) {
    hits.push(`${r.request().method()} ${r.status()} ${u.slice(0, 110)}`);
  }
});
page.on('requestfailed', (r) => {
  const u = r.url();
  if (/umami|google-analytics|googletagmanager/.test(u))
    errors.push(`FAILED ${u.slice(0, 110)} ${r.failure()?.errorText}`);
});
page.on('console', (m) => {
  if (m.type() === 'error' && /csp|Content Security|umami|gtag|analytics/i.test(m.text()))
    errors.push(`console: ${m.text().slice(0, 160)}`);
});
await page.goto(`${origin}/`, { waitUntil: 'networkidle' });
const bar = page.getByTestId('consent-bar');
const barShown = await bar.isVisible().catch(() => false);
console.log('consent bar shown:', barShown);
if (barShown) {
  await page.getByTestId('consent-accept').click();
  await page.waitForTimeout(2500);
}
await page.locator('footer a[href="/products"]').first().click();
await page.waitForURL(/\/products$/);
await page.waitForTimeout(2500);
await page
  .locator('a[href="/products/tee-essential"]')
  .first()
  .click()
  .catch(() => page.goto(`${origin}/products/tee-essential`));
await page.waitForTimeout(2500);
console.log('\nrequests to the two services:');
for (const h of hits) console.log(' ', h);
console.log(
  '\numami sends:',
  hits.filter((h) => /api\/send/.test(h)).length,
  '| GA collects:',
  hits.filter((h) => /\/g\/collect|\/collect\?/.test(h)).length,
);
if (errors.length) console.log('\nerrors:\n ', errors.join('\n  '));
await browser.close();
