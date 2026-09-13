'use client';

import { useEffect, useState } from 'react';

/** Loads an image element for Konva; `null` until decoded, or while `src` is empty. */
export function useImage(src: string | null): HTMLImageElement | null {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!src) return undefined;
    let cancelled = false;
    const img = new Image();
    img.decoding = 'async';
    img.addEventListener(
      'load',
      () => {
        if (!cancelled) setImage(img);
      },
      { once: true },
    );
    img.addEventListener(
      'error',
      () => {
        if (!cancelled) setImage(null);
      },
      { once: true },
    );
    img.src = src;
    return () => {
      cancelled = true;
    };
  }, [src]);

  // A cleared source yields null without a state write inside the effect.
  return src ? image : null;
}
