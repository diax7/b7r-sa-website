import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/cn';

export type SectionTone = 'surface' | 'ground';

interface SectionProps extends ComponentPropsWithoutRef<'section'> {
  tone?: SectionTone;
  /**
   * Fades up once when scrolled into view (BRD 3.7, ADR-055); on by default so every section
   * of every page, present and future, reveals. Off for a section that holds a `position:
   * fixed` child (the transform would become its containing block) or sits above the fold.
   */
  reveal?: boolean;
}

/** Vertical rhythm and alternating background (§3.4). */
export function Section({ tone = 'surface', reveal = true, className, ...rest }: SectionProps) {
  return (
    <section
      data-tone={tone}
      data-reveal={reveal ? '' : undefined}
      className={cn('section-pad', tone === 'ground' ? 'bg-ground' : 'bg-surface', className)}
      {...rest}
    />
  );
}
