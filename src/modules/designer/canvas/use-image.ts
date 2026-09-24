'use client';

import { useEffect, useState } from 'react';
import { cachedMockup, loadMockup } from '@/modules/designer/canvas/mockup-image';

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

/**
 * The mockup for a colour's front photo (ADR-064): the element from the module cache at
 * once when the preload has it, otherwise `null` until its `<picture>` load resolves. The
 * state remembers which source it loaded, so a switch to an uncached product never draws
 * the previous one while the new one is on its way.
 */
export function useMockup(src: string): HTMLImageElement | null {
  const [arrived, setArrived] = useState<{ src: string; image: HTMLImageElement } | null>(null);

  useEffect(() => {
    if (cachedMockup(src)) return undefined;
    let cancelled = false;
    loadMockup(src)
      .then((image) => {
        if (!cancelled) setArrived({ src, image });
      })
      .catch(() => {
        if (!cancelled) setArrived(null);
      });
    return () => {
      cancelled = true;
    };
  }, [src]);

  return cachedMockup(src) ?? (arrived?.src === src ? arrived.image : null);
}
