'use client';

import { useEffect, useState } from 'react';

/** Loads an image element for Konva; `null` until decoded (no `use-image` dependency). */
export function useImage(src: string): HTMLImageElement | null {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
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
