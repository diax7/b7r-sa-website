import type { Metadata } from 'next';
import { testimonials } from '@/content/testimonials';
import { env, siteBase } from '@/lib/env';
import { getSiteSettings } from '@/lib/cms';
import { CtaRibbon, JsonLd, jsonLd } from '@/modules/core';
import { buildMetadata } from '@/modules/core/seo/metadata';
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

export const generateMetadata = (): Promise<Metadata> => buildMetadata('/');

/**
 * Home (BRD 6.4). Order and alternating tones are fixed by the BRD: hero (photo) · strip
 * surface · designer ground · steps surface · video ground · why-us surface · testimonials
 * ground · integrations surface · FAQ ground · ribbon · footer navy.
 */
export default async function HomePage() {
  const site = await getSiteSettings();
  // When the testimonials section is omitted (production host, all placeholders, ADR-013)
  // the sections after it swap tones so the surface/ground alternation (BRD 3.4) holds.
  const withTestimonials = shouldRenderTestimonials(testimonials, env.isProductionSite);
  const integrationsTone = withTestimonials ? 'surface' : 'ground';
  const faqTone = withTestimonials ? 'ground' : 'surface';
  const base = siteBase();
  return (
    <>
      <JsonLd nodes={[jsonLd.onlineStore(base, site), jsonLd.webSite(base, site)]} />
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
