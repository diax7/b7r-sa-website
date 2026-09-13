import { Eye, Heart, MapPin, Target, type LucideIcon } from 'lucide-react';
import Image from 'next/image';
import { Card } from '@/components/shared/card';
import { Container } from '@/components/shared/container';
import { Icon } from '@/components/shared/icon';
import { Reveal } from '@/components/shared/reveal';
import { Section } from '@/components/shared/section';
import { aboutPage, productsPage } from '@/content/pages';
import { getSeo } from '@/lib/cms';
import { siteBase } from '@/lib/env';
import { CtaRibbon, JsonLd, jsonLd } from '@/modules/core';

const ROUTE = '/about';
const ICONS: Record<string, LucideIcon> = { Target, Eye, Heart };

/** About (BRD 6.8, 4.10). */
export async function AboutPage() {
  const copy = aboutPage;
  const base = siteBase();
  const seo = await getSeo(ROUTE);

  return (
    <>
      <JsonLd
        nodes={[
          jsonLd.webPage(base, ROUTE, seo.title, seo.description),
          jsonLd.breadcrumbs(base, [
            { name: productsPage.breadcrumbHome, path: '/' },
            { name: copy.title, path: ROUTE },
          ]),
        ]}
      />

      <Section tone="surface" className="pt-10 md:pt-16" aria-labelledby="about-title">
        <Container className="flex flex-col gap-12">
          <h1 id="about-title" className="text-h1 text-text">
            {copy.title}
          </h1>
          <div className="flex max-w-(--container-prose) flex-col gap-4">
            <h2 className="text-h2 text-text">{copy.storyTitle}</h2>
            <p className="lead text-text-muted">{copy.story}</p>
          </div>
          {/* Decorative banner (BRD 6.8): one lifestyle image, 21:9, radius 20. */}
          <div className="relative aspect-[21/9] overflow-hidden rounded-lg bg-ground">
            <Image
              src="/images/lifestyle/hanging-tshirt-mockup.jpg"
              alt=""
              fill
              sizes="(min-width: 1280px) 1232px, 100vw"
              className="object-cover"
            />
          </div>
        </Container>
      </Section>

      <Section tone="ground" aria-label={copy.cards.map((c) => c.title).join('، ')}>
        <Container>
          <ul className="grid gap-6 md:grid-cols-3">
            {copy.cards.map((card, i) => {
              const Lucide = ICONS[card.icon] ?? Target;
              return (
                <Reveal as="li" key={card.title} index={i} className="h-full">
                  <Card className="flex h-full flex-col gap-4 p-6">
                    <span className="grid size-12 place-items-center rounded-pill bg-accent-tint text-primary">
                      <Icon icon={Lucide} size={24} />
                    </span>
                    <h2 className="text-h4 text-text">{card.title}</h2>
                    <p className="text-body text-text-muted">{card.text}</p>
                  </Card>
                </Reveal>
              );
            })}
          </ul>
        </Container>
      </Section>

      <Section tone="surface" aria-labelledby="misk-title">
        <Container className="flex flex-col gap-8">
          <Card className="flex flex-col items-center gap-6 p-6 text-center md:flex-row md:items-center md:gap-10 md:p-8 md:text-start">
            <div className="grid w-[200px] shrink-0 place-items-center rounded-base bg-surface p-4">
              <Image
                src="/images/badges/misk-foundation-logo.png"
                alt="Misk Foundation"
                width={400}
                height={230}
                className="h-auto w-[168px]"
              />
            </div>
            <div className="flex flex-col gap-3">
              <h2 id="misk-title" className="text-h3 text-text">
                {copy.miskTitle}
              </h2>
              <p className="text-body text-text-muted">{copy.miskText}</p>
            </div>
          </Card>
          <p className="flex items-center gap-2 text-body text-text">
            <Icon icon={MapPin} size={20} className="text-primary" />
            {copy.locationLine}
          </p>
        </Container>
      </Section>

      <CtaRibbon topTone="surface" page="about" />
    </>
  );
}
