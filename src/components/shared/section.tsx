import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/cn';

export type SectionTone = 'surface' | 'ground';

interface SectionProps extends ComponentPropsWithoutRef<'section'> {
  tone?: SectionTone;
}

/** Vertical rhythm and alternating background (§3.4). */
export function Section({ tone = 'surface', className, ...rest }: SectionProps) {
  return (
    <section
      data-tone={tone}
      className={cn('section-pad', tone === 'ground' ? 'bg-ground' : 'bg-surface', className)}
      {...rest}
    />
  );
}
