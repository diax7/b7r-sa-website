import { Link } from '@payloadcms/ui';
import { LayoutList } from 'lucide-react';
import { Badge } from '@/components/shared/badge';
import { Icon } from '@/components/shared/icon';
import { cn } from '@/lib/cn';
import type { QuickAction, RecentItem } from '@/modules/cms/admin/dashboard/data';
import type { ContentSlug } from '@/modules/cms/admin/dashboard/readers';
import { statusListHref } from '@/modules/cms/admin/dashboard/rules';
import { DashboardSection } from '@/modules/cms/admin/dashboard/section';
import { formatNumber, relativeTime } from '@/modules/cms/admin/format';
import { COLLECTION_ICONS, entityHue, HUE_CLASSES } from '@/modules/cms/admin/icons';
import { adminStringsFor } from '@/modules/cms/admin/strings';

const SAVES = 5;

/** The icon of an action button in its entity's hue (literal classes, so the scanner keeps them). */
const HUE_TEXT: Record<QuickAction['hue'], string> = {
  blue: 'text-accent',
  teal: 'text-teal',
  violet: 'text-violet',
  pink: 'text-pink',
  slate: 'text-slate',
  green: 'text-success',
};

/** One collection's figures for the table: each number a link to its place. */
export interface ContentRow {
  collection: ContentSlug;
  label: string;
  published: number | null;
  drafts: number | null;
  missingEnglish: { count: number; href: string | null } | null;
}

const th = 'py-1 pe-3 text-start text-caption font-medium text-text-muted';
const td = 'py-2 pe-3 text-small text-text';
const num = 'text-end tabular-nums';

function Figure({
  value,
  href,
  language,
  hook,
}: {
  value: number | null;
  href: string;
  language: string;
  hook: string;
}) {
  if (value === null) return null;
  return (
    <Link
      href={href}
      className="rounded-inner hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40"
      data-admin-figure={hook}
      data-admin-figure-value={value}
    >
      {formatNumber(value, language)}
    </Link>
  );
}

/**
 * "Content" on the dashboard (ADR-059): the home page tile with when it was published, one
 * row per content collection with what went live in the range, the drafts waiting (each
 * linked to the list filtered on `_status`, the CTO's edit) and the documents without their
 * English (linked to the first one's English form), the last five saves by people, and the
 * two actions an editor presses most.
 */
export function ContentCard({
  rows,
  home,
  saves,
  actions,
  adminRoute,
  language,
  now,
}: {
  rows: ContentRow[];
  home: { action: QuickAction; item: RecentItem | null } | null;
  saves: RecentItem[];
  actions: QuickAction[];
  adminRoute: string;
  language: string;
  /** The render's clock, one for every section. */
  now: Date;
}) {
  const s = adminStringsFor(language).dashboard.content;
  return (
    <DashboardSection hook="content" title={s.title} icon={LayoutList}>
      {home && (
        <Link
          href={home.action.href}
          className="flex items-center gap-3 rounded-base border border-border p-3 hover:bg-surface-2 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40"
          data-admin-action={home.action.key}
          data-hue={home.action.hue}
        >
          <span
            className={`grid size-10 shrink-0 place-items-center rounded-pill ${HUE_CLASSES[home.action.hue]}`}
          >
            <Icon icon={home.action.icon} size={20} />
          </span>
          <span className="min-w-0">
            <span className="block text-small font-medium text-text">{home.action.title}</span>
            <span className="block text-caption text-text-muted">
              {home.item
                ? (home.item.status === 'draft' ? s.homeDraft : s.homePublished).replace(
                    '{when}',
                    relativeTime(home.item.updatedAt, language, now),
                  )
                : home.action.text}
            </span>
          </span>
        </Link>
      )}
      {rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" data-admin-dashboard-figures="">
            <thead>
              <tr>
                <th className={th}>{s.kind}</th>
                <th className={cn(th, num)}>{s.published}</th>
                <th className={cn(th, num)}>{s.drafts}</th>
                <th className={cn(th, num)}>{s.missingEnglish}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => {
                const list = `${adminRoute}/collections/${r.collection}`;
                const CollectionIcon = COLLECTION_ICONS[r.collection];
                return (
                  <tr key={r.collection} data-admin-figures={r.collection}>
                    <td className={td}>
                      <span className="flex items-center gap-2">
                        <span
                          className={`grid size-7 shrink-0 place-items-center rounded-inner ${HUE_CLASSES[entityHue('collections', r.collection)]}`}
                        >
                          <Icon icon={CollectionIcon} size={14} />
                        </span>
                        {r.label}
                      </span>
                    </td>
                    <td className={cn(td, num)}>
                      <Figure
                        value={r.published}
                        href={`${list}?sort=-${r.collection === 'posts' ? 'publishedAt' : 'updatedAt'}`}
                        language={language}
                        hook="published"
                      />
                    </td>
                    <td className={cn(td, num)}>
                      <Figure
                        value={r.drafts}
                        href={statusListHref(adminRoute, r.collection, 'draft')}
                        language={language}
                        hook="drafts"
                      />
                    </td>
                    <td className={cn(td, num)}>
                      <Figure
                        value={r.missingEnglish?.count ?? null}
                        href={r.missingEnglish?.href ?? list}
                        language={language}
                        hook="missing-english"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex flex-col gap-2" data-admin-recent="">
        <span className="text-caption text-text-muted">{s.saves}</span>
        {saves.length === 0 ? (
          <p className="text-small text-text-muted">{s.empty}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {saves.slice(0, SAVES).map((item) => (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 py-2 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40"
                >
                  <span
                    className={`grid size-8 shrink-0 place-items-center rounded-inner ${HUE_CLASSES[item.hue]}`}
                    data-hue={item.hue}
                  >
                    {item.icon && <Icon icon={item.icon} size={16} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-small font-medium text-text">
                        {item.title}
                      </span>
                      {item.status && (
                        <Badge tone={item.status === 'published' ? 'success' : 'muted'}>
                          {item.status === 'published' ? s.publishedBadge : s.draft}
                        </Badge>
                      )}
                    </span>
                    <span className="block truncate text-caption text-text-muted">
                      {[item.entity, item.savedBy ? s.by.replace('{name}', item.savedBy) : '']
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </span>
                  <time dateTime={item.updatedAt} className="shrink-0 text-caption text-text-muted">
                    {relativeTime(item.updatedAt, language, now)}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      {actions.length > 0 && (
        <div className="flex flex-wrap gap-2" data-admin-dashboard-actions="">
          {actions.map((a) => (
            <Link
              key={a.key}
              href={a.href}
              className="flex h-9 items-center gap-2 rounded-inner border border-border bg-surface px-3 text-small text-text transition-colors duration-(--duration-fast) hover:border-text-muted/60 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40"
              data-admin-action={a.key}
              data-hue={a.hue}
            >
              <Icon icon={a.icon} size={16} className={HUE_TEXT[a.hue]} />
              {a.title}
            </Link>
          ))}
        </div>
      )}
    </DashboardSection>
  );
}
