import Image from 'next/image';
import Link from 'next/link';
import { Container } from '@/components/shared/container';
import { Reveal } from '@/components/shared/reveal';
import { SarAmount } from '@/components/shared/sar-amount';
import { Section } from '@/components/shared/section';
import { SectionHeader } from '@/components/shared/section-header';
import { homeFaq } from '@/content/faq';
import { home } from '@/content/home';
import { howItWorksPage, productsPage } from '@/content/pages';
import { getSeo } from '@/content/seo';
import { howItWorksSteps } from '@/content/steps';
import { cn } from '@/lib/cn';
import { siteBase } from '@/lib/env';
import { CtaRibbon, FaqAccordionLoader, FaqStaticList, JsonLd, jsonLd } from '@/modules/core';

const ROUTE = '/how-it-works';

/** «مثال: تيشيرت تبيعه بـ 89 وتكلفته 45، ربحك 44 لكل قطعة.» with every number as `SarAmount`. */
export function ExampleLine({ text }: { text: string }) {
  // Static content: the segment text plus its offset is a stable key.
  const parts = text.split(/(\d+)/).map((part, i) => ({ part, key: `${i}-${part}` }));
  return (
    <p className="lead text-text">
      {parts.map(({ part, key }) =>
        /^\d+$/.test(part) ? (
          <SarAmount key={key} value={Number(part)} className="font-medium text-primary" />
        ) : (
          <span key={key}>{part}</span>
        ),
      )}
    </p>
  );
}

/** How it works (BRD 6.7, 4.9). */
export function HowItWorksPage() {
  const copy = howItWorksPage;
  const base = siteBase();
  const seo = getSeo(ROUTE);
  // Mini FAQ: home items 2, 3, 4 (BRD 4.9).
  const mini = homeFaq.slice(1, 4).map((f) => ({ question: f.question, answer: f.answer }));
  const tiles = [copy.equation.sell, copy.equation.base, copy.equation.profit];

  return (
    <>
      <JsonLd
        nodes={[
          jsonLd.webPage(base, ROUTE, seo.title, seo.description),
          jsonLd.breadcrumbs(base, [
            { name: productsPage.breadcrumbHome, path: '/' },
            { name: copy.title, path: ROUTE },
          ]),
        ]}
      />

      <Section tone="surface" className="pt-10 md:pt-16" aria-labelledby="hiw-title">
        <Container className="flex flex-col gap-16">
          <SectionHeader as="h1" id="hiw-title" title={copy.title} lead={copy.lead} />
          <ol className="flex flex-col gap-12 md:gap-16">
            {howItWorksSteps.map((step, i) => (
              <Reveal
                as="li"
                key={step.order}
                index={0}
                className="grid items-center gap-6 md:grid-cols-2 md:gap-12"
              >
                {/* Icon on the end side for odd rows, start side for even rows (BRD 6.7). */}
                <div className={cn('flex md:justify-center', i % 2 === 0 && 'md:order-last')}>
                  <Image
                    src={step.icon}
                    alt=""
                    width={555}
                    height={555}
                    sizes="(min-width: 768px) 280px, 200px"
                    className="size-[200px] rounded-lg object-cover md:size-[280px]"
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <span className="eyebrow tabular">{String(step.order).padStart(2, '0')}</span>
                  <h2 className="text-h3 text-text">{step.title}</h2>
                  <p className="lead measure text-text-muted">{step.text}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </Container>
      </Section>

      <Section tone="ground" aria-labelledby="profit-title">
        <Container className="flex flex-col items-center gap-10 text-center">
          <h2 id="profit-title" className="text-h2 text-text">
            {copy.profitTitle}
          </h2>
          <ol
            className="flex flex-wrap items-center justify-center gap-3 sm:gap-4"
            data-equation=""
          >
            {tiles.map((label, i) => (
              <li key={label} className="contents">
                <span className="rounded-base border border-border bg-surface px-6 py-4 text-h4 text-text">
                  {label}
                </span>
                {i < tiles.length - 1 && (
                  <span aria-hidden="true" className="text-h3 text-text-muted">
                    {i === 0 ? '−' : '='}
                  </span>
                )}
              </li>
            ))}
          </ol>
          <ExampleLine text={copy.exampleLine} />
        </Container>
      </Section>

      <Section tone="surface" aria-labelledby="hiw-faq-title">
        <Container className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-16">
          <div className="flex flex-col items-start gap-6">
            <SectionHeader id="hiw-faq-title" title={home.faq.title} />
            <Link href="/faq" className="py-2 font-medium text-primary hover:text-primary-hover">
              {home.faq.link}
            </Link>
          </div>
          <FaqAccordionLoader items={mini} fallback={<FaqStaticList items={mini} />} />
        </Container>
      </Section>

      <CtaRibbon topTone="surface" page="how-it-works" />
    </>
  );
}
