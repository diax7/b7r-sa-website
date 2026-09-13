import { BASE_URL } from '../playwright.config';

const PAGES = [
  '/',
  '/products',
  '/products/tee-essential',
  '/contact',
  '/blog/how-to-price-printed-tshirt-saudi',
];

/**
 * Warms the running server before any test (CI only, see playwright.config.ts): every audited
 * page twice (the second request confirms the ISR entry is a HIT) and every image transform
 * the page references, so no test pays for a cold AVIF encode. Mirrors scripts/ci/warm-lib.sh.
 */
export default async function globalSetup(): Promise<void> {
  for (let round = 1; round <= 2; round++) {
    for (const path of PAGES) {
      const res = await fetch(`${BASE_URL}${path}`);
      const html = await res.text();
      if (round === 2)
        console.log(`warm ${path}: ${res.headers.get('x-nextjs-cache') ?? 'no cache header'}`);
      const images = [...new Set(html.match(/\/_next\/image[^" ]*/g) ?? [])];
      for (const img of images) {
        await fetch(`${BASE_URL}${img.replaceAll('&amp;', '&')}`).catch(() => undefined);
      }
    }
  }
}
