'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/shared/button';
import { SarAmount } from '@/components/shared/sar-amount';
import type { Product } from '@/content/schema';
import { cn } from '@/lib/cn';
import { track } from '@/modules/core';
import { DesignCanvas } from '@/modules/designer/canvas/design-canvas';
import { ColorPicker } from '@/modules/designer/controls/color-picker';
import { DesignDropzone } from '@/modules/designer/controls/design-dropzone';
import { PricingControls } from '@/modules/designer/controls/pricing-controls';
import { ResultsCard } from '@/modules/designer/controls/results-card';
import { printAreaRect } from '@/modules/designer/print-area';
import { monthlyProfit, perPieceProfit } from '@/modules/designer/profit';
import { ProductPicker } from '@/modules/designer/controls/product-picker';
import { useDesignerState } from '@/modules/designer/use-designer-state';
import type { DesignerCopy } from '@/modules/designer/types';

const MAX_CANVAS = 640;
const HINT_KEY = 'b7r_canvas_hint';

export interface DesignerIslandProps {
  products: Product[];
  initialSlug: string;
  registerUrlTemplate: string;
  copy: DesignerCopy;
}

/** Client composition of the designer (BRD 6.4.3). Loaded lazily; see DesignerLoader. */
export function DesignerIsland({
  products,
  initialSlug,
  registerUrlTemplate,
  copy,
}: DesignerIslandProps) {
  const initial = products.find((p) => p.slug === initialSlug) ?? products[0];
  if (!initial) throw new Error('Designer needs at least one product');
  const [state, dispatch] = useDesignerState(initial);
  const canvasHost = useRef<HTMLDivElement>(null);
  const resultsHost = useRef<HTMLDivElement>(null);
  const sectionHost = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(0);
  // Client-only component (loaded with ssr: false), so storage can be read during init.
  const [hint, setHint] = useState(() => {
    try {
      return window.localStorage.getItem(HINT_KEY) !== '1';
    } catch {
      return true;
    }
  });
  const [stickyVisible, setStickyVisible] = useState(false);

  const color =
    state.product.colors.find((c) => c.slug === state.colorSlug) ?? state.product.colors[0];
  const area = useMemo(
    () => printAreaRect(state.product.printArea.canvas, size),
    [state.product, size],
  );
  const perPiece = perPieceProfit(state.sellPrice, state.product.baseCost);
  const monthly = monthlyProfit(state.sellPrice, state.product.baseCost, state.dailySales);
  const ctaHref = registerUrlTemplate.replace('__SLUG__', state.product.slug);

  // Square stage sized to its column, max 640 px.
  useEffect(() => {
    const el = canvasHost.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      if (entry) setSize(Math.min(MAX_CANVAS, Math.floor(entry.contentRect.width)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Sticky mobile results bar: visible while the section is in view and the results card is not.
  useEffect(() => {
    const section = sectionHost.current;
    const results = resultsHost.current;
    if (!section || !results) return;
    let sectionIn = false;
    let resultsIn = false;
    const update = () => setStickyVisible(sectionIn && !resultsIn);
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === section) sectionIn = e.isIntersecting;
        if (e.target === results) resultsIn = e.isIntersecting;
      }
      update();
    });
    io.observe(section);
    io.observe(results);
    return () => io.disconnect();
  }, []);

  // Debounced calculator event (800 ms); the mount-time defaults are not a change.
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    const id = window.setTimeout(
      () =>
        track('calculator_change', {
          product: state.product.slug,
          sell: state.sellPrice,
          daily: state.dailySales,
        }),
      800,
    );
    return () => window.clearTimeout(id);
  }, [state.product.slug, state.sellPrice, state.dailySales]);

  function dismissHint() {
    if (!hint) return;
    setHint(false);
    try {
      window.localStorage.setItem(HINT_KEY, '1');
    } catch {
      // Storage unavailable; the hint simply returns next visit.
    }
  }

  return (
    <div
      ref={sectionHost}
      className="flex flex-col gap-8 lg:flex-row lg:gap-10"
      data-designer-island=""
    >
      {/* Canvas: end column on desktop (60 %), first on mobile. */}
      <div className="order-first lg:order-last lg:w-[60%]">
        <div
          ref={canvasHost}
          className="relative mx-auto aspect-square w-full max-w-[640px] overflow-hidden rounded-lg bg-ground"
          aria-label={copy.canvasLabel}
          role="img"
        >
          {size > 0 && color && (
            <DesignCanvas
              size={size}
              mockupSrc={color.images.front}
              design={state.design}
              area={area}
              onInteract={dismissHint}
            />
          )}
          {hint && (
            <p
              className="pointer-events-none absolute inset-x-4 bottom-4 rounded-base bg-navy/85 px-4 py-2 text-center text-caption text-white backdrop-blur-sm"
              data-canvas-hint=""
            >
              {copy.canvasHint}
            </p>
          )}
        </div>
      </div>

      {/* Controls: start column (40 %). */}
      <div className="flex flex-col gap-8 lg:w-[40%]">
        <ProductPicker
          products={products}
          value={state.product.slug}
          onChange={(product) => {
            dispatch({ type: 'selectProduct', product });
            track('designer_product_change', { product: product.slug });
          }}
          label={copy.groups.product}
          groupLabel={copy.productGroupAria}
        />
        <ColorPicker
          colors={state.product.colors}
          value={state.colorSlug}
          onChange={(slug) => dispatch({ type: 'selectColor', colorSlug: slug })}
          label={copy.groups.color}
          optionLabel={copy.colorOptionAria}
        />
        <DesignDropzone
          design={state.design}
          fileError={state.fileError}
          onDesign={(design) => dispatch({ type: 'setDesign', design })}
          onError={(error) => dispatch({ type: 'fileError', error })}
          onReset={() => dispatch({ type: 'resetDesign' })}
          onSample={() => dispatch({ type: 'resetDesign' })}
          copy={{
            label: copy.groups.design,
            upload: copy.upload,
            helper: copy.uploadHelper,
            sample: copy.sample,
            replace: copy.replace,
            reset: copy.reset,
            fileError: copy.fileError,
            dropzoneLabel: copy.dropzoneAria,
            thumbnailAlt: copy.thumbnailAria,
          }}
        />
        <PricingControls
          baseCost={state.product.baseCost}
          suggestedPrice={state.product.suggestedPrice}
          sellPrice={state.sellPrice}
          dailySales={state.dailySales}
          onSellLive={(value) => dispatch({ type: 'setSell', value, live: true })}
          onSellCommit={(value) => dispatch({ type: 'commitSell', value })}
          onDaily={(value) => dispatch({ type: 'setDaily', value })}
          copy={{
            label: copy.groups.pricing,
            baseCostLabel: copy.baseCostLabel,
            sellPriceLabel: copy.sellPriceLabel,
            suggestedPriceHelper: copy.suggestedPriceHelper,
            dailySalesLabel: copy.dailySalesLabel,
            sellInputAria: copy.sellInputAria,
            sellSliderAria: copy.sellSliderAria,
            dailyDecrementAria: copy.dailyDecrementAria,
            dailyIncrementAria: copy.dailyIncrementAria,
          }}
        />
        <div ref={resultsHost}>
          <ResultsCard
            perPiece={perPiece}
            monthly={monthly}
            belowCost={state.belowCost}
            commit={state.commit}
            live={state.live}
            ctaHref={ctaHref}
            copy={{
              perPieceLabel: copy.perPieceLabel,
              monthlyLabel: copy.monthlyLabel,
              negativeWarning: copy.negativeWarning,
              footnote: copy.footnote,
              cta: copy.cta,
            }}
          />
        </div>
      </div>

      {/* Sticky results bar (mobile only, BRD 6.4.3). */}
      <div
        aria-hidden={!stickyVisible}
        className={cn(
          'fixed inset-x-0 bottom-0 z-40 flex h-[72px] items-center justify-between gap-4 border-t border-border bg-surface/95 px-4 shadow-popover backdrop-blur-[12px] transition-[transform,opacity] duration-(--duration-base) ease-(--ease-standard) lg:hidden',
          stickyVisible
            ? 'translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-full opacity-0',
        )}
        data-sticky-results=""
      >
        <div className="flex flex-col">
          <span className="text-caption text-text-muted">{copy.monthlyLabel}</span>
          <SarAmount
            value={monthly}
            className={cn('text-h4', state.belowCost ? 'text-error' : 'text-text')}
          />
        </div>
        <Button asChild size="md">
          <a
            href={ctaHref}
            tabIndex={stickyVisible ? 0 : -1}
            onClick={() => track('cta_click', { location: 'designer' })}
          >
            {copy.cta}
          </a>
        </Button>
      </div>
    </div>
  );
}
