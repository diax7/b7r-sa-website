import { Link } from '@payloadcms/ui';
import { Rocket } from 'lucide-react';
import { Card } from '@/components/shared/card';
import { Icon } from '@/components/shared/icon';
import type { QuickAction } from '@/modules/cms/admin/dashboard/data';
import { HUE_CLASSES } from '@/modules/cms/admin/icons';

/**
 * Big icon tiles: one per thing an editor does most, each in its entity's hue. In-admin tiles
 * are Payload's `Link` (no reload); the site tile opens a new tab.
 */
export function QuickActions({ actions, title }: { actions: QuickAction[]; title: string }) {
  return (
    <section aria-labelledby="dashboard-quick" className="flex flex-col gap-4">
      <h2 id="dashboard-quick" className="flex items-center gap-2 text-h4 text-text">
        <Icon icon={Rocket} size={20} className="text-accent" />
        {title}
      </h2>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-admin-quick-actions="">
        {actions.map((a) => (
          <li key={a.key}>
            <Card hoverable className="h-full">
              <Tile action={a}>
                <span
                  className={`grid size-11 shrink-0 place-items-center rounded-pill ${HUE_CLASSES[a.hue]}`}
                >
                  <Icon icon={a.icon} size={22} />
                </span>
                <span className="min-w-0">
                  <span className="block text-small font-medium text-text">{a.title}</span>
                  <span className="block text-caption text-text-muted">{a.text}</span>
                </span>
              </Tile>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}

const tile =
  'flex h-full items-center gap-4 rounded-base p-4 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40';

function Tile({ action, children }: { action: QuickAction; children: React.ReactNode }) {
  const attrs = { className: tile, 'data-admin-action': action.key, 'data-hue': action.hue };
  if (action.external) {
    return (
      <a href={action.href} target="_blank" rel="noopener" {...attrs}>
        {children}
      </a>
    );
  }
  return (
    <Link href={action.href} {...attrs}>
      {children}
    </Link>
  );
}
