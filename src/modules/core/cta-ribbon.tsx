import { Button } from '@/components/shared/button';
import { Container } from '@/components/shared/container';
import { home } from '@/content/home';
import { env } from '@/lib/env';
import { registerUrl } from '@/lib/utm';
import { WaveDivider, type WaveFill } from '@/modules/core/wave-divider';

interface CtaRibbonProps {
  /** Background of the section directly above, so the top wave blends into it. */
  topTone: Extract<WaveFill, 'surface' | 'ground'>;
  /** Route name for `utm_content` (BRD 4.4). */
  page: string;
}

/**
 * Full-bleed primary band before the footer on every page (BRD 6.3.1). Sits between two
 * waves: the section above flows in from the top, the navy footer rises from the bottom.
 */
export function CtaRibbon({ topTone, page }: CtaRibbonProps) {
  const { title, lead, button } = home.ribbon;
  return (
    <section aria-labelledby="cta-ribbon-title" className="relative bg-primary text-white">
      <WaveDivider fill={topTone} position="top" />
      <Container className="flex flex-col items-center gap-6 py-24 text-center md:py-32">
        <h2 id="cta-ribbon-title" className="text-h2 max-w-3xl text-white">
          {title}
        </h2>
        <p className="lead max-w-xl text-white/85">{lead}</p>
        <Button asChild variant="inverse" size="lg" className="mt-2 shadow-popover">
          <a
            href={registerUrl(env.appUrl, { campaign: 'ribbon', content: page })}
            data-track="cta_click"
            data-location="ribbon"
          >
            {button}
          </a>
        </Button>
      </Container>
      <WaveDivider fill="navy" position="bottom" />
    </section>
  );
}
