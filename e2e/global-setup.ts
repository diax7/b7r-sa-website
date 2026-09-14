import { BASE_URL } from '../playwright.config';

const PAGES = [
  '/',
  '/products',
  '/products/tee-essential',
  '/contact',
  '/blog/how-to-price-printed-tshirt-saudi',
];

/** The optimizer encodes the format the request accepts: the browsers ask for AVIF; a request
 *  with fetch's default Accept (any type) gets a JPEG instead, warming nothing a test uses. */
const IMAGE_ACCEPT = 'image/avif,image/webp,*/*;q=0.8';

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
      let misses = 0;
      for (const img of images) {
        const image = await fetch(`${BASE_URL}${img.replaceAll('&amp;', '&')}`, {
          headers: { accept: IMAGE_ACCEPT },
        }).catch(() => undefined);
        if (image?.headers.get('x-nextjs-cache') === 'MISS') misses += 1;
      }
      if (round === 2) console.log(`warm ${path} images: ${images.length}, ${misses} miss`);
    }
  }
}
