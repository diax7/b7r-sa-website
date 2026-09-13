import type { Metadata } from 'next';
import { testimonials } from '@/content/testimonials';
import { env } from '@/lib/env';
import { buildMetadata, CtaRibbon } from '@/modules/core';
import { DesignerSection } from '@/modules/designer';
import {
  Hero,
  HomeFaq,
  Integrations,
  ProductStrip,
  Steps,
  Testimonials,
  VideoSection,
  WhyUs,
} from '@/modules/home';
import { shouldRenderTestimonials } from '@/modules/home/testimonials/rule';

export const metadata: Metadata = buildMetadata('/');

/**
 * Home (BRD 6.4). Order and alternating tones are fixed by the BRD: hero (photo) · strip
 * surface · designer ground · steps surface · video ground · why-us surface · testimonials
 * ground · integrations surface · FAQ ground · ribbon · footer navy.
 */
export default function HomePage() {
  // When the testimonials section is omitted (production host, all placeholders, ADR-013)
  // the sections after it swap tones so the surface/ground alternation (BRD 3.4) holds.
  const withTestimonials = shouldRenderTestimonials(testimonials, env.isProductionSite);
  const integrationsTone = withTestimonials ? 'surface' : 'ground';
  const faqTone = withTestimonials ? 'ground' : 'surface';
  return (
    <>
      <Hero />
      <ProductStrip />
      <DesignerSection />
      <Steps />
      <VideoSection />
      <WhyUs />
      <Testimonials />
      <Integrations tone={integrationsTone} />
      <HomeFaq tone={faqTone} />
      <CtaRibbon topTone={faqTone} page="home" />
    </>
  );
}
