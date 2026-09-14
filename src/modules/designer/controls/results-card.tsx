'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/shared/button';
import { SarAmount } from '@/components/shared/sar-amount';
import { cn } from '@/lib/cn';
import { useReducedMotion } from '@/lib/reduced-motion';

/**
 * Counts from the previous value to `value` over 300 ms whenever `commit` changes; when
 * `live` (slider drag) or reduced motion, the value is shown instantly (plan §G).
 */
function useCountUp(value: number, commit: number, live: boolean): number {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(value);
  const from = useRef(value);

  useEffect(() => {
    if (live || reduced) {
      from.current = value;
      setShown(value);
      return;
    }
    const start = performance.now();
    const origin = from.current;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 300);
      const eased = 1 - (1 - t) * (1 - t);
      const next = Math.round(origin + (value - origin) * eased);
      setShown(next);
      if (t < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // `commit` is the intended trigger; value changes during drag are handled by `live`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commit, live, reduced, value]);

  return shown;
}

interface ResultsCardProps {
  perPiece: number;
  monthly: number;
  belowCost: boolean;
  commit: number;
  live: boolean;
  ctaHref: string;
  copy: {
    perPieceLabel: string;
    monthlyLabel: string;
    negativeWarning: string;
    cta: string;
  };
}

/** Tinted results card (BRD 6.4.3): two figures, warning state, footnote, CTA. */
export function ResultsCard({
  perPiece,
  monthly,
  belowCost,
  commit,
  live,
  ctaHref,
  copy,
}: ResultsCardProps) {
  const shownPiece = useCountUp(perPiece, commit, live);
  const shownMonthly = useCountUp(monthly, commit, live);
  const zero = perPiece === 0;
  const tone = belowCost ? 'text-error' : zero ? 'text-text-muted' : 'text-text';

  return (
    <div className="flex flex-col gap-5 rounded-base bg-accent-tint p-5" data-results-card="">
      <dl className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <dt className="text-caption text-text-muted">{copy.perPieceLabel}</dt>
          <dd>
            <SarAmount
              value={shownPiece}
              className={cn('text-h3 transition-colors duration-(--duration-fast)', tone)}
              data-result="per-piece"
            />
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-caption text-text-muted">{copy.monthlyLabel}</dt>
          <dd>
            <SarAmount
              value={shownMonthly}
              className={cn('text-h3 transition-colors duration-(--duration-fast)', tone)}
              data-result="monthly"
            />
          </dd>
        </div>
      </dl>
      {belowCost && (
        <p role="status" className="text-small font-medium text-error" data-result="warning">
          {copy.negativeWarning}
        </p>
      )}
      <Button asChild size="lg" fullWidth>
        <a href={ctaHref} data-track="cta_click" data-location="designer">
          {copy.cta}
        </a>
      </Button>
    </div>
  );
}
