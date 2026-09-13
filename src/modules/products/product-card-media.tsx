'use client';

import Image from 'next/image';
import Link from 'next/link';
import { type ReactNode, useState } from 'react';
import type { ProductColor } from '@/content/schema';
import { cn } from '@/lib/cn';

const SIZES = '(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw';

interface ProductCardMediaProps {
  colors: ProductColor[];
  /** The colour shown before any interaction (the strip colour of the product). */
  initialSlug: string;
  alt: string;
  priority: boolean;
  href: string;
  slug: string;
  name: string;
  headingLevel: 'h2' | 'h3';
  /** Server-rendered «يبدأ من {price}» line. */
  price: ReactNode;
  sizesSummary: string;
  swatchesLabel: string;
}

/**
 * Card interior (BRD 6.5, amended 2026-09-13, ADR-035): the photo and the name both link to
 * the product; two colour swatches sit in the footer. Hovering a swatch previews that
 * colour, clicking it makes it the active colour; hovering the photo shows the back of the
 * active colour when there is one. Before hydration the first colour renders front and
 * back, so a no-JS visitor sees today's card.
 */
export function ProductCardMedia({
  colors,
  initialSlug,
  alt,
  priority,
  href,
  slug,
  name,
  headingLevel: Heading,
  price,
  sizesSummary,
  swatchesLabel,
}: ProductCardMediaProps) {
  const [active, setActive] = useState(initialSlug);
  const [preview, setPreview] = useState<string | null>(null);
  const shown = colors.find((c) => c.slug === (preview ?? active)) ?? colors[0];
  if (!shown) return null;
  const swatches = colors.slice(0, 2);

  return (
    <>
      {/* The photo is a second link to the product, hidden from assistive tech (the name link
          below is the accessible one); `group/photo` scopes the flip to the photo alone. */}
      <Link
        href={href}
        aria-hidden="true"
        tabIndex={-1}
        className="group/photo relative block aspect-[4/5] overflow-hidden bg-ground"
        data-card-photo={shown.slug}
      >
        <Image
          key={`${shown.slug}-front`}
          src={shown.images.front}
          alt={alt}
          fill
          sizes={SIZES}
          priority={priority}
          className={cn(
            'object-cover transition-opacity duration-(--duration-slow) ease-(--ease-standard)',
            shown.images.back && 'group-hover/photo:opacity-0',
          )}
        />
        {shown.images.back && (
          <Image
            key={`${shown.slug}-back`}
            src={shown.images.back}
            alt=""
            fill
            sizes={SIZES}
            className="object-cover opacity-0 transition-opacity duration-(--duration-slow) ease-(--ease-standard) group-hover/photo:opacity-100"
          />
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <Heading className="text-h4 text-text">
          <Link
            href={href}
            data-slug={slug}
            className="rounded-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            {name}
          </Link>
        </Heading>
        {price}
        <div className="mt-auto flex items-center justify-between gap-3 text-small text-text-muted">
          <ul className="flex items-center gap-2" aria-label={swatchesLabel}>
            {swatches.map((c) => (
              <li key={c.slug}>
                <button
                  type="button"
                  aria-label={c.name}
                  aria-pressed={c.slug === active}
                  data-swatch={c.slug}
                  onMouseEnter={() => setPreview(c.slug)}
                  onMouseLeave={() => setPreview(null)}
                  onFocus={() => setPreview(c.slug)}
                  onBlur={() => setPreview(null)}
                  onClick={() => setActive(c.slug)}
                  className={cn(
                    'grid size-6 place-items-center rounded-pill border transition-[box-shadow,border-color] duration-(--duration-fast)',
                    c.slug === active
                      ? 'border-primary ring-2 ring-primary/30'
                      : 'border-border hover:border-text-muted',
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="size-4 rounded-pill border border-black/10"
                    // Swatch colours are product data (BRD Appendix A), not a design token.
                    style={{ backgroundColor: c.hex }}
                  />
                </button>
              </li>
            ))}
          </ul>
          {/* Auto-direction: «S – 2XL» is Latin, «مقاس واحد» is Arabic. */}
          <bdi className="tabular">{sizesSummary}</bdi>
        </div>
      </div>
    </>
  );
}
