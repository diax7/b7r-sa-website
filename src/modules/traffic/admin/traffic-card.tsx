import { Icon } from '@/components/shared/icon';
import type { PeopleSummary } from '@/modules/cms/admin/dashboard/readers';
import { Bar, DashboardSection, SectionLink, Stat } from '@/modules/cms/admin/dashboard/section';
import { formatMinutesSeconds, formatNumber } from '@/modules/cms/admin/format';
import { COLLECTION_ICONS } from '@/modules/cms/admin/icons';
import { type AdminStrings, adminStringsFor } from '@/modules/cms/admin/strings';
import { type Channel, CHANNEL_GROUPS } from '@/modules/traffic/channels';
import type { TrafficSummary } from '@/modules/traffic/summary';

const TrafficIcon = COLLECTION_ICONS.traffic;
const TOP_PAGES = 3;

/** A channel's name: a brand as it is, a word ("Direct", "Other sites") in the UI language. */
export function channelLabel(channel: Channel, s: AdminStrings['traffic']): string {
  return s.channels[channel.key] ?? channel.label;
}

/**
 * "Where visits come from" on the dashboard (ADR-048, ADR-059, admins): the range's
 * landings, one bar per group with its share (the Visibility pink of the card's icon on the
 * surface track: identity, not meaning, and the card's one hue, ADR-060), the top channel, the crawler reads, the three entry pages that
 * brought most, and the "All traffic" link into the same range. Empty until the first visitor.
 * With Umami connected (ADR-048 amended) a people row under the figures: its visitors, page
 * views and the average visit for the same range, through yesterday (the range's uniques from
 * the newest snapshot, or the days summed while no snapshot carries the range, captioned so);
 * without a row the card reads as before.
 */
export function TrafficCard({
  summary,
  people,
  href,
  language,
}: {
  summary: TrafficSummary;
  people?: PeopleSummary | null;
  href: string;
  language: string;
}) {
  const s = adminStringsFor(language).traffic;
  const top = summary.byChannel[0];
  const counted = people ?? null;
  const empty = summary.landings === 0 && summary.crawls === 0 && counted === null;
  return (
    <DashboardSection
      hook="visits"
      title={s.card.title}
      icon={TrafficIcon}
      hue="pink"
      end={<SectionLink href={href}>{s.card.link}</SectionLink>}
      data-admin-traffic=""
      data-admin-traffic-landings={summary.landings}
      data-admin-traffic-visitors={counted?.visitors}
    >
      {empty ? (
        <p
          className="flex items-center gap-2 text-small text-text-muted"
          data-admin-traffic-empty=""
        >
          <Icon icon={TrafficIcon} size={16} />
          {s.card.empty}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <Stat label={s.card.landings} value={formatNumber(summary.landings, language)} />
            <Stat label={s.card.topChannel} value={top ? channelLabel(top.channel, s) : ''} />
            <Stat label={s.card.crawls} value={formatNumber(summary.crawls, language)} />
          </div>
          {counted && (
            <div
              className="flex flex-col gap-2"
              data-admin-traffic-people={counted.summed ? 'summed' : 'range'}
            >
              <span className="text-caption text-text-muted">
                {counted.summed ? s.card.peopleSummed : s.card.people}
              </span>
              <div className="grid grid-cols-3 gap-4">
                <Stat
                  label={s.card.visitors}
                  value={formatNumber(counted.visitors, language)}
                  hook="visitors"
                />
                <Stat
                  label={s.card.pageViews}
                  value={formatNumber(counted.pageviews, language)}
                  hook="page-views"
                />
                <Stat
                  label={s.card.averageTime}
                  value={formatMinutesSeconds(
                    counted.visits > 0 ? counted.totaltime / counted.visits : 0,
                  )}
                  hook="average-visit"
                />
              </div>
            </div>
          )}
          <ul className="flex flex-col gap-2" data-admin-traffic-groups="">
            {CHANNEL_GROUPS.map((group) => {
              const hits = summary.byGroup[group];
              const share = summary.landings ? Math.round((hits / summary.landings) * 100) : 0;
              return (
                <li
                  key={group}
                  className="grid grid-cols-[7rem_1fr_3rem] items-center gap-3 text-small"
                >
                  <span className="text-text">{s.groups[group]}</span>
                  <Bar percent={share} tone="pink" />
                  <span className="text-end text-text-muted tabular-nums">
                    {formatNumber(hits, language)}
                  </span>
                </li>
              );
            })}
          </ul>
          {summary.byPath.length > 0 && (
            <div className="flex flex-col gap-1" data-admin-traffic-pages="">
              <span className="text-caption text-text-muted">{s.card.pages}</span>
              <ul className="flex flex-col gap-1">
                {summary.byPath.slice(0, TOP_PAGES).map((p) => (
                  <li key={p.path} className="flex items-center justify-between gap-3 text-small">
                    <span className="truncate font-mono text-caption text-text" dir="ltr">
                      {p.path}
                    </span>
                    <span className="shrink-0 text-text-muted tabular-nums">
                      {formatNumber(p.hits, language)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </DashboardSection>
  );
}
