/**
 * The five products in English (Appendix A in translation): the localised fields only,
 * keyed by slug; colours and sizes by their slug or Arabic label. Prices, weights and
 * measurements are not localised (they live on the Arabic document).
 */
export interface ProductEn {
  name: string;
  shortDescription: string;
  description: string;
  material: string;
  sizesSummary: string;
  /** English label by the Arabic label; sizes with Latin labels (`S`, `0-3M`) stay as they are. */
  sizeLabels?: Record<string, string>;
}

export const PRINT_AREA_LABEL_EN = 'Front, 28 × 38 cm';
export const PRINT_METHOD_EN = 'High-quality digital print';

export const COLOR_NAMES_EN: Record<string, string> = {
  white: 'White',
  black: 'Black',
  beige: 'Beige',
};

export const productsEn: Record<string, ProductEn> = {
  'tee-essential': {
    name: 'Essential T-shirt',
    shortDescription: 'A classic crew-neck tee with a regular fit, in soft 180 g cotton.',
    description:
      'A classic crew-neck T-shirt with a regular fit that suits everyone. Made of soft, high-quality cotton that stays comfortable all day, it is the first choice for brands that want a lasting essential built for repeated wear.',
    material: 'Soft, high-quality cotton',
    sizesSummary: 'S – 2XL',
  },
  'tee-oversize': {
    name: 'Oversized T-shirt',
    shortDescription:
      'A loose cut with dropped shoulders, in heavy 240 g fabric made for streetwear designs.',
    description:
      'A loose cut and dropped shoulders give this T-shirt a bold, contemporary look. The fabric is heavy and durable to suit streetwear, and it offers a wide, flat surface for large creative designs printed to a professional standard.',
    material: 'Heavy, durable cotton in a loose cut',
    sizesSummary: 'S – 2XL',
  },
  hoodie: {
    name: 'Hoodie',
    shortDescription: 'A warm hoodie with thumb holes, in premium 520 g fabric with a soft lining.',
    description:
      'A warm, modern hoodie with thumb holes at the cuffs, which keep the sleeves in place and add warmth for the hands. Made of premium fabric with a soft lining, it is an excellent choice for winter collections and sportswear.',
    material: 'Premium fabric with a soft lining and thumb holes',
    sizesSummary: 'S – XL',
  },
  'baby-onesie': {
    name: 'Baby onesie',
    shortDescription:
      'A one-piece that is gentle on a baby’s skin, with stretchy openings for easy dressing.',
    description:
      'A one-piece baby garment designed with care to be very soft on a baby’s sensitive skin. Stretchy openings make dressing and undressing easy, and the printing technique keeps the colours vivid and the design intact through many wash cycles.',
    material: 'Soft cotton suited to a baby’s skin',
    sizesSummary: '0-3M – 12-18M',
  },
  'tote-bag': {
    name: 'Tote bag',
    shortDescription: 'Durable canvas with a wide print area and handles built for daily use.',
    description:
      'A practical, durable tote bag made of high-quality canvas, designed as the ideal daily companion for shopping or work. Its wide surface takes large, clear artwork, and the strong handles stand up to constant use and varied loads.',
    material: 'High-quality canvas with strong handles',
    sizesSummary: 'One size',
    sizeLabels: { 'مقاس واحد': 'One size' },
  },
};
