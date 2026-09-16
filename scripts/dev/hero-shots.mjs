// Screenshots of the hero at 1920, 2560 and 3440 px against the review server, with optional
// CSS injected for a design study (ADR-051): node scripts/dev/hero-shots.mjs <out dir> [file.css]
import { chromium } from '@playwright/test';

const out = process.argv[2];
const css = process.argv[3]
  ? await import('node:fs').then((fs) => fs.readFileSync(process.argv[3], 'utf8'))
  : '';
const base = 'http://localhost:3004';
const shots = [
  ['ar-2560', '/', 2560, 1440],
  ['ar-3440', '/', 3440, 1440],
  ['en-2560', '/en', 2560, 1440],
  ['ar-1920', '/', 1920, 1080],
];
const browser = await chromium.launch();
for (const [name, path, w, h] of shots) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 0.5 });
  await page.goto(base + path, { waitUntil: 'networkidle' });
  if (css) await page.addStyleTag({ content: css });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: false });
  const box = await page.locator('section.hero').boundingBox();
  const img = await page.locator('[data-hero-image="0"]').evaluate((el) => ({
    natural: el.naturalWidth,
    rendered: el.getBoundingClientRect().width,
    src: el.currentSrc.slice(0, 80),
  }));
  console.log(name, JSON.stringify({ hero: box, img }));
  await page.close();
}
await browser.close();
