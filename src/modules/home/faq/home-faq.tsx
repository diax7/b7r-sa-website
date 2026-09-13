import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Container } from '@/components/shared/container';
import { Icon } from '@/components/shared/icon';
import { Section, type SectionTone } from '@/components/shared/section';
import { SectionHeader } from '@/components/shared/section-header';
import { homeFaq } from '@/content/faq';
import { home } from '@/content/home';
import { FaqAccordionLoader, FaqStaticList } from '@/modules/core';

/**
 * Home FAQ (BRD 6.4.9): header + link at the start, accordion at the end. The questions and
 * answers are server-rendered as a plain list (crawlers, no-JS) until the Radix accordion
 * mounts near the viewport.
 */
export function HomeFaq({ tone = 'ground' }: { tone?: SectionTone }) {
  const { faq } = home;
  const items = homeFaq.map((f) => ({ question: f.question, answer: f.answer }));

  return (
    <Section id="faq" tone={tone} aria-labelledby="faq-title">
      <Container className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-16">
        <div className="flex flex-col items-start gap-6">
          <SectionHeader id="faq-title" title={faq.title} />
          <Link
            href="/faq"
            className="inline-flex items-center gap-2 py-2 font-medium text-primary hover:text-primary-hover"
          >
            {faq.link}
            <Icon icon={ArrowRight} size={18} />
          </Link>
        </div>
        <FaqAccordionLoader items={items} fallback={<FaqStaticList items={items} />} />
      </Container>
    </Section>
  );
}
