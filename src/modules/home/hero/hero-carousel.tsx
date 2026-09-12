'use client';

import { ArrowRight, Pause, Play } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import { Button } from '@/components/shared/button';
import { Chip } from '@/components/shared/chip';
import { Container } from '@/components/shared/container';
import { Icon } from '@/components/shared/icon';
import type { HeroSlide } from '@/content/schema';
import { cn } from '@/lib/cn';
import { useReducedMotion } from '@/lib/reduced-motion';
import { track } from '@/modules/core';

export interface HeroImageSet {
  /** Props from `getImageProps` for the desktop 16:9 rendition. */
  desktop: { src: string; srcSet: string | undefined; width: number; height: number };
  /** Props from `getImageProps` for the mobile 4:5 rendition. */
  mobile: { src: string; srcSet: string | undefined; width: number; height: number };
}

export interface HeroCarouselProps {
  slides: HeroSlide[];
  images: HeroImageSet[];
  copy: {
    primaryCta: string;
    primaryHref: string;
    secondaryCta: string;
    secondaryHref: string;
    microcopy: string;
    chips: string[];
    slideIndicatorAria: string;
    pauseAria: string;
    resumeAria: string;
    carouselLabel: string;
  };
}

const INTERVAL_MS = 6000;
const SWIPE_PX = 40;
const IDLE_MS = 3000;

/**
 * Hero carousel (BRD 6.4.1). All four slides' text is server-rendered; slide 1 owns the only
 * H1. Images crossfade 700 ms while the copy fades and rises 100 ms later; buttons and chips
 * never move. Auto-advance pauses on hover, focus and touch, and is off under reduced motion.
 * In RTL, swiping toward the start edge (right) goes forward.
 */
export function HeroCarousel({ slides, images, copy }: HeroCarouselProps) {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [othersReady, setOthersReady] = useState(false);
  // The first paint is static (the H1 is the LCP element); copy animates only on slide changes.
  const [animated, setAnimated] = useState(false);
  const pointerStart = useRef<number | null>(null);
  const total = slides.length;

  const go = useCallback(
    (next: number) => {
      setOthersReady(true);
      setAnimated(true);
      setIndex(((next % total) + total) % total);
    },
    [total],
  );

  useEffect(() => {
    if (reduced || userPaused || hovering) return;
    const id = window.setTimeout(() => go(index + 1), INTERVAL_MS);
    return () => window.clearTimeout(id);
  }, [index, reduced, userPaused, hovering, go]);

  useEffect(() => {
    const id = window.setTimeout(() => setOthersReady(true), IDLE_MS);
    return () => window.clearTimeout(id);
  }, []);

  const onPointerDown = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType === 'mouse') return;
    pointerStart.current = e.clientX;
    setHovering(true);
  };
  const onPointerUp = (e: PointerEvent<HTMLElement>) => {
    setHovering(false);
    if (pointerStart.current === null) return;
    const delta = e.clientX - pointerStart.current;
    pointerStart.current = null;
    if (Math.abs(delta) < SWIPE_PX) return;
    // RTL: a swipe toward the start edge (to the right, delta > 0) advances.
    go(delta > 0 ? index + 1 : index - 1);
  };

  return (
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- the carousel pauses on hover/focus and supports swipe (WAI-ARIA carousel pattern, BRD 6.4.1)
    <section
      className="hero relative isolate flex flex-col overflow-hidden bg-ground text-text"
      aria-roledescription="carousel"
      aria-label={copy.carouselLabel}
      onPointerEnter={() => setHovering(true)}
      onPointerLeave={() => setHovering(false)}
      onFocus={() => setHovering(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHovering(false);
      }}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        pointerStart.current = null;
        setHovering(false);
      }}
      style={{ touchAction: 'pan-y' }}
    >
      {/* Images: slide 1 is eager and preloaded (see Hero); the rest mount after first
          interaction or a 3 s idle. Both layers stay mounted so the crossfade can run. */}
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        {slides.map((slide, i) => {
          const img = images[i];
          if (!img) return null;
          const active = i === index;
          if (i !== 0 && !othersReady) return null;
          return (
            <picture
              key={slide.id}
              className={cn(
                'absolute inset-0 transition-opacity duration-(--duration-crossfade) ease-(--ease-standard)',
                active ? 'opacity-100' : 'opacity-0',
              )}
            >
              <source media="(min-width: 768px)" srcSet={img.desktop.srcSet} sizes="100vw" />
              <img
                src={img.mobile.src}
                srcSet={img.mobile.srcSet}
                sizes="100vw"
                width={img.mobile.width}
                height={img.mobile.height}
                alt=""
                decoding="async"
                loading={i === 0 ? 'eager' : 'lazy'}
                fetchPriority={i === 0 ? 'high' : 'auto'}
                className="hero-image h-full w-full"
                data-hero-image={i}
              />
            </picture>
          );
        })}
        <div className="hero-overlay absolute inset-0" />
      </div>

      <Container className="flex flex-1 flex-col justify-start pt-[6svh] pb-24 md:pb-28 lg:justify-center lg:pt-0 lg:pb-32">
        <div className="flex max-w-[560px] flex-col items-start gap-8 lg:mb-[6vh]">
          {/* Stack all four copies in one grid cell so the tallest fixes the height. */}
          <div className="grid w-full">
            {slides.map((slide, i) => {
              const active = i === index;
              const Heading = i === 0 ? 'h1' : 'p';
              return (
                <div
                  key={slide.id}
                  className={cn(
                    'col-start-1 row-start-1 flex flex-col gap-4',
                    !active && 'invisible',
                  )}
                  aria-hidden={!active}
                  data-slide={i}
                  data-active={active || undefined}
                >
                  <Heading
                    key={`${slide.id}-${active}`}
                    className={cn(
                      'display text-text',
                      active && animated && 'animate-rise-in motion-reduce:animate-none',
                    )}
                    style={{ animationDelay: '100ms' }}
                  >
                    {slide.headline}
                  </Heading>
                  <p
                    key={`${slide.id}-sub-${active}`}
                    className={cn(
                      'lead text-text-muted',
                      active && animated && 'animate-rise-in motion-reduce:animate-none',
                    )}
                    style={{ animationDelay: '160ms' }}
                  >
                    {slide.subline}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="flex w-full flex-col gap-3">
            <div className="flex w-full flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:gap-6">
              <Button asChild size="lg" className="shadow-card-hover">
                <a
                  href={copy.primaryHref}
                  data-track="cta_click"
                  data-location="hero"
                  onClick={() => track('cta_click', { location: 'hero' })}
                >
                  {copy.primaryCta}
                </a>
              </Button>
              <Link
                href={copy.secondaryHref}
                className="inline-flex items-center justify-center gap-2 py-2 text-body font-medium text-primary transition-colors duration-(--duration-fast) hover:text-primary-hover sm:justify-start"
              >
                {copy.secondaryCta}
                <Icon icon={ArrowRight} size={18} />
              </Link>
            </div>
            <p className="text-small text-text-muted">{copy.microcopy}</p>
          </div>

          <ul
            className="no-scrollbar -mx-4 flex w-[calc(100%+32px)] snap-x snap-mandatory gap-2 overflow-x-auto px-4 sm:mx-0 sm:w-auto sm:flex-wrap sm:px-0"
            // The row scrolls horizontally on phones; axe (scrollable-region-focusable) requires a
            // keyboard-reachable scroller, which jsx-a11y cannot see.
            // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex
            tabIndex={0}
          >
            {copy.chips.map((chip) => (
              <li key={chip} className="shrink-0 snap-start whitespace-nowrap">
                <Chip check>{chip}</Chip>
              </li>
            ))}
          </ul>
        </div>
      </Container>

      <div className="absolute inset-x-0 bottom-6 flex items-center justify-center gap-3 md:justify-start md:ps-6">
        <ul className="flex items-center gap-2" aria-label={copy.carouselLabel}>
          {slides.map((slide, i) => {
            const active = i === index;
            return (
              <li key={slide.id}>
                <button
                  type="button"
                  aria-label={copy.slideIndicatorAria.replace('{n}', String(i + 1))}
                  aria-current={active ? 'true' : undefined}
                  onClick={() => go(i)}
                  className="grid h-11 w-8 place-items-center"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'block h-2 rounded-pill transition-[width,background-color,opacity] duration-(--duration-base) ease-(--ease-standard)',
                      active ? 'w-6 bg-primary' : 'w-2 bg-primary/40',
                    )}
                  />
                </button>
              </li>
            );
          })}
        </ul>
        <button
          type="button"
          onClick={() => setUserPaused((p) => !p)}
          aria-label={userPaused ? copy.resumeAria : copy.pauseAria}
          aria-pressed={userPaused}
          className="grid size-11 place-items-center rounded-pill text-primary transition-colors duration-(--duration-fast) hover:bg-accent-tint"
        >
          <Icon icon={userPaused ? Play : Pause} size={18} />
        </button>
      </div>
    </section>
  );
}
