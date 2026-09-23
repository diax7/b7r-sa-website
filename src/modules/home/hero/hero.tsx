import { getImageProps } from 'next/image';
import { preload } from 'react-dom';
import { copyFor } from '@/content/copy';
import type { HeroSlide } from '@/content/schema';
import { getHome, getSiteSettings } from '@/lib/cms';
import { env } from '@/lib/env';
import { type Locale, localePath } from '@/lib/i18n';
import { blurPlaceholder } from '@/lib/image-url';
import { PHOTO_QUALITY } from '@/lib/photo';
import { registerUrl } from '@/lib/utm';
import { HeroCarousel, type HeroImageSet } from '@/modules/home/hero/hero-carousel';
import { DESKTOP, DESKTOP_SIZES, MOBILE } from '@/modules/home/hero/renditions';

// `priority` is deliberately not passed: it would call ReactDOM.preload() without a media
// query and fetch both renditions. The media-gated <link>s below do the preloading. The
// blur-up placeholder (ADR-029) rides along as the `background-image` value Next computes
// for `placeholder="blur"`; the carousel applies it per breakpoint until the photo decodes.
function imageSet(slide: HeroSlide): HeroImageSet {
  const common = { alt: '', quality: PHOTO_QUALITY };
  const d = getImageProps({
    ...common,
    sizes: DESKTOP_SIZES,
    src: slide.imageDesktop,
    ...blurPlaceholder(slide.blurDesktop),
    ...DESKTOP,
  }).props;
  const m = getImageProps({
    ...common,
    sizes: '100vw',
    src: slide.imageMobile,
    ...blurPlaceholder(slide.blurMobile),
    ...MOBILE,
  }).props;
  return {
    desktop: {
      src: d.src,
      srcSet: d.srcSet,
      width: DESKTOP.width,
      height: DESKTOP.height,
      ...(d.style?.backgroundImage ? { blur: d.style.backgroundImage } : {}),
    },
    mobile: {
      src: m.src,
      srcSet: m.srcSet,
      width: MOBILE.width,
      height: MOBILE.height,
      ...(m.style?.backgroundImage ? { blur: m.style.backgroundImage } : {}),
    },
  };
}

/**
 * Server shell for the hero (BRD 6.4.1, ADR-006). Builds the responsive sources and emits
 * two media-gated preloads for slide 1 so exactly one LCP image is fetched per viewport;
 * `getImageProps` alone emits none. React 19 hoists the <link>s into <head>.
 */
export async function Hero({
  locale,
  displayFonts,
}: {
  locale: Locale;
  /** The display weight's font files for the chosen typeface (spec 010), from the page. */
  displayFonts: readonly string[];
}) {
  const [{ hero }, site] = await Promise.all([getHome(locale), getSiteSettings(locale)]);
  const messages = copyFor(locale);
  const images = hero.slides.map(imageSet);
  const first = images[0];

  // The H1 is the only display-weight text; preloading it here (home only) removes a font
  // swap from the LCP path (measured: LCP fell below the 2.5 s gate, see ADR-010). The file is
  // the chosen family's (spec 010); a family without a Black resolves to its heaviest.
  for (const href of displayFonts) {
    preload(href, { as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' });
  }

  return (
    <>
      {first && (
        <>
          <link
            rel="preload"
            as="image"
            href={first.desktop.src}
            imageSrcSet={first.desktop.srcSet}
            imageSizes={DESKTOP_SIZES}
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
