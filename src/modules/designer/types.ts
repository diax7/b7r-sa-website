import messages from '@/messages/ar.json';

/** Strings the designer island receives from the server shell (BRD 4.4 + aria microcopy). */
export interface DesignerCopy {
  groups: { product: string; pricing: string };
  /** «اضغط لرفع شعارك أو صورتك» — the prompt over the empty print area. */
  uploadPrompt: string;
  uploadHelper: string;
  sample: string;
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
  footnote: string;
  cta: string;
  fileError: string;
  canvasLabel: string;
  productGroupAria: string;
  sellInputAria: string;
  sellSliderAria: string;
  dailyDecrementAria: string;
  dailyIncrementAria: string;
  dropzoneAria: string;
}

/** The interface strings of the designer (ADR-031): labels, hints, validation, prompts. */
export const designerMessages = {
  groups: { product: messages.designer.productGroup, pricing: messages.designer.pricingGroup },
  uploadPrompt: messages.designer.uploadPrompt,
  uploadHelper: messages.designer.uploadHelper,
  removeAria: messages.designer.remove,
  canvasHint: messages.designer.canvasHint,
  baseCostLabel: messages.designer.baseCost,
  sellPriceLabel: messages.designer.sellPrice,
  suggestedPriceHelper: messages.designer.suggestedPrice,
  dailySalesLabel: messages.designer.dailySales,
  perPieceLabel: messages.designer.perPiece,
  monthlyLabel: messages.designer.monthly,
  negativeWarning: messages.designer.negativeWarning,
  footnote: messages.designer.footnote,
  fileError: messages.designer.fileError,
} as const;
