import Image from 'next/image';
import { Button } from '@/components/shared/button';
import { Container } from '@/components/shared/container';
import { Section, type SectionTone } from '@/components/shared/section';
import { copyFor } from '@/content/copy';
import { getHome } from '@/lib/cms';
import type { Locale } from '@/lib/i18n';
import { env } from '@/lib/env';
import { registerUrl } from '@/lib/utm';
import { VideoLoopLoader } from '@/modules/home/video/video-loop-loader';

export const VIDEO_SRC = '/video/printer-marketing.mp4';
export const VIDEO_POSTER = '/video/printer-marketing-poster.jpg';

/**
 * Video section (BRD 6.4.5, amended 2026-09-13, ADR-037): a full-width frame with the
 * server-rendered poster, the section copy and the register CTA over a fixed scrim (AA on
 * every frame), and a muted looping video mounted near the viewport by a small island. No
 * controls: the video is decorative, the text carries the meaning.
 */
export async function VideoSection({
  locale,
  tone = 'ground',
}: {
  locale: Locale;
  tone?: SectionTone;
}) {
  const { video, hero } = await getHome(locale);
  const posterAlt = copyFor(locale).media.videoPosterAlt;
  if (!video.enabled) return null;
  return (
    <Section id="video" tone={tone} className="py-0 md:py-0" aria-labelledby="video-title">
      <div className="relative isolate min-h-[420px] overflow-hidden md:min-h-[520px]">
        <Image src={VIDEO_POSTER} alt={posterAlt} fill sizes="100vw" className="object-cover" />
        <VideoLoopLoader src={VIDEO_SRC} poster={VIDEO_POSTER} />
        {/* Scrim: the copy stays readable whatever the frame shows. */}
        <div aria-hidden="true" className="absolute inset-0 bg-navy/60" />
        <Container className="relative flex min-h-[420px] flex-col items-center justify-center gap-6 py-16 text-center text-white md:min-h-[520px] md:py-24">
          <h2 id="video-title" className="text-h1 text-white">
            {video.title}
          </h2>
          <p className="lead max-w-[36rem] text-white/85">{video.lead}</p>
          <Button asChild size="lg">
            <a
              href={registerUrl(env.appUrl, { campaign: 'video' })}
              data-track="cta_click"
              data-location="video"
            >
              {hero.primaryCta}
            </a>
          </Button>
        </Container>
      </div>
    </Section>
  );
}
