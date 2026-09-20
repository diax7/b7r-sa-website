import type { Product } from '@/content/schema';
import { designerColorFor } from '@/lib/product-helpers';
import { renditionUrl } from '@/lib/renditions';

/**
 * The one size a mockup is ever requested at (BRD 6.4.3, ADR-064): the stage is 640 px at
 * most and 1080 is the next rung, so retina stays crisp. The static preview, the canvas and
 * the preload all name these two files and nothing else, so whichever the browser fetched
 * first serves the other two from its cache.
 */
export const MOCKUP_WIDTH = 1080;

export interface MockupUrls {
  avif: string;
  webp: string;
}

/**
 * The front photo the designer shows a product in: the `designerColorFor` colour (white, or
 * the product's only one), else the first colour's. The static preview, the chips, the
 * canvas and the preload all read this one rule, which is what keeps them on one file.
 */
export function mockupSourceOf(product: Product): string | undefined {
  const colour = designerColorFor(product);
  return (
    product.colors.find((c) => c.slug === colour)?.images.front ?? product.colors[0]?.images.front
  );
}

/**
 * The mockup's two renditions for a colour's front photo (a media URL). The current
 * product's file can be asked for twice while the island mounts (the lazy preview `<img>`
 * and the detached picture can both start before either completes): one small file,
 * bounded, not worth a lock.
 */
export function mockupUrls(src: string): MockupUrls {
  return {
    avif: renditionUrl(src, MOCKUP_WIDTH, 'avif'),
    webp: renditionUrl(src, MOCKUP_WIDTH, 'webp'),
  };
}
