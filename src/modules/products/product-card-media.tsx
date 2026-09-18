'use client';

import Image from 'next/image';
import Link from 'next/link';
import { type ReactNode, useState } from 'react';
import { Card } from '@/components/shared/card';
import type { ProductColor } from '@/content/schema';
import { cn } from '@/lib/cn';

const SIZES = '(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw';

interface ProductCardMediaProps {
  colors: ProductColor[];
  /** The colour shown before any interaction (the strip colour of the product). */
  initialSlug: string;
  alt: string;
  priority: boolean;
  lcp: boolean;
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
 * The card (BRD 6.5, amended 2026-09-13, ADR-035): the name is a stretched link that makes
 * the whole card clickable; two colour swatches sit above it in the footer. Hovering a
 * swatch previews that colour (and pauses the flip through `data-preview`), clicking it
 * makes it the active colour; hovering the card shows the back of the active colour when
 * there is one. Changing `src` in place keeps the previous photo painted until the next one
 * decodes. Before hydration the first colour renders front and back, so a no-JS visitor
 * sees today's card.
 */
export function ProductCardMedia({
  colors,
  initialSlug,
  alt,
  priority,
  lcp,
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
    <Card
      hoverable
      className="group relative flex h-full flex-col overflow-hidden"
      data-product-card={slug}
      data-preview={preview ? '' : undefined}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-ground" data-card-photo={shown.slug}>
        <Image
          src={shown.images.front}
          alt={alt}
          fill
          sizes={SIZES}
          priority={priority}
          fetchPriority={lcp ? 'high' : undefined}
          className={cn(
            'object-cover transition-opacity duration-(--duration-slow) ease-(--ease-standard)',
            shown.images.back && 'group-hover:opacity-0 group-data-[preview]:opacity-100',
          )}
        />
        {shown.images.back && (
          <Image
            src={shown.images.back}
            alt=""
            fill
            sizes={SIZES}
            className="object-cover opacity-0 transition-opacity duration-(--duration-slow) ease-(--ease-standard) group-hover:opacity-100 group-data-[preview]:opacity-0"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <Heading className="text-h4 text-text">
          {/* Stretched link: its pseudo-element covers the card, so the whole card navigates
              while the name stays the link's accessible name. */}
          <Link
            href={href}
            data-slug={slug}
            className="after:absolute after:inset-0 after:rounded-base focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-primary/40"
          >
            {name}
          </Link>
        </Heading>
        {price}
        <div className="mt-auto flex items-center justify-between gap-3 text-small text-text-muted">
          {/* Above the stretched link (z-10): the swatches act without navigating. */}
          <ul className="relative z-10 -ms-2.5 flex items-center" aria-label={swatchesLabel}>
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
                  // 44 px hit area around a 24 px swatch (BRD 3.13).
                  className="group/swatch grid size-11 place-items-center rounded-pill"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'grid size-6 place-items-center rounded-pill border transition-[box-shadow,border-color] duration-(--duration-fast)',
                      c.slug === active
                        ? 'border-primary ring-2 ring-primary/30'
                        : 'border-border group-hover/swatch:border-text-muted',
                    )}
                  >
                    <span
                      className="size-4 rounded-pill border border-black/10"
                      // Swatch colours are product data (BRD Appendix A), not a design token.
                      style={{ backgroundColor: c.hex }}
                    />
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {/* Auto-direction: «S – 2XL» is Latin, «مقاس واحد» is Arabic. */}
          <bdi className="tabular">{sizesSummary}</bdi>
        </div>
      </div>
    </Card>
  );
}
