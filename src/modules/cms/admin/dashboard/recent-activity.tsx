import { Link } from '@payloadcms/ui';
import { History } from 'lucide-react';
import { Badge } from '@/components/shared/badge';
import { Card } from '@/components/shared/card';
import { Icon } from '@/components/shared/icon';
import type { RecentItem } from '@/modules/cms/admin/dashboard/data';
import { relativeTime } from '@/modules/cms/admin/dashboard/relative-time';
import { HUE_CLASSES } from '@/modules/cms/admin/icons';
import { adminStrings } from '@/modules/cms/admin/strings';

const s = adminStrings.dashboard.recent;

/** The latest saves across the panel: who, what, when, one click (no reload) to open. */
export function RecentActivity({ items }: { items: RecentItem[] }) {
  return (
    <Card className="flex flex-col gap-4 p-5" data-admin-recent="">
      <h2 className="flex items-center gap-2 text-h4 text-text">
        <Icon icon={History} size={20} className="text-accent" />
        {s.title}
      </h2>
      {items.length === 0 ? (
        <p className="text-small text-text-muted">{s.empty}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {items.map((item) => (
            <li key={item.key}>
              <Link
                href={item.href}
                className="flex items-center gap-3 py-2.5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                <span
                  className={`grid size-9 shrink-0 place-items-center rounded-inner ${HUE_CLASSES[item.hue]}`}
                  data-hue={item.hue}
                >
                  {item.icon && <Icon icon={item.icon} size={18} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-small font-medium text-text">{item.title}</span>
                    {item.status && (
                      <Badge tone={item.status === 'published' ? 'success' : 'muted'}>
                        {item.status === 'published' ? s.published : s.draft}
                      </Badge>
                    )}
                  </span>
                  <span className="block truncate text-caption text-text-muted">
                    {item.entity}
                    {item.savedBy ? ` · ${s.by.replace('{name}', item.savedBy)}` : ''}
                  </span>
                </span>
                <time dateTime={item.updatedAt} className="shrink-0 text-caption text-text-muted">
                  {relativeTime(item.updatedAt)}
                </time>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
