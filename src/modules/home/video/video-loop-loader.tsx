'use client';

import dynamic from 'next/dynamic';
import { NearViewport } from '@/modules/core';

const VideoLoop = dynamic(
  () => import('@/modules/home/video/video-loop').then((m) => m.VideoLoop),
  { ssr: false },
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
