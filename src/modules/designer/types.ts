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
