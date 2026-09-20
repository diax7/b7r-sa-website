'use client';

import Image, { getImageProps } from 'next/image';
import type { CSSProperties, SyntheticEvent } from 'react';
import { preload as preloadResource } from 'react-dom';
import { blurPlaceholder } from '@/lib/image-url';
import { avifLoader, webpLoader } from '@/lib/renditions';

export interface PhotoProps {
  /** The media document's URL (`mediaUrl`), never a rendition. */
  src: string;
  alt: string;
  /** The `sizes` the box takes; the candidates are the ladder (ADR-064). */
  sizes?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  style?: CSSProperties;
  /** The blur-up placeholder the library computed on upload, when the document has one. */
  blur?: string | undefined;
  /**
   * The LCP or an above-the-fold photo: a typed AVIF preload in `<head>` with this priority
   * and an eager `<img>`. Never with `loading`.
   */
  preload?: boolean;
  fetchPriority?: 'high' | 'low' | 'auto';
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'sync' | 'auto';
  onLoad?: (event: SyntheticEvent<HTMLImageElement>) => void;
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
  alt,
  sizes,
  fill,
  width,
  height,
  className,
  style,
  blur,
  preload = false,
  fetchPriority,
  loading,
  decoding,
  onLoad,
}: PhotoProps) {
  // `exactOptionalPropertyTypes`: an absent prop stays absent rather than `undefined`.
  const box = fill
    ? { fill: true }
    : { ...(width ? { width } : {}), ...(height ? { height } : {}) };
  const avif = getImageProps({
    src,
    alt,
    ...(sizes ? { sizes } : {}),
    loader: avifLoader,
    ...box,
  }).props;
  if (preload) {
    preloadResource(avif.src, {
      as: 'image',
      type: 'image/avif',
      ...(avif.srcSet ? { imageSrcSet: avif.srcSet } : {}),
      ...(avif.sizes ? { imageSizes: avif.sizes } : {}),
      ...(fetchPriority ? { fetchPriority } : {}),
    });
  }
  const img = {
    ...(sizes ? { sizes } : {}),
    ...(className ? { className } : {}),
    ...(style ? { style } : {}),
    ...(fetchPriority ? { fetchPriority } : {}),
    ...(decoding ? { decoding } : {}),
    ...(onLoad ? { onLoad } : {}),
    ...(preload ? { loading: 'eager' as const } : loading ? { loading } : {}),
    ...box,
    ...blurPlaceholder(blur),
  };
  return (
    <picture>
      <source type="image/avif" srcSet={avif.srcSet} sizes={avif.sizes} />
      <Image src={src} alt={alt} loader={webpLoader} {...img} />
    </picture>
  );
}
