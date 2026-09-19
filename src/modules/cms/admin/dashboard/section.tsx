import { Link } from '@payloadcms/ui';
import { CircleOff, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card } from '@/components/shared/card';
import { Icon } from '@/components/shared/icon';
import { cn } from '@/lib/cn';
import { type Hue, HUE_TEXT_CLASSES } from '@/modules/cms/admin/icons';
import { adminStringsFor } from '@/modules/cms/admin/strings';

/**
 * One section of the dashboard (ADR-059): a card with an icon and a title at the start, an
 * optional link or badge at the end, and its `data-admin-dashboard-<hook>` for the e2e.
 * The icon takes the group's hue and is the card's one hue carrier (ADR-060): the body
 * stays neutral, and never two hues in one card.
 */
export function DashboardSection({
  hook,
  title,
  icon,
  hue,
  end,
  children,
  className,
  ...rest
}: {
  hook: string;
  title: string;
  icon: LucideIcon;
  hue: Hue;
  end?: ReactNode;
  children: ReactNode;
  className?: string;
} & Record<`data-${string}`, string | number | undefined>) {
  const id = `dashboard-${hook}`;
  return (
    <Card
      role="region"
      aria-labelledby={id}
      className={cn('flex flex-col gap-4 p-5', className)}
      {...{ [`data-admin-dashboard-${hook}`]: '' }}
      {...rest}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id={id} className="flex items-center gap-2 text-h4 text-text">
          <Icon icon={icon} size={20} className={HUE_TEXT_CLASSES[hue]} data-admin-hue={hue} />
          {title}
        </h2>
        {end}
      </div>
      {children}
    </Card>
  );
}

/** A section whose reader failed: its title and the "not available" word, never a blank page. */
export function EmptySection({
  hook,
  title,
  hue,
  language,
}: {
  hook: string;
  title: string;
  hue: Hue;
  language: string;
}) {
  return (
    <DashboardSection
      hook={hook}
      title={title}
      icon={CircleOff}
      hue={hue}
      data-admin-dashboard-empty={hook}
    >
      <p className="text-small text-text-muted">
        {adminStringsFor(language).dashboard.tiles.unavailable}
      </p>
    </DashboardSection>
  );
}

/** The link at the end of a section's title row: "All traffic", "The full ledger". */
export function SectionLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="shrink-0 text-caption text-accent hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40"
    >
      {children}
    </Link>
  );
}

/** A number with its caption, as the cards' figures read. */
export function Stat({
  label,
  value,
  href,
  hook,
}: {
  label: string;
  value: string;
  href?: string;
  hook?: string;
}) {
  const number = <span className="text-h4 text-text tabular-nums">{value}</span>;
  return (
    <div className="flex flex-col gap-0.5" data-admin-stat={hook}>
      <span className="text-caption text-text-muted">{label}</span>
      {href ? (
        <Link
          href={href}
          className="self-start rounded-inner hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          {number}
        </Link>
      ) : (
        number
      )}
    </div>
  );
}

export type BarTone = Hue | 'warning' | 'error';

/** Literal classes per tone, so the scanner keeps them: an identity hue, or a meaning. */
const FILL: Record<BarTone, string> = {
  blue: 'bg-accent',
  teal: 'bg-teal',
  violet: 'bg-violet',
  pink: 'bg-pink',
  slate: 'bg-slate',
  green: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
};

/**
 * A bar on the surface track: the fill is the group's identity hue (identity, not meaning) or
 * amber and red when the bar itself carries a warning (no limit, over the limit). Logical
 * properties only: the fill grows from the start edge in both directions.
 */
export function Bar({ percent, tone }: { percent: number; tone: BarTone }) {
  const width = Math.max(0, Math.min(100, percent));
  return (
    <span className="block h-2 w-full overflow-hidden rounded-pill bg-surface-2" aria-hidden="true">
      <span
        className={cn('block h-full rounded-pill', FILL[tone])}
        style={{ inlineSize: `${width}%` }}
      />
    </span>
  );
}
