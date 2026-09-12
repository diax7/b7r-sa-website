import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface SectionHeaderProps {
  eyebrow?: string | undefined;
  title: string;
  lead?: string;
  /** Renders the title as this heading level; H2 for sections (§7.9). */
  as?: 'h1' | 'h2';
  align?: 'start' | 'center';
  id?: string;
  /** Slot rendered at the end of the header row on desktop (e.g. a secondary button). */
  action?: ReactNode;
  className?: string;
}

/** Eyebrow + title + lead, start-aligned by default (§3.10). */
export function SectionHeader({
  eyebrow,
  title,
  lead,
  as = 'h2',
  align = 'start',
  id,
  action,
  className,
}: SectionHeaderProps) {
  const Heading = as;
  return (
    <div
      className={cn(
        'flex flex-col gap-6 md:flex-row md:items-end md:justify-between',
        align === 'center' && 'items-center text-center md:flex-col md:items-center',
        className,
      )}
    >
      <div
        className={cn('flex flex-col gap-3', align === 'center' ? 'items-center' : 'items-start')}
      >
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <Heading id={id} className={cn(as === 'h1' ? 'text-h1' : 'text-h2', 'text-text')}>
          {title}
        </Heading>
        {lead && <p className="lead measure text-text-muted">{lead}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
