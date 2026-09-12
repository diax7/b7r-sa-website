import { Container } from '@/components/shared/container';
import { Section, type SectionTone } from '@/components/shared/section';
import { SectionHeader } from '@/components/shared/section-header';
import { placeholderCopy } from '@/content/pages';
import { env } from '@/lib/env';

interface PlaceholderSectionProps {
  id: string;
  eyebrow?: string | undefined;
  title: string;
  tone: SectionTone;
}

/**
 * Stand-in for the home sections Phase 1b builds (plan §H): the real H2 from BRD 4.4 plus a
 * muted developer label that appears only on preview hosts (the same signal as the noindex
 * guard), so the gate build shows it and b7r.sa never would.
 */
export function PlaceholderSection({ id, eyebrow, title, tone }: PlaceholderSectionProps) {
  return (
    <Section id={id} tone={tone} aria-labelledby={`${id}-title`} data-placeholder="">
      <Container>
        <SectionHeader id={`${id}-title`} eyebrow={eyebrow} title={title} />
        {!env.isProductionSite && (
          <p className="mt-6 inline-flex items-center gap-2 rounded-pill border border-dashed border-border px-4 py-1.5 text-caption text-text-muted">
            <span className="size-1.5 rounded-pill bg-warning" aria-hidden="true" />
            {placeholderCopy.label}
          </p>
        )}
      </Container>
    </Section>
  );
}
