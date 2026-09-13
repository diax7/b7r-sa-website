'use client';

import { useEffect, useRef, useState } from 'react';

interface VideoLoopProps {
  src: string;
  poster: string;
}

/**
 * The muted marketing loop (BRD 6.4.5, amended 2026-09-13, ADR-037). Mounted near the
 * viewport, it lays a `<video>` over the server-rendered poster and starts it with `muted`
 * set as a property (React omits the attribute in server HTML, and browsers refuse to
 * autoplay sound). Under `prefers-reduced-motion`, with Save-Data on, or when `play()` is
 * refused, it renders nothing and the poster stays. Decorative: the copy over it carries
 * the meaning.
 */
export function VideoLoop({ src, poster }: VideoLoopProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const [enabled, setEnabled] = useState(() => {
    if (typeof window === 'undefined') return false;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saveData = Boolean(
      (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData,
    );
    return !reduced && !saveData;
  });

  useEffect(() => {
    const video = ref.current;
    if (!enabled || !video) return;
    video.muted = true;
    video.defaultMuted = true;
    const attempt = video.play();
    if (attempt) attempt.catch(() => setEnabled(false));
  }, [enabled]);

  if (!enabled) return null;
  return (
    // oxlint-disable-next-line jsx-a11y/media-has-caption -- muted, decorative and aria-hidden: no audio to caption (WCAG 1.2.2 does not apply); the copy over it carries the meaning
    <video
      ref={ref}
      src={src}
      poster={poster}
      loop
      playsInline
      preload="none"
      aria-hidden="true"
      tabIndex={-1}
      className="absolute inset-0 size-full object-cover"
      data-testid="video"
    />
  );
}
