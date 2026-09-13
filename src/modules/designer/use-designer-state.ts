'use client';

import { useReducer } from 'react';
import type { Product } from '@/content/schema';
import { clampDaily, clampSell } from '@/modules/designer/profit';

export const SAMPLE_DESIGN = { url: '/designs/sample-tasmeemak.png', width: 1200, height: 600 };
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];

export interface Design {
  url: string;
  kind: 'sample' | 'upload';
  width: number;
  height: number;
}

export interface DesignerState {
  product: Product;
  colorSlug: string;
  /** `null` until the visitor uploads or places the sample: the print area shows the prompt. */
  design: Design | null;
  sellPrice: number;
  dailySales: number;
  belowCost: boolean;
  fileError: boolean;
  /** Increments on committed changes so the results count-up restarts (plan §G). */
  commit: number;
  /** True while the slider is being dragged so the figures update without animating. */
  live: boolean;
}

export type DesignerAction =
  | { type: 'selectProduct'; product: Product }
  | { type: 'setDesign'; design: Design }
  | { type: 'useSample' }
  | { type: 'removeDesign' }
  | { type: 'fileError'; error: boolean }
  | { type: 'setSell'; value: number; live?: boolean }
  | { type: 'commitSell'; value: number }
  | { type: 'setDaily'; value: number };

/**
 * The designer shows every product in one colour (BRD 6.4.3, amended 2026-09-13): white,
 * or the product's only colour (the tote's beige).
 */
export function defaultColor(product: Product): string {
  return product.colors.find((c) => c.slug === 'white')?.slug ?? product.colors[0]?.slug ?? 'white';
}

export function initialState(product: Product): DesignerState {
  return {
    product,
    colorSlug: defaultColor(product),
    design: null,
    sellPrice: product.suggestedPrice,
    dailySales: 10,
    belowCost: false,
    fileError: false,
    commit: 0,
    live: false,
  };
}

export function reducer(state: DesignerState, action: DesignerAction): DesignerState {
  switch (action.type) {
    case 'selectProduct': {
      if (action.product.slug === state.product.slug) return state;
      // Reset the price to the new product's suggestion so a tee → hoodie switch never shows
      // a spurious below-cost warning (CTO review, plan §G).
      return {
        ...state,
        product: action.product,
        colorSlug: defaultColor(action.product),
        sellPrice: action.product.suggestedPrice,
        belowCost: false,
        commit: state.commit + 1,
        live: false,
      };
    }
    case 'setDesign':
      return { ...state, design: action.design, fileError: false };
    case 'useSample':
      return { ...state, design: { ...SAMPLE_DESIGN, kind: 'sample' }, fileError: false };
    case 'removeDesign':
      if (state.design?.kind === 'upload') URL.revokeObjectURL(state.design.url);
      return { ...state, design: null, fileError: false };
    case 'fileError':
      return { ...state, fileError: action.error };
    case 'setSell': {
      const { value, belowCost } = clampSell(action.value, state.product.baseCost);
      return { ...state, sellPrice: value, belowCost, live: action.live ?? false };
    }
    case 'commitSell': {
      const { value, belowCost } = clampSell(action.value, state.product.baseCost);
      return { ...state, sellPrice: value, belowCost, commit: state.commit + 1, live: false };
    }
    case 'setDaily':
      return {
        ...state,
        dailySales: clampDaily(action.value),
        commit: state.commit + 1,
        live: false,
      };
    default:
      return state;
  }
}

export function useDesignerState(product: Product) {
  return useReducer(reducer, product, initialState);
}
