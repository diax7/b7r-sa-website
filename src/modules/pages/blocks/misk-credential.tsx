import Image from 'next/image';
import { Container } from '@/components/shared/container';
import { Section } from '@/components/shared/section';
import { cn } from '@/lib/cn';
import type { BlockProps } from '@/modules/pages/blocks/types';

/** The MISK Launchpad credential on an accent-tint card (BRD 6.8); the logo ships with the code. */
export function MiskCredentialBlock({
  block,
  tone,
  anchor,
  heading,
}: BlockProps<'miskCredential'>) {
  const Heading = heading ? 'h1' : 'h2';
  return (
    <Section
      tone={tone}
      className={heading ? 'pt-10 md:pt-16' : undefined}
      aria-labelledby={`${anchor}-title`}
      data-block="miskCredential"
    >
      <Container>
        <div className="grid items-center gap-8 rounded-lg bg-accent-tint p-6 md:grid-cols-[240px_1fr] md:gap-12 md:p-10">
          <div className="grid place-items-center rounded-base bg-surface p-5 shadow-card">
            <Image
              src="/images/badges/misk-foundation-logo.png"
              alt="Misk Foundation"
              width={400}
              height={230}
              className="h-auto w-[180px]"
            />
          </div>
          <div className="flex flex-col gap-3">
            <Heading
              id={`${anchor}-title`}
              className={cn(heading ? 'text-h1' : 'text-h3', 'text-text')}
            >
              {heading?.title ?? block.title}
            </Heading>
            <p className="text-body text-text-muted">{block.text}</p>
          </div>
        </div>
      </Container>
    </Section>
  );
}
