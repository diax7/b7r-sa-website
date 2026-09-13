import Image from 'next/image';
import { Container } from '@/components/shared/container';
import { Reveal } from '@/components/shared/reveal';
import { Section } from '@/components/shared/section';
import { SectionHeader } from '@/components/shared/section-header';
import type { BlockProps } from '@/modules/pages/blocks/types';

/**
 * The journey (BRD 6.7, amended 2026-09-13): numbered 3D icons on one connected path —
 * across the top from `lg`, down the start side on phones — with a progress line that fills
 * as the track scrolls through the viewport (CSS view timeline; full and static where
 * unsupported or under reduced motion).
 */
export function StepsBlock({ block, tone, heading }: BlockProps<'steps'>) {
  return (
    <Section
      tone={tone}
      className={heading ? 'pt-10 md:pt-16' : undefined}
      {...(heading
        ? { 'aria-labelledby': 'steps-title' }
        : { 'aria-label': block.items[0]?.title })}
    >
      <Container className="flex flex-col gap-14">
        {heading && (
          <SectionHeader
            as="h1"
            id="steps-title"
            title={heading.title}
            {...(heading.lead ? { lead: heading.lead } : {})}
          />
        )}
        <div className="flow" data-flow="">
          <div className="flow-track" aria-hidden="true">
            <div className="flow-progress" />
          </div>
          <ol className="flow-list">
            {block.items.map((step, i) => (
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
  );
}
