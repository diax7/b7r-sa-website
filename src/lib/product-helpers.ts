import type { Product } from '@/content/schema';

/** Front photo used in the home strip and listing (BRD 6.4.2): black for tees and hoodie. */
export function stripColorFor(product: Product): string {
  return product.colors.some((c) => c.slug === 'black')
    ? 'black'
    : (product.colors[0]?.slug ?? 'white');
}

/** Catalogue order. */
export function sortProducts(products: Product[]): Product[] {
  return products.toSorted((a, b) => a.sortOrder - b.sortOrder);
}
