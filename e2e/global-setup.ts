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
 * page twice (the second request confirms the ISR entry is a HIT). The photos are files
 * since ADR-064, nothing else to warm. Mirrors scripts/ci/warm-lib.sh.
 */
export default async function globalSetup(): Promise<void> {
  for (let round = 1; round <= 2; round++) {
    for (const path of PAGES) {
      const res = await fetch(`${BASE_URL}${path}`);
      await res.text();
      if (round === 2)
        console.log(`warm ${path}: ${res.headers.get('x-nextjs-cache') ?? 'no cache header'}`);
    }
  }
}
