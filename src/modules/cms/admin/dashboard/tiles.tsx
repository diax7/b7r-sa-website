import { Link } from '@payloadcms/ui';
import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/shared/card';
import { Icon } from '@/components/shared/icon';
import { type Hue, HUE_CLASSES } from '@/modules/cms/admin/icons';

export interface Tile {
  key: 'visits' | 'cited' | 'score' | 'published';
  href: string;
  label: string;
  /** The number as text, already formatted; empty when the reader could not answer. */
  value: string;
  /** The line under it: the change, the window, the drafts waiting. */
  detail: string;
  icon: LucideIcon;
  hue: Hue;
  /** Extra `data-*` hooks other tests read (the score tile keeps the visibility card's). */
  data?: Record<string, string | number>;
}

/**
 * The numbers at a glance (ADR-059): four tiles, each one link to its place. A tile whose
 * reader failed shows the "not available" word in place of the number and stays a link.
 * The disc behind the icon is the tile's one hue (ADR-060); the numbers stay neutral.
 */
export function Tiles({ tiles }: { tiles: Tile[] }) {
  return (
    <ul
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      data-admin-dashboard-tiles={tiles.length}
    >
      {tiles.map((t) => (
        <li key={t.key}>
          <Card hoverable className="h-full">
            <Link
              href={t.href}
              className="flex h-full items-start gap-3 rounded-base p-4 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40"
              data-admin-tile={t.key}
              data-admin-tile-value={t.value}
              {...t.data}
            >
              <span
                className={`grid size-10 shrink-0 place-items-center rounded-pill ${HUE_CLASSES[t.hue]}`}
                data-admin-hue={t.hue}
              >
                <Icon icon={t.icon} size={20} />
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-caption text-text-muted">{t.label}</span>
                <span className="text-h3 text-text tabular-nums">{t.value}</span>
                <span className="text-caption text-text-muted">{t.detail}</span>
              </span>
            </Link>
          </Card>
        </li>
      ))}
    </ul>
  );
}
