import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/shared/card';
import { SarAmount } from '@/components/shared/sar-amount';
import { productsPage } from '@/content/pages';
import { stripColorFor } from '@/content/products';
import type { Product } from '@/content/schema';
import { cn } from '@/lib/cn';

interface ProductCardProps {
  product: Product;
  /** Listing cards preload nothing; the first row of the listing may pass `priority`. */
  priority?: boolean;
  headingLevel?: 'h2' | 'h3';
}

/**
 * Product card (BRD 6.5): 4:5 front photo (black for tees and the hoodie, as in the strip),
 * name, «يبدأ من {price}», colour dots, sizes summary. The whole card is one link; hover
 * lifts it 2 px and cross-fades to the back view over 300 ms when one exists.
 */
export function ProductCard({ product, priority = false, headingLevel = 'h3' }: ProductCardProps) {
  const color = product.colors.find((c) => c.slug === stripColorFor(product)) ?? product.colors[0];
  if (!color) throw new Error(`Product ${product.slug} has no colours`);
  const Heading = headingLevel;
  return (
    <Card hoverable className="group overflow-hidden">
      <Link
        href={`/products/${product.slug}`}
        className="flex h-full flex-col focus-visible:outline-none"
        data-slug={product.slug}
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-ground">
          <Image
            src={color.images.front}
            alt={product.shortDescription}
            fill
            sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
            priority={priority}
            className={cn(
              'object-cover transition-opacity duration-(--duration-slow) ease-(--ease-standard)',
              color.images.back && 'group-hover:opacity-0 group-focus-visible:opacity-0',
            )}
          />
          {color.images.back && (
            <Image
              src={color.images.back}
              alt=""
              fill
              sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
              className="object-cover opacity-0 transition-opacity duration-(--duration-slow) ease-(--ease-standard) group-hover:opacity-100 group-focus-visible:opacity-100"
            />
          )}
        </div>
        <div className="flex flex-1 flex-col gap-3 p-5">
          <Heading className="text-h4 text-text">{product.name}</Heading>
          <p className="text-body text-text-muted">
            {productsPage.pricePrefix}{' '}
            <SarAmount value={product.baseCost} className="font-medium text-text" />
          </p>
          <div className="mt-auto flex items-center justify-between gap-3 text-small text-text-muted">
            <ul className="flex items-center gap-1.5" aria-label={productsPage.specLabels.colors}>
              {product.colors.map((c) => (
                <li
                  key={c.slug}
                  className="size-4 rounded-pill border border-border"
                  // Swatch colours are product data (BRD Appendix A), not a design token.
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                  aria-label={c.name}
                />
              ))}
            </ul>
            {/* Auto-direction: «S – 2XL» is Latin, «مقاس واحد» is Arabic. */}
            <bdi className="tabular">{product.sizesSummary}</bdi>
          </div>
        </div>
      </Link>
    </Card>
  );
}
