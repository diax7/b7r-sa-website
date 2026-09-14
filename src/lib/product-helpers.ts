import type { Product } from '@/content/schema';

/** Front photo used in the home strip and listing (BRD 6.4.2): black for tees and hoodie. */
export function stripColorFor(product: Product): string {
  return product.colors.some((c) => c.slug === 'black')
    ? 'black'
    : (product.colors[0]?.slug ?? 'white');
}

/**
 * The colour the designer shows every product in (BRD 6.4.3, amended 2026-09-13): white, or
 * the product's only colour (the tote's beige). The chips and the server-rendered stand-in
 * use the same one, so the preview never changes colour when the island mounts.
 */
export function designerColorFor(product: Product): string {
  return product.colors.find((c) => c.slug === 'white')?.slug ?? product.colors[0]?.slug ?? 'white';
}

/** Catalogue order. */
export function sortProducts(products: Product[]): Product[] {
  return products.toSorted((a, b) => a.sortOrder - b.sortOrder);
}
