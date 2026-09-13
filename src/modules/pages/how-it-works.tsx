import Image from 'next/image';
import Link from 'next/link';
import { Container } from '@/components/shared/container';
import { Reveal } from '@/components/shared/reveal';
import { SarAmount } from '@/components/shared/sar-amount';
import { Section } from '@/components/shared/section';
import { SectionHeader } from '@/components/shared/section-header';
import { howItWorksPage, productsPage } from '@/content/pages';
import { getHome, getHomeFaqs, getSeo } from '@/lib/cms';
import { howItWorksSteps } from '@/content/steps';
import { cn } from '@/lib/cn';
import { siteBase } from '@/lib/env';
import { FaqAccordionLoader, FaqStaticList, JsonLd, jsonLd } from '@/modules/core';
import { CtaRibbon } from '@/modules/core/cta-ribbon';

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
export async function HowItWorksPage() {
  const copy = howItWorksPage;
  const base = siteBase();
  const [seo, home, homeFaq] = await Promise.all([getSeo(ROUTE), getHome(), getHomeFaqs()]);
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

      {/* The journey (BRD 6.7, amended 2026-09-13): five steps on one connected path — across
          the top on desktop, down the start side on phones — with a progress line that fills
          as the section scrolls (CSS scroll timeline; static where unsupported or under
          reduced motion). */}
      <Section tone="surface" className="pt-10 md:pt-16" aria-labelledby="hiw-title">
        <Container className="flex flex-col gap-14">
          <SectionHeader as="h1" id="hiw-title" title={copy.title} lead={copy.lead} />
          <div className="flow" data-flow="">
            <div className="flow-track" aria-hidden="true">
              <div className="flow-progress" />
            </div>
            <ol className="flow-list">
              {howItWorksSteps.map((step, i) => (
                <Reveal as="li" key={step.order} index={i} className="flow-item">
                  <span className="flow-icon">
                    <Image
                      src={step.icon}
                      alt=""
                      width={120}
                      height={120}
                      className="size-full object-cover"
                    />
                    <span className="flow-number tabular">{step.order}</span>
                  </span>
                  <div className="flex flex-col gap-2">
                    <h2 className="text-h4 text-text">{step.title}</h2>
                    <p className="text-body text-text-muted">{step.text}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>
        </Container>
      </Section>

      <Section tone="ground" aria-labelledby="profit-title">
        <Container>
          <div className="flex flex-col items-center gap-8 rounded-lg border border-border bg-surface p-6 text-center shadow-card md:p-10">
            <h2 id="profit-title" className="text-h2 text-text">
              {copy.profitTitle}
            </h2>
            <ol
              className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap sm:gap-4"
              data-equation=""
            >
              {tiles.map((label, i) => (
                <li key={label} className="contents">
                  <span
                    className={cn(
                      'rounded-base border px-6 py-4 text-h4',
                      i === tiles.length - 1
                        ? 'border-primary bg-accent-tint text-primary'
                        : 'border-border bg-ground text-text',
                    )}
                  >
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
          </div>
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
