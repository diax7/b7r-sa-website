import { Badge } from '@/components/shared/badge';
import { Card } from '@/components/shared/card';
import { Container } from '@/components/shared/container';
import { Section } from '@/components/shared/section';
import { SectionHeader } from '@/components/shared/section-header';
import { home } from '@/content/home';
import { testimonials } from '@/content/testimonials';
import { env } from '@/lib/env';
import { shouldRenderTestimonials } from '@/modules/home/testimonials/rule';

/**
 * Testimonials (BRD 6.4.7). Sample entries carry a visible «نموذج» badge and
 * `data-placeholder`; on the production host the section is omitted until a real entry
 * exists (ADR-013). Mobile: snap carousel.
 */
export function Testimonials() {
  if (!shouldRenderTestimonials(testimonials, env.isProductionSite)) return null;
  const { testimonials: copy } = home;

  return (
    <Section id="testimonials" tone="ground" aria-labelledby="testimonials-title">
      <Container className="flex flex-col gap-10">
        <SectionHeader id="testimonials-title" eyebrow={copy.eyebrow} title={copy.title} />
      </Container>
      <ul
        className="no-scrollbar mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 sm:px-6 md:mx-auto md:grid md:max-w-(--container-page) md:grid-cols-3 md:overflow-visible"
        // Horizontal scroller on phones; axe requires a keyboard-reachable scroll region.
        // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
      >
        {testimonials.map((t) => (
          <li key={t.quote} className="w-[82vw] shrink-0 snap-start md:w-auto">
            <Card
              className="flex h-full flex-col gap-5 p-6"
              data-placeholder={t.placeholder ? '' : undefined}
            >
              <div className="flex items-start justify-between gap-4">
                <span
                  aria-hidden="true"
                  className="font-black text-[44px] leading-none text-accent-tint"
                >
                  «
                </span>
                {t.placeholder && <Badge tone="muted">{copy.placeholderTag}</Badge>}
              </div>
              <p className="lead font-light text-text">{t.quote}</p>
              <div className="mt-auto flex items-center gap-3 pt-2">
                <span aria-hidden="true" className="size-12 shrink-0 rounded-pill bg-accent-tint" />
                <div className="flex flex-col">
                  <span className="font-medium text-text">{t.name}</span>
                  <span className="text-small text-text-muted">{t.store}</span>
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </Section>
  );
}
