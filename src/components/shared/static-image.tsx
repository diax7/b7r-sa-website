import { preload as preloadResource } from 'react-dom';

interface StaticImageProps {
  /**
   * A file under `public/images` or `public/video`, written by `pnpm assets` at its shown
   * pixels, or a logo uploaded under Appearance (spec 010), the file as uploaded from the
   * storage CDN.
   */
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  /**
   * Above the fold on every page (the header logo): a `<head>` preload at high priority and
   * an eager `<img>`. The `<img>` itself carries no `fetchpriority`: the preload does, and the
   * page's one `fetchpriority="high"` image stays its LCP photo. One preload per page is
   * enough: the mobile menu shows the same file and needs none of its own.
   */
  preload?: boolean;
}

/**
 * A brand image (ADR-064): a logo, a badge, the video's poster. It has no renditions and no
 * `<picture>`: `pnpm assets` writes it once at 2x of the box it is shown in (a PNG, since
 * the marks have alpha), `/images/*` and `/video/*` come from the edge with a day of cache,
 * and nothing is encoded on the way. The image optimizer would put every one of them on
 * CranL's uncached path for a 3 KB file (the reason `next/image` is not used here, which
 * is what the lint rule asks about). Lazy unless preloaded: a lazy image in the viewport
 * still loads at once, and React's server renderer preloads every eager `<img>` it meets,
 * a fallback's included.
 */
export function StaticImage({
  src,
  alt,
  width,
  height,
  className,
  preload = false,
}: StaticImageProps) {
  if (preload) preloadResource(src, { as: 'image', fetchPriority: 'high' });
  return (
    // oxlint-disable-next-line next/no-img-element -- a pre-sized public file, see above
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={preload ? 'eager' : 'lazy'}
      decoding="async"
      className={className}
    />
  );
}
