// Every image on a page at a retina desktop and a phone: the CSS size it is drawn at, the
// rendition the browser chose, and whether it is being upscaled (blurry) or oversized.
import { chromium } from '@playwright/test';
const origin = process.argv[2] ?? 'https://b7r-sa-website-dkrtv6.cranl.net';
const paths = (
  process.argv[3] ?? '/,/products,/products/tee-essential,/blog/how-to-price-printed-tshirt-saudi'
).split(',');
const browser = await chromium.launch();
for (const [label, opts] of [
  ['desktop 2x', { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 }],
  ['phone 3x', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true }],
]) {
  const ctx = await browser.newContext({ locale: 'ar-SA', ...opts });
  const page = await ctx.newPage();
  for (const path of paths) {
    await page.goto(`${origin}${path}`, { waitUntil: 'networkidle' });
    await page.evaluate(async () => {
      window.scrollTo(0, document.body.scrollHeight);
      await new Promise((r) => setTimeout(r, 1500));
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(1500);
    const rows = await page.evaluate(() => {
      const dpr = window.devicePixelRatio;
      return [...document.querySelectorAll('img')]
        .filter((i) => i.getBoundingClientRect().width > 40)
        .map((i) => {
          const r = i.getBoundingClientRect();
          const u = new URL(i.currentSrc || i.src, location.href);
          const w = u.searchParams.get('w');
          const file = (u.searchParams.get('url') ?? u.pathname).split('/').pop();
          return {
            file,
            css: Math.round(r.width),
            need: Math.round(r.width * dpr),
            got: i.naturalWidth,
            w,
            sizes: i.sizes || '',
          };
        });
    });
    console.log(`\n== ${label} ${path}`);
    for (const r of rows) {
      const ratio = r.got / r.need;
      const verdict =
        ratio < 0.85
          ? `UPSCALED x${(1 / ratio).toFixed(1)} (soft)`
          : ratio > 1.6
            ? `oversized x${ratio.toFixed(1)}`
            : 'ok';
      console.log(
        `  ${(r.file ?? '').slice(0, 42).padEnd(42)} css ${String(r.css).padStart(4)}  needs ${String(r.need).padStart(4)}  got ${String(r.got).padStart(4)}  w=${String(r.w).padStart(4)}  ${verdict}  sizes="${r.sizes.slice(0, 40)}"`,
      );
    }
  }
  await ctx.close();
}
await browser.close();
