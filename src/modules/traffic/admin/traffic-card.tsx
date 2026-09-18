import { Link } from '@payloadcms/ui';
import { Card } from '@/components/shared/card';
import { Icon } from '@/components/shared/icon';
import { formatNumber } from '@/modules/cms/admin/format';
import { COLLECTION_ICONS } from '@/modules/cms/admin/icons';
import { type AdminStrings, adminStringsFor } from '@/modules/cms/admin/strings';
import { type Channel, CHANNEL_GROUPS } from '@/modules/traffic/channels';
import type { TrafficSummary } from '@/modules/traffic/summary';

const TrafficIcon = COLLECTION_ICONS.traffic;

function stat(label: string, value: string) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-caption text-text-muted">{label}</span>
      <span className="text-h4 text-text">{value}</span>
    </div>
  );
}

/** A channel's name: a brand as it is, a word ("Direct", "Other sites") in the UI language. */
export function channelLabel(channel: Channel, s: AdminStrings['traffic']): string {
  return s.channels[channel.key] ?? channel.label;
}

/**
 * The "Traffic" card on the dashboard (ADR-048, admins): the last seven days' landings, one
 * bar per group with its share (the Visibility pink on the surface track: identity, not
 * meaning), the top channel and the crawler hits. Empty until the first visitor lands.
 */
export function TrafficCard({
  summary,
  href,
  language,
}: {
  summary: TrafficSummary;
  href: string;
  language: string;
}) {
  const s = adminStringsFor(language).traffic;
  const top = summary.byChannel[0];
  const empty = summary.landings === 0 && summary.crawls === 0;
  return (
    <Card
      className="flex flex-col gap-4 p-5"
      data-admin-traffic=""
      data-admin-traffic-landings={summary.landings}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-h4 text-text">
          <Icon icon={TrafficIcon} size={20} className="text-accent" />
          {s.card.title}
        </h2>
        <Link href={href} className="text-caption text-accent hover:underline">
          {s.card.link}
        </Link>
      </div>
      {empty ? (
        <p
          className="flex items-center gap-2 text-small text-text-muted"
          data-admin-traffic-empty=""
        >
          <Icon icon={TrafficIcon} size={16} className="text-pink" />
          {s.card.empty}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            {stat(s.card.landings, formatNumber(summary.landings, language))}
            {stat(s.card.topChannel, top ? channelLabel(top.channel, s) : '')}
            {stat(s.card.crawls, formatNumber(summary.crawls, language))}
          </div>
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
                  <span
                    className="h-2 overflow-hidden rounded-pill bg-surface-2"
                    aria-hidden="true"
                  >
                    <span
                      className="block h-full rounded-pill bg-pink"
                      style={{ width: `${share}%` }}
                    />
                  </span>
                  <span className="text-end text-text-muted tabular-nums">
                    {formatNumber(hits, language)}
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Card>
  );
}
