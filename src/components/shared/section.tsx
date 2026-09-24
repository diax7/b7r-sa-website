import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/cn';

/**
 * A section's background set, by key (spec 010, phase 1c): `surface` and `ground` are today's
 * two tones, `deep-sea` the footer's navy, and any other key names a set of the Appearance
 * global's library (Sea mist ships there). An unknown key paints the page's white.
 */
export type SectionTone = 'surface' | 'ground' | 'deep-sea' | (string & {});

interface SectionProps extends ComponentPropsWithoutRef<'section'> {
  tone?: SectionTone;
  /**
   * Fades up once when scrolled into view (BRD 3.7, ADR-055); on by default so every section
   * of every page, present and future, reveals. Off for a section that holds a `position:
   * fixed` child (the transform would become its containing block) or sits above the fold.
   */
  reveal?: boolean;
}

/**
 * Vertical rhythm and the section's background set (§3.4, spec 010). `data-surface` names
 * the set; `globals.css` and the head's style block paint it: the background, its text, its
 * links and its button, while the cards inside keep the page's tones.
 */
export function Section({ tone = 'surface', reveal = true, className, ...rest }: SectionProps) {
  return (
    <section
      data-surface={tone}
      data-reveal={reveal ? '' : undefined}
      className={cn('section-pad surface', className)}
      {...rest}
    />
  );
}
