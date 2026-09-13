'use client';

import { Play } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/shared/icon';
import { track } from '@/modules/core';

interface VideoPlayerProps {
  src: string;
  poster: string;
  posterAlt: string;
  playLabel: string;
}

/**
 * Poster + play button; the `<video>` element exists only after play (BRD 6.4.5). It plays
 * with sound and native controls, no loop. Tracks `video_play` once per mount.
 */
export function VideoPlayer({ src, poster, posterAlt, playLabel }: VideoPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!playing) return;
    const v = videoRef.current;
    if (!v) return;
    // A rejected play() (autoplay policy) leaves the native controls for a second tap.
    void v.play().catch(() => undefined);
  }, [playing]);

  if (playing) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-black">
        {/* Captions are an open item for Dhia (BRD Appendix G); the element mounts only on play. */}
        {/* oxlint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          controls
          playsInline
          preload="none"
          className="h-full w-full"
          data-testid="video"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setPlaying(true);
        track('video_play', {});
      }}
      aria-label={playLabel}
      className="group relative block aspect-video w-full overflow-hidden rounded-lg border border-border bg-ground text-start focus-visible:outline-accent"
      data-testid="video-play"
    >
      <Image
        src={poster}
        alt={posterAlt}
        fill
        sizes="(min-width: 1024px) 960px, 100vw"
        className="object-cover"
      />
      <span
        aria-hidden="true"
        className="absolute inset-0 m-auto grid size-[72px] place-items-center rounded-pill bg-white text-primary shadow-popover transition-transform duration-(--duration-base) ease-(--ease-standard) group-hover:scale-105"
      >
        <Icon icon={Play} size={28} strokeWidth={2} className="ms-1 fill-current" />
      </span>
    </button>
  );
}
