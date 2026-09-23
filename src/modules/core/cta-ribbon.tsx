import { Button } from '@/components/shared/button';
import { Container } from '@/components/shared/container';
import { getHome, getSiteSettings } from '@/lib/cms';
import { cn } from '@/lib/cn';
import { env } from '@/lib/env';
import type { Locale } from '@/lib/i18n';
import { registerUrl } from '@/lib/utm';
import { WaveDivider } from '@/modules/core/wave-divider';

interface CtaRibbonProps {
  locale: Locale;
  /** Route name for `utm_content` (BRD 4.4). */
  page: string;
}

/**
 * Full-bleed primary band before the footer on every page (BRD 6.3.1), between two waves.
 * The top wave rises from the band into the bottom of the section above: the ribbon overlaps
 * that section by the wave's height, and the strip is see-through but for the wave, so the
 * section above shows behind it whatever it paints (spec 010, phase 2: an editor may give it
 * any background set, a gradient with grain included). The navy footer rises from the bottom.
 */
export async function CtaRibbon({ locale, page }: CtaRibbonProps) {
  const [{ ribbon }, site] = await Promise.all([getHome(locale), getSiteSettings(locale)]);
  const { title, lead, button } = ribbon;
  return (
    <section
      aria-labelledby="cta-ribbon-title"
      data-cta-ribbon=""
      // Padding, not the band's margin, holds the strip open: a margin would collapse through
      // the section and cancel the overlap.
      className="relative -mt-8 pt-8 text-white md:-mt-12 md:pt-12"
    >
      <WaveDivider fill="primary" position="top" />
      <div className="bg-primary">
        <Container className="flex flex-col items-center gap-6 pt-16 pb-24 text-center md:pt-20 md:pb-32">
          <h2 id="cta-ribbon-title" className="text-h2 max-w-3xl text-white">
            {title}
          </h2>
          <p className="lead max-w-xl text-white/85">{lead}</p>
          <Button
            asChild
            variant={site.ctaShiny ? 'inverseShiny' : 'inverse'}
            size="lg"
            className={cn('mt-2', !site.ctaShiny && 'shadow-popover')}
          >
            <a
              href={registerUrl(env.appUrl, { campaign: 'ribbon', content: page })}
              data-track="cta_click"
              data-location="ribbon"
            >
              {button}
            </a>
          </Button>
        </Container>
      </div>
      <WaveDivider fill="navy" position="bottom" />
    </section>
  );
}
