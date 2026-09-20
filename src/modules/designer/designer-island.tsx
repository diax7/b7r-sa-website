'use client';

import {
  type DragEvent,
  type PointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Button } from '@/components/shared/button';
import { SarAmount } from '@/components/shared/sar-amount';
import { useBottomDock } from '@/components/shared/use-bottom-dock';
import type { Product } from '@/content/schema';
import { cn } from '@/lib/cn';
import { track } from '@/modules/core/analytics/track';
import { DesignCanvas } from '@/modules/designer/canvas/design-canvas';
import { usePreloadedMockups } from '@/modules/designer/canvas/use-preloaded-mockups';
import { PricingControls } from '@/modules/designer/controls/pricing-controls';
import { PrintAreaOverlay } from '@/modules/designer/controls/print-area-overlay';
import { ResultsCard } from '@/modules/designer/controls/results-card';
import { printAreaRect } from '@/modules/designer/print-area';
import { monthlyProfit, perPieceProfit } from '@/modules/designer/profit';
import { ProductPicker } from '@/modules/designer/controls/product-picker';
import { acceptFile } from '@/modules/designer/upload';
import { useDesignerState } from '@/modules/designer/use-designer-state';
import type { DesignerCopy } from '@/modules/designer/types';

const MAX_CANVAS = 640;
const HINT_KEY = 'b7r_canvas_hint';
/** The edit chrome's reach beyond the print area: the corner handles and the «×» sit there. */
const AREA_MARGIN = 28;
/** A finger lifted inside the area keeps the chrome this long, so the «×» can be tapped. */
const TOUCH_LINGER_MS = 3000;

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
  const [chrome, setChrome] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const linger = useRef<number | null>(null);
  // Client-only component: the document's direction is settled before it mounts.
  const [dir] = useState<'rtl' | 'ltr'>(() =>
    document.documentElement.dir === 'ltr' ? 'ltr' : 'rtl',
  );

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

  useBottomDock(stickyVisible);

  // The other products' mockups arrive while the person reads the calculator (ADR-064).
  usePreloadedMockups(products, state.product);

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

  async function onFile(file: File | undefined) {
    if (!file) return;
    const design = await acceptFile(file);
    if (!design) {
      dispatch({ type: 'fileError', error: true });
      return;
    }
    dispatch({ type: 'setDesign', design });
    track('designer_upload', { type: file.type, bytes: file.size });
  }

  // Drag-and-drop anywhere on the mockup (BRD 6.4.3); the print area is the click target.
  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    void onFile(e.dataTransfer.files[0]);
  }

  const onChromeChange = useCallback((visible: boolean) => setChrome(visible), []);

  // The edit chrome follows the pointer's place, not the stage: inside the print area (with
  // a margin for the handles and the «×») it shows; anywhere else it hides on its own. A
  // finger there keeps it for a moment after lifting, long enough to tap the «×».
  function insideArea(e: { clientX: number; clientY: number; currentTarget: HTMLElement }) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return (
      x >= area.x - AREA_MARGIN &&
      x <= area.x + area.width + AREA_MARGIN &&
      y >= area.y - AREA_MARGIN &&
      y <= area.y + area.height + AREA_MARGIN
    );
  }
  const clearLinger = useCallback(() => {
    if (linger.current !== null) window.clearTimeout(linger.current);
    linger.current = null;
  }, []);
  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== 'mouse') return;
    setHovered(insideArea(e));
  }
  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType === 'mouse') return;
    clearLinger();
    setHovered(insideArea(e));
  }
  function onPointerUp(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType === 'mouse') return;
    clearLinger();
    linger.current = window.setTimeout(() => setHovered(false), TOUCH_LINGER_MS);
  }
  useEffect(() => clearLinger, [clearLinger]);

  // A design is an object URL: revoke it whenever it is replaced or on unmount.
  const design = state.design;
  useEffect(
    () => () => {
      if (design) URL.revokeObjectURL(design.url);
    },
    [design],
  );

  return (
    <div
      ref={sectionHost}
      className="flex flex-col gap-6 lg:flex-row lg:gap-8"
      data-designer-island=""
    >
      {/* Canvas: end column on desktop, first on mobile. */}
      <div className="order-first lg:order-last lg:w-[54%]">
        {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- drop target; the file input in the overlay is the keyboard path */}
        <div
          ref={canvasHost}
          className={cn(
            'relative mx-auto aspect-square w-full max-w-[600px] overflow-hidden rounded-lg bg-ground transition-shadow duration-(--duration-fast)',
            dragOver && 'ring-2 ring-primary/50',
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onPointerMove={onPointerMove}
          onPointerLeave={(e) => e.pointerType === 'mouse' && setHovered(false)}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          data-design-dropzone=""
          data-chrome={chrome ? 'true' : 'false'}
        >
          {size > 0 && color && (
            <>
              {/* The picture alone is the image; the upload input and «×» stay exposed. */}
              <div role="img" aria-label={copy.canvasLabel}>
                <DesignCanvas
                  size={size}
                  mockupSrc={color.images.front}
                  design={state.design}
                  area={area}
                  hovered={hovered}
                  onInteract={dismissHint}
                  onChromeChange={onChromeChange}
                />
              </div>
              <PrintAreaOverlay
                area={area}
                hasDesign={state.design !== null}
                chrome={chrome}
                fileError={state.fileError}
                onFile={(file) => void onFile(file)}
                onRemove={() => dispatch({ type: 'removeDesign' })}
                copy={{
                  prompt: copy.uploadPrompt,
                  inputAria: copy.dropzoneAria,
                  removeAria: copy.removeAria,
                  fileError: copy.fileError,
                }}
              />
            </>
          )}
          {hint && state.design && (
            <p
              className="pointer-events-none absolute inset-x-4 bottom-4 rounded-base bg-navy/85 px-4 py-2 text-center text-caption text-white backdrop-blur-sm"
              data-canvas-hint=""
            >
              {copy.canvasHint}
            </p>
          )}
        </div>
      </div>

      {/* Controls: start column. */}
      <div className="flex flex-col gap-6 lg:w-[46%]">
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
        <PricingControls
          dir={dir}
          baseCost={state.product.baseCost}
          suggestedPrice={state.product.suggestedPrice}
          sellPrice={state.sellPrice}
          dailySales={state.dailySales}
          onSellLive={(value) => dispatch({ type: 'setSell', value, live: true })}
          onSellCommit={(value) => dispatch({ type: 'commitSell', value })}
          onDaily={(value) => dispatch({ type: 'setDaily', value })}
          copy={{
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
              cta: copy.cta,
              ctaShiny: copy.ctaShiny,
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
        <Button asChild size="md" variant={copy.ctaShiny ? 'shiny' : 'primary'}>
          <a
            href={ctaHref}
            tabIndex={stickyVisible ? 0 : -1}
            data-track="cta_click"
            data-location="designer"
          >
            {copy.cta}
          </a>
        </Button>
      </div>
    </div>
  );
}
