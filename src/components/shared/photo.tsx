'use client';

import Image, { getImageProps, type ImageProps } from 'next/image';
import { preload as preloadResource } from 'react-dom';
import { blurPlaceholder } from '@/lib/image-url';
import { avifLoader, webpLoader } from '@/lib/renditions';

/**
 * `next/image`'s props minus what the renditions decide (the loader, the quality, the
 * placeholder pair) and the two preload spellings, which `preload` below replaces.
 */
type ImageRest = Omit<
  ImageProps,
  'src' | 'loader' | 'quality' | 'placeholder' | 'blurDataURL' | 'priority' | 'preload' | 'loading'
>;

export interface PhotoProps extends ImageRest {
  /** The media document's URL (`mediaUrl`), never a rendition. */
  src: string;
  /** The blur-up placeholder the library computed on upload, when the document has one. */
  blur?: string | undefined;
  /**
   * The LCP or an above-the-fold photo: a typed AVIF preload in `<head>` with the photo's
   * `fetchPriority`, and an eager `<img>`. Never with `loading`.
   */
  preload?: boolean | undefined;
  loading?: 'lazy' | 'eager' | undefined;
}

/**
 * A CMS photo (ADR-064): a `<picture>` whose AVIF `<source>` and WebP `<img>` name the
 * renditions the upload wrote to the storage CDN, one file per candidate width, so the
 * browser picks the format and the size and nothing is encoded on the way. The `<img>` is
 * `next/image` with the WebP loader, so the blur-up placeholder is in the server HTML and
 * cleared on load, and lazy loading is the default; the AVIF candidates come from the same
 * arithmetic (`getImageProps`) with the AVIF loader. A client module because a loader is a
 * function, which cannot cross the server boundary; every call site passes strings.
 *
 * `preload` calls `ReactDOM.preload` with `type: image/avif` and the caller's priority: a
 * browser without AVIF ignores a typed preload and finds the `<img>` in the markup; a WebP
 * preload beside it would make an AVIF browser fetch both. `next/image`'s own `preload` is
 * not used for that reason, and the `<img>` is eager instead.
 */
export function Photo({
  src,
  blur,
  preload = false,
  loading,
  fill,
  width,
  height,
  ...rest
}: PhotoProps) {
  // `exactOptionalPropertyTypes`: `fill`, `width` and `height` are next/image's own props and
  // take no explicit `undefined`; every img attribute in `rest` does.
  const box = fill
    ? { fill: true }
    : { ...(width ? { width } : {}), ...(height ? { height } : {}) };
  const avif = getImageProps({
    src,
    alt: rest.alt,
    sizes: rest.sizes,
    loader: avifLoader,
    ...box,
  }).props;
  if (preload) {
    preloadResource(avif.src, {
      as: 'image',
      type: 'image/avif',
      imageSrcSet: avif.srcSet,
      imageSizes: avif.sizes,
      fetchPriority: rest.fetchPriority,
    });
  }
  return (
    <picture>
      <source type="image/avif" srcSet={avif.srcSet} sizes={avif.sizes} />
      <Image
        src={src}
        loader={webpLoader}
        loading={preload ? 'eager' : loading}
        {...rest}
        {...box}
        {...blurPlaceholder(blur)}
      />
    </picture>
  );
}
