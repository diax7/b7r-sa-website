import { getImageProps } from 'next/image';
import { preload } from 'react-dom';
import { copyFor } from '@/content/copy';
import type { HeroSlide } from '@/content/schema';
import { getHome, getSiteSettings } from '@/lib/cms';
import { env } from '@/lib/env';
import { type Locale, localePath } from '@/lib/i18n';
import { blurPlaceholder } from '@/lib/image-url';
import { avifLoader, webpLoader } from '@/lib/renditions';
import { registerUrl } from '@/lib/utm';
import { HeroCarousel, type HeroImage, type HeroImageSet } from '@/modules/home/hero/hero-carousel';
import { DESKTOP, DESKTOP_SIZES, MOBILE } from '@/modules/home/hero/frames';

// `priority` is deliberately not passed: it would call ReactDOM.preload() without a media
// query and fetch both frames. The media-gated <link>s below do the preloading. The blur-up
// placeholder (ADR-029) rides along as the `background-image` value Next computes for
// `placeholder="blur"`; the carousel applies it per breakpoint until the photo decodes. The
// candidates are the renditions the upload wrote (ADR-064): the WebP set is the `<img>`'s,
// the AVIF set its typed `<source>`, the same widths in both.
function frame(
  src: string,
  sizes: string,
  blur: string | undefined,
  box: { width: number; height: number },
): HeroImage {
  const webp = getImageProps({
    alt: '',
    src,
    sizes,
    loader: webpLoader,
    ...blurPlaceholder(blur),
    ...box,
  }).props;
  const avif = getImageProps({ alt: '', src, sizes, loader: avifLoader, ...box }).props;
  return {
    src: webp.src,
    srcSet: webp.srcSet,
    avifSrcSet: avif.srcSet,
    ...box,
    ...(webp.style?.backgroundImage ? { blur: webp.style.backgroundImage } : {}),
  };
}

function imageSet(slide: HeroSlide): HeroImageSet {
  return {
    desktop: frame(slide.imageDesktop, DESKTOP_SIZES, slide.blurDesktop, DESKTOP),
    mobile: frame(slide.imageMobile, '100vw', slide.blurMobile, MOBILE),
  };
}

/**
 * Server shell for the hero (BRD 6.4.1, ADR-006). Builds the responsive sources and emits
 * two media-gated, AVIF-typed preloads for slide 1 so exactly one LCP image is fetched per
 * viewport (a browser without AVIF ignores a typed preload and takes the WebP from the
 * markup); `getImageProps` alone emits none. React 19 hoists the <link>s into <head>.
 */
export async function Hero({ locale }: { locale: Locale }) {
  const [{ hero }, site] = await Promise.all([getHome(locale), getSiteSettings(locale)]);
  const messages = copyFor(locale);
  const images = hero.slides.map(imageSet);
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
            type="image/avif"
            imageSrcSet={first.desktop.avifSrcSet}
            imageSizes={DESKTOP_SIZES}
            media="(min-width: 768px)"
            fetchPriority="high"
          />
          <link
            rel="preload"
            as="image"
            type="image/avif"
            imageSrcSet={first.mobile.avifSrcSet}
            imageSizes="100vw"
            media="(max-width: 767px)"
            fetchPriority="high"
          />
        </>
      )}
      <HeroCarousel
        slides={hero.slides}
        images={images}
        overlay={hero.overlay}
        copy={{
          primaryCta: hero.primaryCta,
          primaryShiny: site.ctaShiny,
          primaryHref: registerUrl(env.appUrl, { campaign: 'hero' }),
          secondaryCta: hero.secondaryCta,
          secondaryHref: localePath(locale, '/products'),
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
