import { Container } from '@/components/shared/container';
import { Section } from '@/components/shared/section';
import { SectionHeader } from '@/components/shared/section-header';
import { home } from '@/content/home';
import { getProduct, products } from '@/content/products';
import messages from '@/messages/ar.json';
import { env } from '@/lib/env';
import { registerUrl } from '@/lib/utm';
import { DesignerLoader } from '@/modules/designer/designer-loader';
import { DesignerStatic } from '@/modules/designer/designer-static';
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

  const registerTemplate = registerUrl(env.appUrl, { campaign: 'designer', product: '__SLUG__' });
  const fallback = (
    <DesignerStatic
      products={products}
      product={product}
      ctaHref={registerTemplate.replace('__SLUG__', product.slug)}
    />
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
            registerUrlTemplate={registerTemplate}
            copy={copy}
            fallback={fallback}
          />
        </div>
      </Container>
    </Section>
  );
}
