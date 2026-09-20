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

/** The mockup's two renditions for a colour's front photo (a media URL). */
export function mockupUrls(src: string): MockupUrls {
  return {
    avif: renditionUrl(src, MOCKUP_WIDTH, 'avif'),
    webp: renditionUrl(src, MOCKUP_WIDTH, 'webp'),
  };
}
