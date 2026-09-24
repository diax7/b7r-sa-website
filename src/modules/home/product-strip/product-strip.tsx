import Link from 'next/link';
import { Button } from '@/components/shared/button';
import { Container } from '@/components/shared/container';
import { Photo } from '@/components/shared/photo';
import { SarAmount } from '@/components/shared/sar-amount';
import { Section, type SectionTone } from '@/components/shared/section';
import { SectionHeader } from '@/components/shared/section-header';
import { copyFor } from '@/content/copy';
import { getHome, getProduct } from '@/lib/cms';
import { type Locale, localePath } from '@/lib/i18n';
import { stripColorFor } from '@/lib/product-helpers';
import { StripHint } from '@/modules/home/product-strip/strip-hint';

/**
 * Hover-expand product strip (BRD 6.4.2). Five real links; CSS owns the expansion so it works
 * with keyboard focus and without JS. Mobile: native snap carousel with labels always visible.
 */
export async function ProductStrip({
  locale,
  tone = 'surface',
}: {
  locale: Locale;
  tone?: SectionTone;
}) {
  const { productStrip } = await getHome(locale);
  const messages = copyFor(locale);
  const found = await Promise.all(productStrip.order.map((slug) => getProduct(locale, slug)));
  const items = productStrip.order.flatMap((slug, i) => {
    const product = found[i];
    // A strip product unpublished or deleted after the home was published: the strip keeps
    // rendering without it rather than freezing the home page's regeneration.
    if (!product) {
      console.warn(`product strip: ${slug} is not published, skipping the panel`);
      return [];
    }
    const color =
      product.colors.find((c) => c.slug === stripColorFor(product)) ?? product.colors[0];
    if (!color) throw new Error(`Product ${slug} has no colours`);
    return [{ product, color }];
  });

  return (
    <Section id="products" tone={tone} aria-labelledby="products-title" className="overflow-x-clip">
      <Container className="flex flex-col gap-10">
        <SectionHeader
          id="products-title"
          eyebrow={productStrip.eyebrow}
          title={productStrip.title}
          lead={productStrip.lead}
          action={
            <Button asChild variant="secondary" trailingArrow={false}>
              <Link href={localePath(locale, '/products')}>{productStrip.button}</Link>
            </Button>
          }
        />
      </Container>
      <div className="relative mt-10">
        <ul className="strip mx-auto max-w-(--container-page)" aria-label={messages.strip.label}>
          {items.map(({ product, color }) => (
            <li key={product.slug} className="contents">
              <Link
                href={localePath(locale, `/products/${product.slug}`)}
                prefetch={false}
                className="strip-panel"
                data-strip-panel={product.slug}
              >
                <Photo
                  src={color.images.front}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 20vw, 78vw"
                  blur={color.images.frontBlur}
                  className="object-cover object-center"
                />
                <span className="strip-label">
                  <span className="text-h4 text-white">{product.name}</span>
                  <span className="inline-flex h-8 items-center gap-1 rounded-pill bg-white px-3 text-small font-medium text-primary">
                    {productStrip.pricePrefix} <SarAmount value={product.baseCost} />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <StripHint label={messages.strip.swipeHint} />
      </div>
    </Section>
  );
}
