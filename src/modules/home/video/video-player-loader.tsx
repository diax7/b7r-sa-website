'use client';

import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';
import { NearViewport } from '@/modules/core';

const VideoPlayer = dynamic(
  () => import('@/modules/home/video/video-player').then((m) => m.VideoPlayer),
  {
    ssr: false,
  },
);

interface VideoPlayerLoaderProps {
  src: string;
  poster: string;
  posterAlt: string;
  playLabel: string;
  fallback: ReactNode;
}

/** Keeps the player chunk out of the initial JS; the poster is server-rendered meanwhile. */
export function VideoPlayerLoader({ fallback, ...props }: VideoPlayerLoaderProps) {
  return (
    <NearViewport fallback={fallback}>
      <VideoPlayer {...props} />
    </NearViewport>
  );
}
