import Image from 'next/image';
import { Badge } from '@/components/shared/badge';
import { Container } from '@/components/shared/container';
import { Reveal } from '@/components/shared/reveal';
import { Section, type SectionTone } from '@/components/shared/section';
import { SectionHeader } from '@/components/shared/section-header';
import { copyFor } from '@/content/copy';
import { getHome, getIntegrations } from '@/lib/cms';
import type { Locale } from '@/lib/i18n';

/** Integrations (BRD 6.4.8): logo tiles with the «متاح الآن» badge; not links in L1. */
export async function Integrations({
  locale,
  tone = 'surface',
}: {
  locale: Locale;
  tone?: SectionTone;
}) {
  const [{ integrations: copy }, integrations] = await Promise.all([
    getHome(locale),
    getIntegrations(locale),
  ]);
  const messages = copyFor(locale);
  if (!copy.enabled) return null;
  return (
    <Section id="integrations" tone={tone} aria-labelledby="integrations-title">
      <Container className="flex flex-col items-center gap-10">
        <SectionHeader id="integrations-title" title={copy.title} lead={copy.lead} align="center" />
        <ul className="grid w-full max-w-3xl grid-cols-3 gap-3 sm:gap-4">
          {integrations.map((item, i) => (
            <Reveal
              as="li"
              index={i}
              key={item.slug}
              aria-label={messages.integrations.tileAria.replace('{platform}', item.name)}
              className="flex flex-col items-center gap-3 rounded-base border border-border bg-surface px-3 py-6 text-center sm:px-6"
            >
              <Image
                src={item.logo}
                alt={`${item.nameLatin} logo`}
                width={40}
                height={40}
                className="h-10 w-auto"
              />
              <span className="text-h4 text-text">{item.name}</span>
              <Badge tone="success">{messages.integrations.availableTag}</Badge>
            </Reveal>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
