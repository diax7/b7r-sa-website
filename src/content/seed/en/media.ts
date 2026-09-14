import { COLOR_NAMES_EN, productsEn } from '@/content/seed/en/products';

/**
 * The English alt text of every media file the seed ships (BRD 3.9 in English, ADR-043),
 * by the stored filename (`<folder>-<file>`). Product photos are derived from the product
 * and colour names; the rest are listed.
 */
const LISTED: Record<string, string> = {
  'hero-set-a-desktop.jpg':
    'A young man in a black T-shirt printed with the B7R Print logo, with a tote bag, a cap and a hoodie beside him',
  'hero-set-a-mobile.jpg':
    'A young man in a black T-shirt printed with the B7R Print logo, with a tote bag, a cap and a hoodie beside him',
  'hero-set-b-desktop.jpg':
    'A young man in a white hoodie printed with "your design here", with a tote bag, a cap and a T-shirt beside him',
  'hero-set-b-mobile.jpg':
    'A young man in a white hoodie printed with "your design here", with a tote bag, a cap and a T-shirt beside him',
  // The English placeholders: the same shots mirrored (ADR-044), until the English photographs.
  'hero-en-set-a-desktop.jpg':
    'A young man in a black T-shirt printed with the B7R Print logo, with a hoodie, a cap and a tote bag beside him',
  'hero-en-set-a-mobile.jpg':
    'A young man in a black T-shirt printed with the B7R Print logo, with a hoodie, a cap and a tote bag beside him',
  'hero-en-set-b-desktop.jpg':
    'A young man in a white hoodie printed with "your design here", with a T-shirt, a cap and a tote bag beside him',
  'hero-en-set-b-mobile.jpg':
    'A young man in a white hoodie printed with "your design here", with a T-shirt, a cap and a tote bag beside him',
  'icons-3d-bag-and-parcel-order.jpg': '3D icon: connect your store',
  'icons-3d-box-of-products.jpg': '3D icon: our vision',
  'icons-3d-laptop-link-connect-store.jpg': '3D icon: connect your store',
  'icons-3d-printer-print.jpg': '3D icon: we print and ship',
  'icons-3d-tee-plus-create-product.jpg': '3D icon: design your product',
  'icons-3d-truck-delivery.jpg': '3D icon: we print, pack and ship',
  'lifestyle-cover-pricing.jpg': 'A calculator and a printed T-shirt on a table',
  'lifestyle-cover-print-on-demand.jpg': 'A digital printer printing a design on a white T-shirt',
  'lifestyle-cover-start-brand.jpg': 'A printed T-shirt on a wooden hanger',
  'lifestyle-hanging-tshirt-mockup.jpg': 'A black T-shirt hanging, printed with a Jeddah design',
};

const PRODUCT_PHOTO = /^([a-z-]+)-(white|black|beige)-(front|back)\.jpg$/;

/** The English alt of a seeded media file, or null for a file the seed does not know. */
export function mediaAltEn(uploaded: string): string | null {
  // Payload numbers a filename that already exists in the media folder (`name-2.jpg`).
  const filename = uploaded.replace(/-\d+(\.[a-z0-9]+)$/i, '$1');
  const listed = LISTED[filename];
  if (listed) return listed;
  const photo = PRODUCT_PHOTO.exec(filename);
  if (!photo) return null;
  const [, slug, color, side] = photo;
  const product = productsEn[slug ?? ''];
  if (!product || !color || !side) return null;
  return `${product.name}, ${COLOR_NAMES_EN[color]}, ${side} view`;
}
