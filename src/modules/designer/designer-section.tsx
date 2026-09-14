import { Container } from '@/components/shared/container';
import { Section } from '@/components/shared/section';
import { SectionHeader } from '@/components/shared/section-header';
import { copyFor } from '@/content/copy';
import { getHome, getProduct, getProducts } from '@/lib/cms';
import { env } from '@/lib/env';
import type { Locale } from '@/lib/i18n';
import { registerUrl } from '@/lib/utm';
import { DesignerLoader } from '@/modules/designer/designer-loader';
import { DesignerStatic } from '@/modules/designer/designer-static';
import { designerCopy } from '@/modules/designer/types';

const DEFAULT_SLUG = 'tee-essential';

/**
 * Server shell for the interactive designer (BRD 6.4.3). Renders the section header and a
 * static preview (default mockup + labels) so the page is complete without JS; the Konva
 * island replaces the preview when the section nears the viewport.
 */
export async function DesignerSection({ locale }: { locale: Locale }) {
  const [{ designer }, products] = await Promise.all([getHome(locale), getProducts(locale)]);
  const product = (await getProduct(locale, DEFAULT_SLUG)) ?? products[0];
  if (!product) throw new Error('No products for the designer');

  const copy = designerCopy(copyFor(locale), designer.cta);

  const registerTemplate = registerUrl(env.appUrl, { campaign: 'designer', product: '__SLUG__' });
  const fallback = (
    <DesignerStatic
      products={products}
      product={product}
      copy={copy}
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
