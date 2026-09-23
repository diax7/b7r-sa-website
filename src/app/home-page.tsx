import { env, siteBase } from '@/lib/env';
import { getHome, getSiteSettings, getTestimonials } from '@/lib/cms';
import type { Locale } from '@/lib/i18n';
import { getAppearance, preloadsFor } from '@/modules/brand';
import { JsonLd, jsonLd } from '@/modules/core';
import { CtaRibbon } from '@/modules/core/cta-ribbon';
import { DesignerSection } from '@/modules/designer';
import {
  alternateTones,
  Hero,
  HomeFaq,
  Integrations,
  ProductStrip,
  sectionTones,
  shouldRenderTestimonials,
  Steps,
  Testimonials,
  VideoSection,
  WhyUs,
} from '@/modules/home';

/**
 * Home (BRD 6.4), per locale. Order and alternating tones are fixed by the BRD: hero (photo)
 * · strip surface · designer ground · steps surface · video ground · why-us surface ·
 * testimonials ground · integrations surface · FAQ ground · ribbon · footer navy. A section
 * switched off in the admin (or the testimonials omitted on the production host while every
 * entry is a placeholder, ADR-013) drops out and the sections after it swap tones so the
 * alternation (BRD 3.4) holds. A section an editor gave a background set paints that set
 * instead (spec 010, phase 2). The two locale routes render this with their locale.
 */
export async function HomePage({ locale }: { locale: Locale }) {
  const [site, home, testimonials, appearance] = await Promise.all([
    getSiteSettings(locale),
    getHome(locale),
    getTestimonials(locale),
    getAppearance(),
  ]);
  // The strip is surface and the designer ground; each rendered section after them takes the
  // opposite tone of the previous one. A background set an editor picked replaces a section's
  // designed tone (spec 010, phase 2).
  const tones = sectionTones(
    {
      productStrip: 'surface',
      designer: 'ground',
      ...alternateTones(
        {
          steps: home.steps.enabled,
          video: home.video.enabled,
          whyUs: home.whyUs.enabled,
          testimonials:
            home.testimonials.enabled &&
            shouldRenderTestimonials(testimonials, env.isProductionSite),
          integrations: home.integrations.enabled,
          faq: home.faq.enabled,
        },
        'ground',
      ),
    },
    home.backgrounds,
  );
  const base = siteBase();
  return (
    <>
      <JsonLd nodes={[jsonLd.onlineStore(base, site), jsonLd.webSite(base, site)]} />
      <Hero locale={locale} displayFonts={preloadsFor(appearance.typeface, [900])} />
      <ProductStrip locale={locale} tone={tones.productStrip} />
      <DesignerSection locale={locale} tone={tones.designer} />
      <Steps locale={locale} tone={tones.steps} />
      <VideoSection locale={locale} tone={tones.video} />
      <WhyUs locale={locale} tone={tones.whyUs} />
      <Testimonials locale={locale} tone={tones.testimonials} />
      <Integrations locale={locale} tone={tones.integrations} />
      <HomeFaq locale={locale} tone={tones.faq} />
      <CtaRibbon locale={locale} page="home" />
    </>
  );
}
