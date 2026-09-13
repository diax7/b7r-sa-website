import { getImageProps } from 'next/image';
import { preload } from 'react-dom';
import { getHome } from '@/lib/cms';
import messages from '@/messages/ar.json';
import { env } from '@/lib/env';
import { registerUrl } from '@/lib/utm';
import { HeroCarousel, type HeroImageSet } from '@/modules/home/hero/hero-carousel';

const DESKTOP = { width: 1920, height: 1080 };
const MOBILE = { width: 1080, height: 1350 };

// `priority` is deliberately not passed: it would call ReactDOM.preload() without a media
// query and fetch both renditions. The media-gated <link>s below do the preloading.
function imageSet(desktopSrc: string, mobileSrc: string): HeroImageSet {
  const common = { alt: '', sizes: '100vw', quality: 82 };
  const d = getImageProps({ ...common, src: desktopSrc, ...DESKTOP }).props;
  const m = getImageProps({ ...common, src: mobileSrc, ...MOBILE }).props;
  return {
    desktop: { src: d.src, srcSet: d.srcSet, width: DESKTOP.width, height: DESKTOP.height },
    mobile: { src: m.src, srcSet: m.srcSet, width: MOBILE.width, height: MOBILE.height },
  };
}

/**
 * Server shell for the hero (BRD 6.4.1, ADR-006). Builds the responsive sources and emits
 * two media-gated preloads for slide 1 so exactly one LCP image is fetched per viewport;
 * `getImageProps` alone emits none. React 19 hoists the <link>s into <head>.
 */
export async function Hero() {
  const { hero } = await getHome();
  const images = hero.slides.map((s) => imageSet(s.imageDesktop, s.imageMobile));
  const first = images[0];

  // The H1 is the only Black-weight text; preloading it here (home only) removes a font swap
  // from the LCP path (measured: LCP fell below the 2.5 s gate, see ADR-010).
  preload('/fonts/ITFRayatRound-Black.woff2', {
    as: 'font',
    type: 'font/woff2',
    crossOrigin: 'anonymous',
  });

  return (
    <>
      {first && (
        <>
          <link
            rel="preload"
            as="image"
            href={first.desktop.src}
            imageSrcSet={first.desktop.srcSet}
            imageSizes="100vw"
            media="(min-width: 768px)"
            fetchPriority="high"
          />
          <link
            rel="preload"
            as="image"
            href={first.mobile.src}
            imageSrcSet={first.mobile.srcSet}
            imageSizes="100vw"
            media="(max-width: 767px)"
            fetchPriority="high"
          />
        </>
      )}
      <HeroCarousel
        slides={hero.slides}
        images={images}
        copy={{
          primaryCta: hero.primaryCta,
          primaryHref: registerUrl(env.appUrl, { campaign: 'hero' }),
          secondaryCta: hero.secondaryCta,
          secondaryHref: '/products',
          chips: hero.chips,
          slideIndicatorAria: messages.hero.slideIndicator.replace(
            '{total}',
            String(hero.slides.length),
          ),
          pauseAria: messages.hero.pause,
          resumeAria: messages.hero.resume,
          carouselLabel: messages.hero.carouselLabel,
        }}
      />
    </>
  );
}
