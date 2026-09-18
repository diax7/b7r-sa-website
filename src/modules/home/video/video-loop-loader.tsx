'use client';

import { lazy } from 'react';
import { NearViewport } from '@/modules/core/lazy-mount';

const VideoLoop = lazy(() =>
  import('@/modules/home/video/video-loop').then((m) => ({ default: m.VideoLoop })),
);

interface VideoLoopLoaderProps {
  src: string;
  poster: string;
}

/** Keeps the loop out of the initial JS and the video out of the initial network. */
export function VideoLoopLoader(props: VideoLoopLoaderProps) {
  return (
    <NearViewport>
      <VideoLoop {...props} />
    </NearViewport>
  );
}
