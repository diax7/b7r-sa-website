import { Card } from '@/components/shared/card';
import { Icon } from '@/components/shared/icon';
import type { QuickAction } from '@/modules/cms/admin/dashboard/data';
import { adminStrings } from '@/modules/cms/admin/strings';

/** Big icon tiles: one per thing an editor does most; each is a plain link. */
export function QuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <section aria-labelledby="dashboard-quick" className="flex flex-col gap-4">
      <h2 id="dashboard-quick" className="text-h4 text-text">
        {adminStrings.dashboard.quick}
      </h2>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-admin-quick-actions="">
        {actions.map((a) => (
          <li key={a.key}>
            <Card hoverable className="h-full">
              <a
                href={a.href}
                {...(a.external ? { target: '_blank', rel: 'noopener' } : {})}
                className="flex h-full items-center gap-4 rounded-base p-4 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40"
                data-admin-action={a.key}
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-pill bg-accent-tint text-accent">
                  <Icon icon={a.icon} size={22} />
                </span>
                <span className="min-w-0">
                  <span className="block text-small font-medium text-text">{a.title}</span>
                  <span className="block text-caption text-text-muted">{a.text}</span>
                </span>
              </a>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
