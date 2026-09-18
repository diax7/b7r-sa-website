import { MapPin } from 'lucide-react';
import Image from 'next/image';
import { Container } from '@/components/shared/container';
import { Icon } from '@/components/shared/icon';
import { SarAmount } from '@/components/shared/sar-amount';
import { Section } from '@/components/shared/section';
import { getHome, getSiteSettings } from '@/lib/cms';
import type { BlockProps } from '@/modules/pages/blocks/types';

/**
 * The story (BRD 6.8, amended 2026-09-13): the brand photo beside the text, the page title
 * as H1 when this is the first block, with the delivery origin as a chip over the photo,
 * then the facts band built from the home page (welcome credit + the why-us pairs).
 */
export async function StoryBlock({ block, locale, tone, anchor, heading }: BlockProps<'story'>) {
  const [site, home] = await Promise.all([getSiteSettings(locale), getHome(locale)]);
  return (
    <>
      <Section
        tone={tone}
        className={heading ? 'pt-10 md:pt-16' : undefined}
        aria-labelledby={`${anchor}-title`}
        data-block="story"
      >
        <Container className="grid items-center gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div className="flex flex-col gap-6">
            {heading && (
              <h1 id="page-title" className="text-h1 text-text">
                {heading.title}
              </h1>
            )}
            <h2 id={`${anchor}-title`} className="text-h2 text-text">
              {block.heading}
            </h2>
            <p className="lead text-text-muted">{block.text}</p>
            <p className="flex items-center gap-2 text-body font-medium text-text">
              <Icon icon={MapPin} size={20} className="text-primary" />
              {block.line}
            </p>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-ground lg:aspect-[5/4]">
            {/* Decorative: the story carries the meaning; the photo is the LCP element. */}
            <Image
              src={block.photo.src}
              alt=""
              fill
              priority
              fetchPriority="high"
              sizes="(min-width: 1024px) 640px, 100vw"
              className="object-cover"
            />
            <span className="absolute bottom-4 start-4 inline-flex items-center gap-2 rounded-pill bg-navy/80 px-4 py-2 text-small font-medium text-white backdrop-blur-sm">
              <Icon icon={MapPin} size={16} />
              {site.delivery.origin}
            </span>
          </div>
        </Container>
      </Section>

      {block.withFacts && (
        <section className="bg-navy text-white" aria-label={home.whyUs.title} data-facts-band="">
          <Container
            data-reveal-stagger=""
            className="grid gap-6 py-10 sm:grid-cols-2 lg:grid-cols-4 lg:py-12"
          >
            <div className="flex flex-col gap-1">
              <SarAmount value={site.offer.welcomeCredit} className="text-h2 text-white" />
              <span className="text-small text-white/75">{home.hero.microcopy}</span>
            </div>
            {home.whyUs.items.map((fact) => (
              <div key={fact.title} className="flex flex-col gap-1">
                <span className="text-h4 text-white">{fact.title}</span>
                <span className="text-small text-white/75">{fact.text}</span>
              </div>
            ))}
          </Container>
        </section>
      )}
    </>
  );
}
