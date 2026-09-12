/** Strings the designer island receives from the server shell (BRD 4.4 + aria microcopy). */
export interface DesignerCopy {
  groups: { product: string; color: string; design: string; pricing: string };
  upload: string;
  uploadHelper: string;
  sample: string;
  replace: string;
  reset: string;
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
  colorOptionAria: string;
  sellInputAria: string;
  sellSliderAria: string;
  dailyDecrementAria: string;
  dailyIncrementAria: string;
  thumbnailAria: string;
  dropzoneAria: string;
}
