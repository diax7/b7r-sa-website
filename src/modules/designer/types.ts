import type { SiteCopy } from '@/content/copy';

/** Strings the designer island receives from the server shell (BRD 4.4 + aria microcopy). */
export interface DesignerCopy {
  groups: { product: string };
  /** «اضغط لرفع شعارك أو صورتك»، the prompt over the empty print area. */
  uploadPrompt: string;
  /** «إزالة التصميم» */
  removeAria: string;
  canvasHint: string;
  baseCostLabel: string;
  sellPriceLabel: string;
  suggestedPriceHelper: string;
  dailySalesLabel: string;
  perPieceLabel: string;
  monthlyLabel: string;
  negativeWarning: string;
  cta: string;
  /** The sheen on the CTA (ADR-054), the site's switch. */
  ctaShiny: boolean;
  fileError: string;
  canvasLabel: string;
  productGroupAria: string;
  sellInputAria: string;
  sellSliderAria: string;
  dailyDecrementAria: string;
  dailyIncrementAria: string;
  dropzoneAria: string;
  /** «{product} {color}، الواجهة الأمامية», the alt text of the static mockup. */
  mockupAlt: string;
}

/** The interface strings of the designer (ADR-031) from a locale's bank; `cta` comes from the CMS. */
export function designerCopy(copy: SiteCopy, cta: string, ctaShiny = false): DesignerCopy {
  const d = copy.designer;
  return {
    groups: { product: d.productGroup },
    uploadPrompt: d.uploadPrompt,
    removeAria: d.remove,
    canvasHint: d.canvasHint,
    baseCostLabel: d.baseCost,
    sellPriceLabel: d.sellPrice,
    suggestedPriceHelper: d.suggestedPrice,
    dailySalesLabel: d.dailySales,
    perPieceLabel: d.perPiece,
    monthlyLabel: d.monthly,
    negativeWarning: d.negativeWarning,
    fileError: d.fileError,
    cta,
    ctaShiny,
    canvasLabel: d.canvasLabel,
    productGroupAria: d.productGroupLabel,
    sellInputAria: d.sellPriceInput,
    sellSliderAria: d.sellPriceSlider,
    dailyDecrementAria: d.dailySalesDecrement,
    dailyIncrementAria: d.dailySalesIncrement,
    dropzoneAria: d.dropzoneLabel,
    mockupAlt: d.mockupAlt,
  };
}
