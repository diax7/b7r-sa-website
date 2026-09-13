import { Eye, Heart, MapPin, Target, type LucideIcon } from 'lucide-react';
import Image from 'next/image';
import { Card } from '@/components/shared/card';
import { Container } from '@/components/shared/container';
import { Icon } from '@/components/shared/icon';
import { Reveal } from '@/components/shared/reveal';
import { SarAmount } from '@/components/shared/sar-amount';
import { Section } from '@/components/shared/section';
import { home } from '@/content/home';
import { aboutPage, productsPage } from '@/content/pages';
import { whyUs } from '@/content/why-us';
import { getSeo, getSiteSettings } from '@/lib/cms';
import { siteBase } from '@/lib/env';
import { CtaRibbon, JsonLd, jsonLd } from '@/modules/core';

const ROUTE = '/about';
const ICONS: Record<string, LucideIcon> = { Target, Eye, Heart };
/** The 3D icons that illustrate رسالتنا / رؤيتنا / قيمنا, in card order. */
const CARD_ART = [
  '/images/icons-3d/tee-plus-create-product.jpg',
  '/images/icons-3d/box-of-products.jpg',
  '/images/icons-3d/printer-print.jpg',
];

/**
 * About (BRD 6.8, amended 2026-09-13): the brand photo beside the story, a facts band built
 * from strings the site already carries (the hero proof chips and the welcome credit), the
 * three value cards with 3D art, the MISK credential on a tinted card, then the ribbon.
 */
export async function AboutPage() {
  const copy = aboutPage;
  const base = siteBase();
  const [seo, site] = await Promise.all([getSeo(ROUTE), getSiteSettings()]);
  const facts = [
    { text: home.hero.chips[0] ?? '', detail: whyUs[0]?.text ?? '' },
    { text: home.hero.chips[1] ?? '', detail: whyUs[1]?.text ?? '' },
    { text: home.hero.chips[2] ?? '', detail: whyUs[2]?.text ?? '' },
  ];

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

      {/* Story: the Jeddah tee beside the text; the photo is the LCP element. */}
      <Section tone="surface" className="pt-10 md:pt-16" aria-labelledby="about-title">
        <Container className="grid items-center gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div className="flex flex-col gap-6">
            <h1 id="about-title" className="text-h1 text-text">
              {copy.title}
            </h1>
            <h2 className="text-h2 text-text">{copy.storyTitle}</h2>
            <p className="lead text-text-muted">{copy.story}</p>
            <p className="flex items-center gap-2 text-body font-medium text-text">
              <Icon icon={MapPin} size={20} className="text-primary" />
              {copy.locationLine}
            </p>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-ground lg:aspect-[5/4]">
            <Image
              src="/images/lifestyle/hanging-tshirt-mockup.jpg"
              alt=""
              fill
              priority
              sizes="(min-width: 1024px) 640px, 100vw"
              className="object-cover"
            />
            {/* Overlapping credit chip: the brand's home, printed on the product itself. */}
            <span className="absolute bottom-4 start-4 inline-flex items-center gap-2 rounded-pill bg-navy/80 px-4 py-2 text-small font-medium text-white backdrop-blur-sm">
              <Icon icon={MapPin} size={16} />
              {site.delivery.origin}
            </span>
          </div>
        </Container>
      </Section>

      {/* Facts band: the proof the hero already makes, as a navy strip. */}
      <section className="bg-navy text-white" aria-label={home.hero.microcopy}>
        <Container className="grid gap-6 py-10 sm:grid-cols-2 lg:grid-cols-4 lg:py-12">
          <div className="flex flex-col gap-1">
            <SarAmount value={site.offer.welcomeCredit} className="text-h2 text-white" />
            <span className="text-small text-white/75">{home.hero.microcopy}</span>
          </div>
          {facts.map((fact) => (
            <div key={fact.text} className="flex flex-col gap-1">
              <span className="text-h4 text-white">{fact.text}</span>
              <span className="text-small text-white/75">{fact.detail}</span>
            </div>
          ))}
        </Container>
      </section>

      <Section tone="ground" aria-label={copy.cards.map((c) => c.title).join('، ')}>
        <Container>
          <ul className="grid gap-6 md:grid-cols-3">
            {copy.cards.map((card, i) => {
              const Lucide = ICONS[card.icon] ?? Target;
              return (
                <Reveal
                  as="li"
                  key={card.title}
                  index={i}
                  className={i === 1 ? 'h-full md:translate-y-6' : 'h-full'}
                >
                  <Card className="flex h-full flex-col overflow-hidden">
                    <div className="relative aspect-[16/9] bg-ground">
                      <Image
                        src={CARD_ART[i] ?? CARD_ART[0]!}
                        alt=""
                        fill
                        sizes="(min-width: 768px) 400px, 100vw"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col gap-3 p-6">
                      <span className="grid size-11 place-items-center rounded-pill bg-accent-tint text-primary">
                        <Icon icon={Lucide} size={22} />
                      </span>
                      <h2 className="text-h4 text-text">{card.title}</h2>
                      <p className="text-body text-text-muted">{card.text}</p>
                    </div>
                  </Card>
                </Reveal>
              );
            })}
          </ul>
        </Container>
      </Section>

      <Section tone="surface" aria-labelledby="misk-title">
        <Container>
          <div className="grid items-center gap-8 rounded-lg bg-accent-tint p-6 md:grid-cols-[240px_1fr] md:gap-12 md:p-10">
            <div className="grid place-items-center rounded-base bg-surface p-5 shadow-card">
              <Image
                src="/images/badges/misk-foundation-logo.png"
                alt="Misk Foundation"
                width={400}
                height={230}
                className="h-auto w-[180px]"
              />
            </div>
            <div className="flex flex-col gap-3">
              <h2 id="misk-title" className="text-h3 text-text">
                {copy.miskTitle}
              </h2>
              <p className="text-body text-text-muted">{copy.miskText}</p>
            </div>
          </div>
        </Container>
      </Section>

      <CtaRibbon topTone="surface" page="about" />
    </>
  );
}
