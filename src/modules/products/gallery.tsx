'use client';

import Image from 'next/image';
import { useId, useState, type KeyboardEvent } from 'react';
import { ColorPicker } from '@/components/shared/color-picker';
import type { ProductColor } from '@/content/schema';
import { cn } from '@/lib/cn';
import { PHOTO_QUALITY } from '@/lib/photo';

export interface GalleryCopy {
  label: string;
  /** Accessible name of the photo button: "اقلب الصورة" */
  flip: string;
  front: string;
  back: string;
  colorLabel: string;
  /** "اللون {colour}" */
  colorOptionAria: string;
  /** Between the product, the colour and the side in the alt text: «، » or ", ". */
  separator: string;
}

interface GalleryProps {
  productName: string;
  colors: ProductColor[];
  copy: GalleryCopy;
}

/**
 * Product gallery (BRD 6.6, amended 2026-09-13): one 1:1 photo of the active colour that
 * shows the back while hovered (pointer) or after a tap/click/Enter (touch, keyboard,
 * ArrowLeft/ArrowRight flip too), a visible front/back toggle under it so the back is
 * discoverable on a phone, and the colour swatches. No thumbnails, no counter: a visually
 * hidden live region announces colour and side for screen readers.
 */
export function Gallery({ productName, colors, copy }: GalleryProps) {
  const id = useId();
  const [colorSlug, setColorSlug] = useState(colors[0]?.slug ?? '');
  const [flipped, setFlipped] = useState(false);
  const [hover, setHover] = useState(false);
  const color = colors.find((c) => c.slug === colorSlug) ?? colors[0];
  if (!color) return null;
  const hasBack = Boolean(color.images.back);
  const showBack = hasBack && (flipped || hover);
  const side = showBack ? copy.back : copy.front;

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      setFlipped((f) => !f);
    }
  };

  return (
    <div role="group" aria-label={copy.label} className="flex flex-col gap-4" data-gallery="">
      <button
        type="button"
        aria-label={copy.flip}
        aria-describedby={`${id}-state`}
        aria-pressed={flipped}
        disabled={!hasBack}
        onClick={() => setFlipped((f) => !f)}
        onKeyDown={onKeyDown}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className="relative block aspect-square w-full overflow-hidden rounded-lg bg-ground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-default"
        data-gallery-photo={color.slug}
        data-gallery-side={showBack ? 'back' : 'front'}
      >
        <Image
          src={color.images.front}
          alt={`${productName}${copy.separator}${color.name}${copy.separator}${copy.front}`}
          fill
          sizes="(min-width: 1024px) 560px, 100vw"
          quality={PHOTO_QUALITY}
          priority
          fetchPriority="high"
          className={cn(
            'object-cover transition-opacity duration-(--duration-slow) ease-(--ease-standard)',
            showBack ? 'opacity-0' : 'opacity-100',
          )}
        />
        {color.images.back && (
          <Image
            src={color.images.back}
            alt={`${productName}${copy.separator}${color.name}${copy.separator}${copy.back}`}
            fill
            sizes="(min-width: 1024px) 560px, 100vw"
            quality={PHOTO_QUALITY}
            className={cn(
              'object-cover transition-opacity duration-(--duration-slow) ease-(--ease-standard)',
              showBack ? 'opacity-100' : 'opacity-0',
            )}
            aria-hidden={!showBack}
          />
        )}
      </button>
      <p id={`${id}-state`} aria-live="polite" className="sr-only">
        {color.name}
        {copy.separator}
        {side}
      </p>
      {hasBack && (
        <div className="flex gap-2" role="group" aria-label={copy.flip}>
          {(['front', 'back'] as const).map((view) => {
            const on = view === 'back' ? flipped : !flipped;
            return (
              <button
                key={view}
                type="button"
                aria-pressed={on}
                onClick={() => setFlipped(view === 'back')}
                data-gallery-view={view}
                className={cn(
                  'inline-flex h-11 items-center rounded-pill border px-5 text-small font-medium transition-colors duration-(--duration-fast)',
                  on
                    ? 'border-primary bg-accent-tint text-primary'
                    : 'border-border bg-surface text-text hover:border-text-muted',
                )}
              >
                {view === 'front' ? copy.front : copy.back}
              </button>
            );
          })}
        </div>
      )}
      <ColorPicker
        name="gallery-color"
        colors={colors}
        value={color.slug}
        onChange={(slug) => {
          setColorSlug(slug);
          setFlipped(false);
        }}
        label={copy.colorLabel}
        optionLabel={copy.colorOptionAria}
      />
    </div>
  );
}
