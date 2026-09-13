import type { Metadata } from 'next';
import { env, siteBase } from '@/lib/env';
import { getHome, getSiteSettings, getTestimonials } from '@/lib/cms';
import { JsonLd, jsonLd } from '@/modules/core';
import { CtaRibbon } from '@/modules/core/cta-ribbon';
import { buildMetadata } from '@/modules/core/seo/metadata';
import { DesignerSection } from '@/modules/designer';
import {
  alternateTones,
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
 * ground · integrations surface · FAQ ground · ribbon · footer navy. A section switched off
 * in the admin (or the testimonials omitted on the production host while every entry is a
 * placeholder, ADR-013) drops out and the sections after it swap tones so the alternation
 * (BRD 3.4) holds.
 */
export default async function HomePage() {
  const [site, home, testimonials] = await Promise.all([
    getSiteSettings(),
    getHome(),
    getTestimonials(),
  ]);
  // The designer is ground; each rendered section after it takes the opposite tone of the
  // previous one, and the ribbon's top wave follows the last section that rendered.
  const tones = alternateTones(
    {
      steps: home.steps.enabled,
      video: home.video.enabled,
      whyUs: home.whyUs.enabled,
      testimonials:
        home.testimonials.enabled && shouldRenderTestimonials(testimonials, env.isProductionSite),
      integrations: home.integrations.enabled,
      faq: home.faq.enabled,
    },
    'ground',
  );
  const base = siteBase();
  return (
    <>
      <JsonLd nodes={[jsonLd.onlineStore(base, site), jsonLd.webSite(base, site)]} />
      <Hero />
      <ProductStrip />
      <DesignerSection />
      <Steps tone={tones.steps} />
      <VideoSection tone={tones.video} />
      <WhyUs tone={tones.whyUs} />
      <Testimonials tone={tones.testimonials} />
      <Integrations tone={tones.integrations} />
      <HomeFaq tone={tones.faq} />
      <CtaRibbon topTone={tones.faq} page="home" />
    </>
  );
}
