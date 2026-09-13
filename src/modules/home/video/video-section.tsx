import Image from 'next/image';
import { Play } from 'lucide-react';
import { Container } from '@/components/shared/container';
import { Icon } from '@/components/shared/icon';
import { Section } from '@/components/shared/section';
import { SectionHeader } from '@/components/shared/section-header';
import { home } from '@/content/home';
import { VideoPlayerLoader } from '@/modules/home/video/video-player-loader';

export const VIDEO_SRC = '/video/printer-marketing.mp4';
export const VIDEO_POSTER = '/video/printer-marketing-poster.jpg';
const POSTER_ALT = 'طابعة رقمية تطبع تصميماً على تيشيرت أسود';

/**
 * Video section (BRD 6.4.5): centred header, 16:9 frame with a poster and a 72 px play
 * button; the `<video>` mounts only after the visitor presses play (no autoplay, no loop).
 */
export function VideoSection() {
  const { video } = home;
  const poster = (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-ground">
      <Image
        src={VIDEO_POSTER}
        alt={POSTER_ALT}
        fill
        sizes="(min-width: 1024px) 960px, 100vw"
        className="object-cover"
      />
      <span
        aria-hidden="true"
        className="absolute inset-0 m-auto grid size-[72px] place-items-center rounded-pill bg-white text-primary shadow-popover"
      >
        <Icon icon={Play} size={28} strokeWidth={2} className="ms-1 fill-current" />
      </span>
    </div>
  );

  return (
    <Section id="video" tone="ground" aria-labelledby="video-title">
      <Container className="flex flex-col items-center gap-10">
        <SectionHeader id="video-title" title={video.title} lead={video.lead} align="center" />
        <div className="w-full max-w-[960px]">
          <VideoPlayerLoader
            src={VIDEO_SRC}
            poster={VIDEO_POSTER}
            posterAlt={POSTER_ALT}
            playLabel={video.playAria}
            fallback={poster}
          />
        </div>
      </Container>
    </Section>
  );
}
