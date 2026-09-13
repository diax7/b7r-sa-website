import { SarAmount } from '@/components/shared/sar-amount';
import { productsPage } from '@/content/pages';
import type { Product } from '@/content/schema';
import { stripColorFor } from '@/lib/product-helpers';
import { ProductCardMedia } from '@/modules/products/product-card-media';

interface ProductCardProps {
  product: Product;
  /** Listing cards preload nothing; the first row of the listing may pass `priority`. */
  priority?: boolean;
  headingLevel?: 'h2' | 'h3';
}

/**
 * Product card (BRD 6.5, amended 2026-09-13): 4:5 photo of the active colour (black for tees
 * and the hoodie at first, as in the strip), name, «يبدأ من {price}», two colour swatches,
 * sizes summary. The whole card is one link (stretched from the name); hover lifts it 2 px
 * and cross-fades the photo to the back view of the active colour (ADR-035).
 */
export function ProductCard({ product, priority = false, headingLevel = 'h3' }: ProductCardProps) {
  const initial =
    product.colors.find((c) => c.slug === stripColorFor(product)) ?? product.colors[0];
  if (!initial) throw new Error(`Product ${product.slug} has no colours`);
  return (
    <ProductCardMedia
      colors={product.colors}
      initialSlug={initial.slug}
      alt={product.shortDescription}
      priority={priority}
      href={`/products/${product.slug}`}
      slug={product.slug}
      name={product.name}
      headingLevel={headingLevel}
      price={
        <p className="text-body text-text-muted">
          {productsPage.pricePrefix}{' '}
          <SarAmount value={product.baseCost} className="font-medium text-text" />
        </p>
      }
      sizesSummary={product.sizesSummary}
      swatchesLabel={productsPage.specLabels.colors}
    />
  );
}
