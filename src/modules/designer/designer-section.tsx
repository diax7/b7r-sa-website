import Image from 'next/image';
import { Container } from '@/components/shared/container';
import { SarAmount } from '@/components/shared/sar-amount';
import { Section } from '@/components/shared/section';
import { SectionHeader } from '@/components/shared/section-header';
import { home } from '@/content/home';
import { getProduct, products } from '@/content/products';
import messages from '@/messages/ar.json';
import { env } from '@/lib/env';
import { registerUrl } from '@/lib/utm';
import { DesignerLoader } from '@/modules/designer/designer-loader';
import type { DesignerCopy } from '@/modules/designer/types';

const DEFAULT_SLUG = 'tee-essential';

/**
 * Server shell for the interactive designer (BRD 6.4.3). Renders the section header and a
 * static preview (default mockup + labels) so the page is complete without JS; the Konva
 * island replaces the preview when the section nears the viewport.
 */
export function DesignerSection() {
  const { designer } = home;
  const product = getProduct(DEFAULT_SLUG) ?? products[0];
  if (!product) throw new Error('No products for the designer');
  const color = product.colors[0];

  const copy: DesignerCopy = {
    groups: designer.groups,
    upload: designer.upload,
    uploadHelper: designer.uploadHelper,
    sample: designer.sample,
    replace: designer.replace,
    reset: designer.reset,
    canvasHint: designer.canvasHint,
    baseCostLabel: designer.baseCostLabel,
    sellPriceLabel: designer.sellPriceLabel,
    suggestedPriceHelper: designer.suggestedPriceHelper,
    dailySalesLabel: designer.dailySalesLabel,
    perPieceLabel: designer.perPieceLabel,
    monthlyLabel: designer.monthlyLabel,
    negativeWarning: designer.negativeWarning,
    footnote: designer.footnote,
    cta: designer.cta,
    fileError: designer.fileError,
    canvasLabel: messages.designer.canvasLabel,
    productGroupAria: messages.designer.productGroupLabel,
    colorOptionAria: messages.designer.colorOption,
    sellInputAria: messages.designer.sellPriceInput,
    sellSliderAria: messages.designer.sellPriceSlider,
    dailyDecrementAria: messages.designer.dailySalesDecrement,
    dailyIncrementAria: messages.designer.dailySalesIncrement,
    thumbnailAria: messages.designer.designThumbnail,
    dropzoneAria: messages.designer.dropzoneLabel,
  };

  const fallback = (
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
        </div>
      </div>
      <div className="flex flex-col gap-4 lg:w-[40%]">
        <dl className="flex flex-col gap-4">
          <div className="flex items-center justify-between rounded-base bg-ground px-4 py-3">
            <dt className="text-small text-text-muted">{designer.baseCostLabel}</dt>
            <dd>
              <SarAmount value={product.baseCost} className="text-h4" />
            </dd>
          </div>
          <div className="flex items-center justify-between rounded-base bg-ground px-4 py-3">
            <dt className="text-small text-text-muted">{designer.suggestedPriceHelper}</dt>
            <dd>
              <SarAmount value={product.suggestedPrice} className="text-h4" />
            </dd>
          </div>
        </dl>
        <p className="text-caption text-text-muted">{designer.footnote}</p>
      </div>
    </div>
  );

  return (
    <Section
      id="designer"
      tone="ground"
      aria-labelledby="designer-title"
      className="pb-28 lg:pb-24"
    >
      <Container className="flex flex-col gap-10">
        <SectionHeader
          id="designer-title"
          eyebrow={designer.eyebrow}
          title={designer.title}
          lead={designer.lead}
        />
        <div className="rounded-lg border border-border bg-surface p-4 sm:p-6 lg:p-8">
          <DesignerLoader
            products={products}
            initialSlug={DEFAULT_SLUG}
            registerUrlTemplate={registerUrl(env.appUrl, {
              campaign: 'designer',
              product: '__SLUG__',
            })}
            copy={copy}
            fallback={fallback}
          />
        </div>
      </Container>
    </Section>
  );
}
