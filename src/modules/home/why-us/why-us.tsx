import { ShieldCheck, Workflow, Zap, type LucideIcon } from 'lucide-react';
import { Card } from '@/components/shared/card';
import { Container } from '@/components/shared/container';
import { Icon } from '@/components/shared/icon';
import { Reveal } from '@/components/shared/reveal';
import { Section, type SectionTone } from '@/components/shared/section';
import { SectionHeader } from '@/components/shared/section-header';
import type { WhyUsItem } from '@/content/schema';
import { getHome } from '@/lib/cms';

const ICONS: Record<WhyUsItem['icon'], LucideIcon> = { ShieldCheck, Workflow, Zap };

/** Why us (BRD 6.4.6): three hairline cards, icon circle, H3, one line. */
export async function WhyUs({ tone = 'surface' }: { tone?: SectionTone }) {
  const { whyUs } = await getHome();
  if (!whyUs.enabled) return null;
  return (
    <Section id="why-us" tone={tone} aria-labelledby="why-us-title">
      <Container className="flex flex-col gap-10">
        <SectionHeader id="why-us-title" eyebrow={whyUs.eyebrow} title={whyUs.title} />
        <ul className="grid gap-4 md:grid-cols-3">
          {whyUs.items.map((item, i) => (
            <Reveal as="li" index={i} key={item.title}>
              <Card hoverable className="flex h-full flex-col gap-4 p-6">
                <span className="grid size-14 place-items-center rounded-pill bg-accent-tint text-primary">
                  <Icon icon={ICONS[item.icon]} size={26} />
                </span>
                <h3 className="text-h3">{item.title}</h3>
                <p className="text-text-muted">{item.text}</p>
              </Card>
            </Reveal>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
