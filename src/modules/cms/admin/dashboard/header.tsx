import { Link } from '@payloadcms/ui';
import { CircleAlert, CircleCheck } from 'lucide-react';
import { Icon } from '@/components/shared/icon';
import { cn } from '@/lib/cn';
import {
  DASHBOARD_RANGES,
  type DashboardRange,
  type Daypart,
  type HandItem,
} from '@/modules/cms/admin/dashboard/rules';
import { adminStringsFor } from '@/modules/cms/admin/strings';

/**
 * The top of the dashboard (ADR-059): the greeting by the Riyadh hour with the name in the
 * accent, the 7 / 30 / 90 day range at the trailing edge (links, so the server renders the
 * chosen range with no client state), and the "needs a hand" line: each item a link to the
 * place that fixes it, or one sentence when nothing does.
 */
export function DashboardHeader({
  name,
  daypart,
  days,
  adminRoute,
  hand,
  language,
}: {
  name: string;
  daypart: Daypart;
  days: DashboardRange;
  adminRoute: string;
  hand: HandItem[];
  language: string;
}) {
  const s = adminStringsFor(language);
  const [before, after] = s.dashboard.greeting[daypart].split('{name}');
  return (
    <header className="flex flex-col gap-3" data-admin-dashboard-header="">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-h2 text-text">
          {before}
          <span className="text-accent">{name}</span>
          {after}
        </h1>
        <nav aria-label={s.dashboard.range} className="flex gap-2" data-admin-dashboard-range="">
          {DASHBOARD_RANGES.map((r) => (
            <Link
              key={r}
              href={`${adminRoute}?days=${r}`}
              aria-current={r === days ? 'page' : undefined}
              className={cn(
                'rounded-pill border px-3 py-1 text-small transition-colors duration-(--duration-fast) focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40',
                r === days
                  ? 'border-accent bg-accent-tint text-accent'
                  : 'border-border text-text-muted hover:text-text',
              )}
            >
              {s.traffic.page.days(r)}
            </Link>
          ))}
        </nav>
      </div>
      {hand.length === 0 ? (
        <p
          className="flex items-center gap-2 text-small text-text-muted"
          data-admin-dashboard-hand="none"
        >
          <Icon icon={CircleCheck} size={16} className="text-success" />
          {s.dashboard.hand.none}
        </p>
      ) : (
        <div className="flex flex-col gap-1" data-admin-dashboard-hand={hand.length}>
          <p className="flex items-center gap-2 text-small font-medium text-text">
            <Icon icon={CircleAlert} size={16} className="text-warning" />
            {s.dashboard.hand.title}
          </p>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 ps-6 text-small">
            {hand.map((item) => (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className="text-accent hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40"
                  data-admin-hand={item.key}
                >
                  {item.text}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
