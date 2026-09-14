'use client';

import { useId, useState } from 'react';
import { SarAmount } from '@/components/shared/sar-amount';
import { SarSymbol } from '@/components/shared/sar-symbol';
import { Stepper } from '@/components/shared/stepper';
import { Slider } from '@/components/ui/slider';
import { DAILY_MAX, DAILY_MIN, sellMax } from '@/modules/designer/profit';

interface PricingControlsProps {
  /** The document's direction, for the slider. */
  dir: 'rtl' | 'ltr';
  baseCost: number;
  suggestedPrice: number;
  sellPrice: number;
  dailySales: number;
  onSellLive: (value: number) => void;
  onSellCommit: (value: number) => void;
  onDaily: (value: number) => void;
  copy: {
    baseCostLabel: string;
    sellPriceLabel: string;
    suggestedPriceHelper: string;
    dailySalesLabel: string;
    sellInputAria: string;
    sellSliderAria: string;
    dailyDecrementAria: string;
    dailyIncrementAria: string;
  };
}

/**
 * Pricing group (BRD 6.4.3): read-only base cost, price input bound to a slider with the
 * suggested price under the label, stepper.
 */
export function PricingControls({
  dir,
  baseCost,
  suggestedPrice,
  sellPrice,
  dailySales,
  onSellLive,
  onSellCommit,
  onDaily,
  copy,
}: PricingControlsProps) {
  const sellId = useId();
  const max = sellMax(baseCost);
  // While the visitor types, the field shows the raw draft (even an empty string); once the
  // value is committed the draft is dropped and the state value shows again.
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between rounded-base bg-ground px-4 py-3">
        <span className="text-small text-text-muted">{copy.baseCostLabel}</span>
        <SarAmount value={baseCost} className="text-h4 text-text" />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          <span className="flex flex-col gap-0.5">
            <label htmlFor={sellId} className="text-small text-text">
              {copy.sellPriceLabel}
            </label>
            <span className="text-caption text-text-muted">
              {copy.suggestedPriceHelper} <SarAmount value={suggestedPrice} />
            </span>
          </span>
          <span className="inline-flex h-11 items-center gap-1 rounded-base border border-border bg-surface px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-accent/40">
            <SarSymbol className="text-text-muted" />
            <input
              id={sellId}
              type="number"
              inputMode="numeric"
              dir="ltr"
              min={0}
              max={max}
              step={1}
              value={draft ?? String(sellPrice)}
              aria-label={copy.sellInputAria}
              onChange={(e) => {
                setDraft(e.target.value);
                if (e.target.value !== '') onSellLive(Number(e.target.value));
              }}
              onBlur={(e) => {
                onSellCommit(e.target.value === '' ? sellPrice : Number(e.target.value));
                setDraft(null);
              }}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return;
                const raw = (e.target as HTMLInputElement).value;
                onSellCommit(raw === '' ? sellPrice : Number(raw));
                setDraft(null);
              }}
              className="tabular w-16 bg-transparent text-body font-medium text-text focus:outline-hidden [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </span>
        </div>
        <Slider
          dir={dir}
          min={baseCost}
          max={max}
          step={1}
          value={[Math.min(Math.max(sellPrice, baseCost), max)]}
          onValueChange={([v]) => v !== undefined && onSellLive(v)}
          onValueCommit={([v]) => v !== undefined && onSellCommit(v)}
          thumbLabel={copy.sellSliderAria}
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <span className="text-small text-text">{copy.dailySalesLabel}</span>
        <Stepper
          value={dailySales}
          onChange={onDaily}
          min={DAILY_MIN}
          max={DAILY_MAX}
          label={copy.dailySalesLabel}
          decrementLabel={copy.dailyDecrementAria}
          incrementLabel={copy.dailyIncrementAria}
        />
      </div>
    </div>
  );
}
