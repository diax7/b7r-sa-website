import { Upload } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/shared/button';
import { Icon } from '@/components/shared/icon';
import { SarAmount } from '@/components/shared/sar-amount';
import { SarSymbol } from '@/components/shared/sar-symbol';
import type { Product } from '@/content/schema';
import { designerColorFor } from '@/lib/product-helpers';
import { cn } from '@/lib/cn';
import { monthlyProfit, perPieceProfit } from '@/modules/designer/profit';
import type { DesignerCopy } from '@/modules/designer/types';

interface DesignerStaticProps {
  products: Product[];
  product: Product;
  copy: DesignerCopy;
  ctaHref: string;
}

/**
 * Server-rendered stand-in for the designer island (BRD 6.4.3): the same layout and copy,
 * no handlers, so crawlers and no-JS visitors see the real section and the page does not
 * shift when the island mounts (it mirrors the island's height on every breakpoint).
 */
export function DesignerStatic({ products, product, copy, ctaHref }: DesignerStaticProps) {
  const designer = copy;
  const color =
    product.colors.find((c) => c.slug === designerColorFor(product)) ?? product.colors[0];
  const perPiece = perPieceProfit(product.suggestedPrice, product.baseCost);
  const monthly = monthlyProfit(product.suggestedPrice, product.baseCost, 10);

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-8" data-designer-fallback="">
      <div className="order-first lg:order-last lg:w-[54%]">
        <div className="relative mx-auto aspect-square w-full max-w-[600px] overflow-hidden rounded-lg bg-ground">
          {color && (
            <Image
              src={color.images.front}
              alt={copy.mockupAlt.replace('{product}', product.name).replace('{color}', color.name)}
              fill
              sizes="(min-width: 1024px) 600px, 100vw"
              className="object-contain"
            />
          )}
          {/* The empty print area with the upload prompt, exactly where the island puts it. */}
          <div
            className="absolute flex flex-col items-center justify-center gap-2 rounded-inner border-2 border-dashed border-primary/50 bg-surface/70 px-3 text-center"
            style={{
              // The mockup is a picture: physical offsets match the canvas pixel space.
              left: `${product.printArea.canvas.x * 100}%`, // rtl-allow: canvas pixel space
              top: `${product.printArea.canvas.y * 100}%`,
              width: `${product.printArea.canvas.w * 100}%`,
              height: `${product.printArea.canvas.h * 100}%`,
            }}
          >
            <span className="grid size-11 place-items-center rounded-pill bg-accent-tint text-primary">
              <Icon icon={Upload} size={20} />
            </span>
            <span className="text-small font-medium text-primary">{designer.uploadPrompt}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:w-[46%]">
        <fieldset className="flex flex-col gap-3">
          <legend className="text-small font-medium text-text">{designer.groups.product}</legend>
          <div className="flex flex-wrap gap-2">
            {products.map((p) => {
              const thumb =
                p.colors.find((c) => c.slug === designerColorFor(p))?.images.front ??
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

        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between rounded-base bg-ground px-4 py-3">
            <span className="text-small text-text-muted">{designer.baseCostLabel}</span>
            <SarAmount value={product.baseCost} className="text-h4 text-text" />
          </div>
          {/* The same rows as `PricingControls`: the label with its helper beside the field,
              then the slider row, so the island's box is this box (the deep link and CLS). */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-4">
              <span className="flex flex-col gap-0.5">
                <span className="text-small text-text">{designer.sellPriceLabel}</span>
                <span className="text-caption text-text-muted">
                  {designer.suggestedPriceHelper} <SarAmount value={product.suggestedPrice} />
                </span>
              </span>
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
          <Button asChild size="lg" fullWidth variant={copy.ctaShiny ? 'shiny' : 'primary'}>
            <a href={ctaHref} data-track="cta_click" data-location="designer">
              {designer.cta}
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
