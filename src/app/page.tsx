import type { Metadata } from 'next';
import { home } from '@/content/home';
import { buildMetadata, CtaRibbon, PlaceholderSection } from '@/modules/core';
import { DesignerSection } from '@/modules/designer';
import { Hero, ProductStrip } from '@/modules/home';

export const metadata: Metadata = buildMetadata('/');

/** Home (BRD 6.4). Section order and alternating tones are fixed by the BRD. */
export default function HomePage() {
  return (
    <>
      <Hero />
      <ProductStrip />
      <DesignerSection />
      <PlaceholderSection
        id="steps"
        eyebrow={home.steps.eyebrow}
        title={home.steps.title}
        tone="surface"
      />
      <PlaceholderSection id="video" title={home.video.title} tone="ground" />
      <PlaceholderSection
        id="why-us"
        eyebrow={home.whyUs.eyebrow}
        title={home.whyUs.title}
        tone="surface"
      />
      <PlaceholderSection
        id="testimonials"
        eyebrow={home.testimonials.eyebrow}
        title={home.testimonials.title}
        tone="ground"
      />
      <PlaceholderSection id="integrations" title={home.integrations.title} tone="surface" />
      <PlaceholderSection id="faq" title={home.faq.title} tone="ground" />
      <CtaRibbon topTone="ground" page="home" />
    </>
  );
}
