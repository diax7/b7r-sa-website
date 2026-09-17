'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/shared/button';
import { SarAmount } from '@/components/shared/sar-amount';
import { useBottomDock } from '@/components/shared/use-bottom-dock';
import { cn } from '@/lib/cn';

interface ProductStickyBarProps {
  slug: string;
  pricePrefix: string;
  baseCost: number;
  cta: string;
  href: string;
  /** The sheen on the button (ADR-054), the site's switch. */
  shiny?: boolean;
  /** Selector of the in-page primary CTA; the bar shows while that element is off screen. */
  watch: string;
}

/**
 * Mobile sticky bottom bar (BRD 6.6): «يبدأ من {price}» + the primary CTA, shown once the
 * in-content CTA has scrolled out of view. Shares the dock contract with the designer bar so
 * the WhatsApp button and consent card lift above it.
 */
export function ProductStickyBar({
  slug,
  pricePrefix,
  baseCost,
  cta,
  href,
  shiny,
  watch,
}: ProductStickyBarProps) {
  const [visible, setVisible] = useState(false);
  useBottomDock(visible);

  useEffect(() => {
    const target = document.querySelector(watch);
    if (!target) return;
    // Show only once the CTA has been passed (scrolled above the viewport), never before
    // reaching it. A scroll listener rather than an IntersectionObserver: a jump from below
    // the fold to above it never crosses the observer's threshold.
    let frame = 0;
    const check = () => {
      frame = 0;
      setVisible(target.getBoundingClientRect().bottom < 0);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };
    check();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [watch]);

  return (
    <div
      aria-hidden={!visible}
      data-product-sticky=""
      data-product={slug}
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 flex h-[72px] items-center justify-between gap-4 border-t border-border bg-surface/95 px-4 shadow-popover backdrop-blur-[12px] transition-[transform,opacity] duration-(--duration-base) ease-(--ease-standard) lg:hidden',
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-full opacity-0',
      )}
    >
      <p className="flex flex-col">
        <span className="text-caption text-text-muted">{pricePrefix}</span>
        <SarAmount value={baseCost} className="text-h4 text-text" />
      </p>
      <Button asChild size="md" variant={shiny ? 'shiny' : 'primary'}>
        <a href={href} tabIndex={visible ? 0 : -1} data-track="cta_click" data-location="product">
          {cta}
        </a>
      </Button>
    </div>
  );
}
