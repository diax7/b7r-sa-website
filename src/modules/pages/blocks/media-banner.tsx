import Image from 'next/image';
import { Container } from '@/components/shared/container';
import { Section } from '@/components/shared/section';
import { SectionHeader } from '@/components/shared/section-header';
import type { BlockProps } from '@/modules/pages/blocks/types';

/** A wide photo with an optional caption (BRD 9.5 block set). */
export function MediaBannerBlock({ block, tone, heading }: BlockProps<'mediaBanner'>) {
  return (
    <Section
      tone={tone}
      className={heading ? 'pt-10 md:pt-16' : undefined}
      {...(heading ? { 'aria-labelledby': 'banner-title' } : { 'aria-label': block.media.alt })}
    >
      <Container className="flex flex-col gap-8">
        {heading && (
          <SectionHeader
            as="h1"
            id="banner-title"
            title={heading.title}
            {...(heading.lead ? { lead: heading.lead } : {})}
          />
        )}
        <figure className="flex flex-col gap-3">
          <div className="relative aspect-[16/7] overflow-hidden rounded-lg bg-ground">
            <Image
              src={block.media.src}
              alt={block.media.alt}
              fill
              sizes="(min-width: 1280px) 1200px, 100vw"
              className="object-cover"
            />
          </div>
          {block.caption && (
            <figcaption className="text-small text-text-muted">{block.caption}</figcaption>
          )}
        </figure>
      </Container>
    </Section>
  );
}
