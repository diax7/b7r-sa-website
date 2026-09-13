'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useId, useMemo, useState, type KeyboardEvent } from 'react';
import { ColorPicker } from '@/components/shared/color-picker';
import { Icon } from '@/components/shared/icon';
import type { ProductColor } from '@/content/schema';
import { cn } from '@/lib/cn';

export interface GalleryCopy {
  label: string;
  thumbnails: string;
  previous: string;
  next: string;
  front: string;
  back: string;
  colorLabel: string;
  /** "اللون {colour}" */
  colorOptionAria: string;
  /** "صورة {n} من {total}" */
  counter: string;
}

interface GalleryProps {
  productName: string;
  colors: ProductColor[];
  copy: GalleryCopy;
}

interface Slide {
  color: ProductColor;
  view: 'front' | 'back';
  src: string;
}

/**
 * Product gallery (BRD 6.6): 1:1 main image with thumbnails for front/back of every colour;
 * swatches jump to that colour's front; previous/next buttons and ArrowLeft/ArrowRight (on
 * any of the gallery's buttons) walk the flat list in reading direction (RTL: from the right,
 * BRD 3.12.4). The counter is a polite live region so keyboard moves are announced.
 */
export function Gallery({ productName, colors, copy }: GalleryProps) {
  const id = useId();
  const slides = useMemo<Slide[]>(
    () =>
      colors.flatMap((color) => {
        const list: Slide[] = [{ color, view: 'front', src: color.images.front }];
        if (color.images.back) list.push({ color, view: 'back', src: color.images.back });
        return list;
      }),
    [colors],
  );
  const [index, setIndex] = useState(0);
  const current = slides[index] ?? slides[0];
  if (!current) return null;

  const move = (delta: number) => setIndex((i) => (i + delta + slides.length) % slides.length);
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    // In RTL the "next" image sits to the left, so ArrowLeft advances (BRD 3.12.4).
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      move(1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      move(-1);
    }
  };
  const viewLabel = (slide: Slide) => (slide.view === 'front' ? copy.front : copy.back);
  const counter = copy.counter
    .replace('{n}', String(index + 1))
    .replace('{total}', String(slides.length));

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label={copy.label}
      aria-describedby={`${id}-counter`}
      className="flex flex-col gap-4"
      data-gallery=""
    >
      <div className="relative aspect-square overflow-hidden rounded-lg bg-ground">
        {slides.map((slide, i) => (
          <Image
            key={slide.src}
            src={slide.src}
            alt={i === index ? `${productName} — ${slide.color.name}، ${viewLabel(slide)}` : ''}
            fill
            sizes="(min-width: 1024px) 560px, 100vw"
            priority={i === 0}
            className={cn(
              'object-cover transition-opacity duration-(--duration-slow) ease-(--ease-standard)',
              i === index ? 'opacity-100' : 'opacity-0',
            )}
            aria-hidden={i !== index}
            data-gallery-slide={i}
          />
        ))}
        {slides.length > 1 && (
          <div className="absolute bottom-3 end-3 flex gap-2">
            <button
              type="button"
              onClick={() => move(-1)}
              onKeyDown={onKeyDown}
              aria-label={copy.previous}
              className="grid size-11 place-items-center rounded-pill border border-border bg-surface/90 text-text backdrop-blur-[6px] transition-colors duration-(--duration-fast) hover:bg-surface"
            >
              <Icon icon={ChevronRight} size={20} />
            </button>
            <button
              type="button"
              onClick={() => move(1)}
              onKeyDown={onKeyDown}
              aria-label={copy.next}
              className="grid size-11 place-items-center rounded-pill border border-border bg-surface/90 text-text backdrop-blur-[6px] transition-colors duration-(--duration-fast) hover:bg-surface"
            >
              <Icon icon={ChevronLeft} size={20} />
            </button>
          </div>
        )}
      </div>
      <p id={`${id}-counter`} aria-live="polite" className="text-caption text-text-muted">
        {counter}
      </p>
      <ul className="flex gap-3" aria-label={copy.thumbnails}>
        {slides.map((slide, i) => (
          <li key={slide.src}>
            <button
              type="button"
              onClick={() => setIndex(i)}
              onKeyDown={onKeyDown}
              aria-label={`${slide.color.name}، ${viewLabel(slide)}`}
              aria-pressed={i === index}
              className={cn(
                'relative block size-16 overflow-hidden rounded-inner border bg-ground transition-[border-color,box-shadow] duration-(--duration-fast) sm:size-20',
                i === index
                  ? 'border-primary ring-2 ring-primary/30'
                  : 'border-border hover:border-text-muted',
              )}
            >
              <Image src={slide.src} alt="" fill sizes="80px" className="object-cover" />
            </button>
          </li>
        ))}
      </ul>
      <ColorPicker
        name="gallery-color"
        colors={colors}
        value={current.color.slug}
        onChange={(slug) => {
          const first = slides.findIndex((s) => s.color.slug === slug);
          if (first >= 0) setIndex(first);
        }}
        label={copy.colorLabel}
        optionLabel={copy.colorOptionAria}
      />
    </div>
  );
}
