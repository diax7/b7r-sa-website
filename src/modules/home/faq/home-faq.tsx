import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Container } from '@/components/shared/container';
import { Icon } from '@/components/shared/icon';
import { Section, type SectionTone } from '@/components/shared/section';
import { SectionHeader } from '@/components/shared/section-header';
import { getHome, getHomeFaqs } from '@/lib/cms';
import { type Locale, localePath } from '@/lib/i18n';
import { FaqAccordionLoader } from '@/modules/core/faq/faq-accordion-loader';
import { FaqClosedList } from '@/modules/core/faq/faq-closed-list';

/**
 * Home FAQ (BRD 6.4.9): header + link at the start, accordion at the end. The rows are
 * server-rendered closed with every answer in the DOM (crawlers); the accordion island mounts
 * near the viewport over the same boxes (no layout shift, nothing in the first-paint JS).
 */
export async function HomeFaq({ locale, tone = 'ground' }: { locale: Locale; tone?: SectionTone }) {
  const [{ faq }, homeFaq] = await Promise.all([getHome(locale), getHomeFaqs(locale)]);
  if (!faq.enabled) return null;
  const items = homeFaq.map((f) => ({ question: f.question, answer: f.answer }));

  return (
    <Section id="faq" tone={tone} aria-labelledby="faq-title">
      <Container className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-16">
        <div className="flex flex-col items-start gap-6">
          <SectionHeader id="faq-title" title={faq.title} />
          <Link
            href={localePath(locale, '/faq')}
            className="inline-flex items-center gap-2 py-2 font-medium text-primary hover:text-primary-hover"
          >
            {faq.link}
            <Icon icon={ArrowRight} size={18} />
          </Link>
        </div>
        <FaqAccordionLoader items={items} fallback={<FaqClosedList items={items} />} />
      </Container>
    </Section>
  );
}
