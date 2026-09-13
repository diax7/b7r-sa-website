import { Upload } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/shared/button';
import { Icon } from '@/components/shared/icon';
import { SarAmount } from '@/components/shared/sar-amount';
import { SarSymbol } from '@/components/shared/sar-symbol';
import type { Product } from '@/content/schema';
import { home } from '@/content/home';
import { stripColorFor } from '@/lib/product-helpers';
import { cn } from '@/lib/cn';
import { monthlyProfit, perPieceProfit } from '@/modules/designer/profit';
import { SAMPLE_DESIGN } from '@/modules/designer/use-designer-state';

interface DesignerStaticProps {
  products: Product[];
  product: Product;
  ctaHref: string;
}

/**
 * Server-rendered stand-in for the designer island (BRD 6.4.3): the same layout and copy,
 * no handlers, so crawlers and no-JS visitors see the real section and the page does not
 * shift when the island mounts (it mirrors the island's height on every breakpoint).
 */
export function DesignerStatic({ products, product, ctaHref }: DesignerStaticProps) {
  const { designer } = home;
  const color = product.colors[0];
  const perPiece = perPieceProfit(product.suggestedPrice, product.baseCost);
  const monthly = monthlyProfit(product.suggestedPrice, product.baseCost, 10);

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:gap-10" data-designer-fallback="">
      <div className="order-first lg:order-last lg:w-[60%]">
        <div className="relative mx-auto aspect-square w-full max-w-[640px] overflow-hidden rounded-lg bg-ground">
          {color && (
            <Image
              src={color.images.front}
              alt={`${product.name} ${color.name}، الواجهة الأمامية`}
              fill
              sizes="(min-width: 1024px) 640px, 100vw"
              className="object-contain"
            />
          )}
          {/* The sample design sits where the island places it: 60 % of the print-area width. */}
          <Image
            src={SAMPLE_DESIGN.url}
            alt=""
            width={SAMPLE_DESIGN.width}
            height={SAMPLE_DESIGN.height}
            className="absolute"
            style={{
              insetInlineStart: `${(product.printArea.canvas.x + product.printArea.canvas.w * 0.2) * 100}%`,
              top: `${(product.printArea.canvas.y + product.printArea.canvas.h * 0.5) * 100}%`,
              width: `${product.printArea.canvas.w * 0.6 * 100}%`,
              transform: 'translateY(-50%)',
            }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-8 lg:w-[40%]">
        <fieldset className="flex flex-col gap-3">
          <legend className="text-small font-medium text-text">{designer.groups.product}</legend>
          <div className="flex flex-wrap gap-2">
            {products.map((p) => {
              const thumb =
                p.colors.find((c) => c.slug === stripColorFor(p))?.images.front ??
                p.colors[0]?.images.front ??
                '';
              const active = p.slug === product.slug;
              return (
                <span
                  key={p.slug}
                  className={cn(
                    'inline-flex h-11 items-center gap-2 rounded-pill border bg-surface ps-1.5 pe-4 text-small font-medium',
                    active
                      ? 'border-primary bg-accent-tint text-primary'
                      : 'border-border text-text',
                  )}
                >
                  <Image
                    src={thumb}
                    alt=""
                    width={32}
                    height={32}
                    className="size-8 rounded-pill object-cover"
                  />
                  {p.name}
                </span>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="text-small font-medium text-text">{designer.groups.color}</legend>
          <div className="flex items-center gap-3">
            {product.colors.map((c, i) => (
              <span key={c.slug} className="grid size-11 place-items-center" title={c.name}>
                <span
                  className={cn(
                    'block size-7 rounded-pill border border-border',
                    i === 0 && 'ring-2 ring-primary ring-offset-2 ring-offset-surface',
                  )}
                  // Swatch colours are product data (BRD Appendix A), not a design token.
                  style={{ backgroundColor: c.hex }}
                />
              </span>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-3">
          <p className="text-small font-medium text-text">{designer.groups.design}</p>
          <div className="flex flex-col items-center justify-center gap-2 rounded-base border border-dashed border-border bg-ground px-4 py-6 text-center">
            <span className="grid size-11 place-items-center rounded-pill bg-accent-tint text-primary">
              <Icon icon={Upload} size={20} />
            </span>
            <span className="text-body font-medium text-primary">{designer.upload}</span>
            <span className="text-caption text-text-muted">{designer.uploadHelper}</span>
          </div>
          <span className="inline-flex h-11 items-center px-5 font-medium text-primary">
            {designer.sample}
          </span>
        </div>

        <div className="flex flex-col gap-5">
          <p className="text-small font-medium text-text">{designer.groups.pricing}</p>
          <div className="flex items-center justify-between rounded-base bg-ground px-4 py-3">
            <span className="text-small text-text-muted">{designer.baseCostLabel}</span>
            <SarAmount value={product.baseCost} className="text-h4 text-text" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-4">
              <span className="text-small text-text">{designer.sellPriceLabel}</span>
              <span className="inline-flex h-11 items-center gap-1 rounded-base border border-border bg-surface px-3">
                <SarSymbol className="text-text-muted" />
                <span className="tabular w-16 text-body font-medium text-text" dir="ltr">
                  {product.suggestedPrice}
                </span>
              </span>
            </div>
            <div className="flex h-11 items-center">
              <span className="relative h-1.5 w-full rounded-pill bg-border">
                <span className="absolute inset-y-0 end-0 w-1/3 rounded-pill bg-primary" />
              </span>
            </div>
            <p className="text-caption text-text-muted">
              {designer.suggestedPriceHelper} <SarAmount value={product.suggestedPrice} />
            </p>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-small text-text">{designer.dailySalesLabel}</span>
            <span className="inline-flex h-11 items-center rounded-base border border-border bg-surface px-6 font-medium tabular">
              10
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-5 rounded-base bg-accent-tint p-5">
          <dl className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <dt className="text-caption text-text-muted">{designer.perPieceLabel}</dt>
              <dd>
                <SarAmount value={perPiece} className="text-h3 text-text" />
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-caption text-text-muted">{designer.monthlyLabel}</dt>
              <dd>
                <SarAmount value={monthly} className="text-h3 text-text" />
              </dd>
            </div>
          </dl>
          <div className="min-h-6" />
          <p className="text-caption text-text-muted">{designer.footnote}</p>
          <Button asChild size="lg" fullWidth>
            <a href={ctaHref} data-track="cta_click" data-location="designer">
              {designer.cta}
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
