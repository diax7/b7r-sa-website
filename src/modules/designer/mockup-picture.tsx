import type { CSSProperties } from 'react';
import { mockupUrls } from '@/modules/designer/mockup';

interface MockupPictureProps {
  /** The colour's front photo (a media URL). */
  src: string;
  alt: string;
  /** The blur-up placeholder the library computed on upload, when the document has one. */
  blur?: string | undefined;
  className?: string;
}

/**
 * The mockup as a picture (ADR-064): the AVIF and WebP renditions at `MOCKUP_WIDTH`, one
 * candidate each, so the browser's pick is the file the canvas will draw when the island
 * replaces this preview. Not `<Photo>`: a candidate list would let a 2x screen pick a wider
 * rung than the canvas's fixed one. Fills its box like `next/image`'s `fill`; the blur sits
 * under it as the background until the island takes over (a server component, so nothing
 * clears it; the mockups are opaque JPEGs, so nothing shows through), lazy like every photo
 * below the fold.
 */
export function MockupPicture({ src, alt, blur, className }: MockupPictureProps) {
  const urls = mockupUrls(src);
  const style: CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    // The alt text stays invisible while the photo loads, as `next/image` does it.
    color: 'transparent',
    ...(blur
      ? {
          backgroundImage: `url("${blur}")`,
          backgroundSize: 'cover',
          backgroundPosition: '50% 50%',
          backgroundRepeat: 'no-repeat',
        }
      : {}),
  };
  return (
    <picture>
      <source type="image/avif" srcSet={urls.avif} />
      <img
        src={urls.webp}
        alt={alt}
        className={className}
        style={style}
        loading="lazy"
        decoding="async"
        data-mockup=""
      />
    </picture>
  );
}
