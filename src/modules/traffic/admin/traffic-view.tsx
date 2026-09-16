import { Gutter, Link } from '@payloadcms/ui';
import type { AdminViewServerProps } from 'payload';
import type { ReactNode } from 'react';
import { Badge } from '@/components/shared/badge';
import { Icon } from '@/components/shared/icon';
import { cn } from '@/lib/cn';
import { botByKey } from '@/lib/traffic/bots';
import { ADMIN_VIEWS } from '@/modules/cms/admin/icons';
import { adminStrings } from '@/modules/cms/admin/strings';
import { AdminsOnly, adminView, isAdminUser, viewUser } from '@/modules/cms/admin/views/gate';
import { CHANNEL_GROUPS } from '@/modules/traffic/channels';
import { type TrafficSummary, trafficSummary } from '@/modules/traffic/summary';

const s = adminStrings.traffic;
const RANGES = [7, 30, 90] as const;
const TOP = 20;
const TrafficIcon = ADMIN_VIEWS.traffic.icon;

function rangeOf(raw: string | string[] | undefined): (typeof RANGES)[number] {
  const n = Number(Array.isArray(raw) ? raw[0] : raw);
  return RANGES.find((r) => r === n) ?? 30;
}

function share(hits: number, total: number): number {
  return total ? Math.round((hits / total) * 100) : 0;
}

/** A bar in a table cell: the Visibility pink on the surface track (identity, not meaning). */
function Bar({ percent }: { percent: number }) {
  return (
    <span className="flex items-center gap-2">
      <span className="h-2 w-24 overflow-hidden rounded-pill bg-surface-2" aria-hidden="true">
        <span className="block h-full rounded-pill bg-pink" style={{ width: `${percent}%` }} />
      </span>
      <span className="text-caption text-text-muted tabular-nums">{percent}%</span>
    </span>
  );
}

const th = 'px-3 py-2 text-start text-caption font-medium text-text-muted';
const td = 'px-3 py-2 text-small text-text';
const num = 'text-end tabular-nums';

function Section({
  title,
  empty,
  children,
  hook,
}: {
  title: string;
  empty: boolean;
  children: ReactNode;
  hook: string;
}) {
  return (
    <section className="flex flex-col gap-3" data-admin-traffic-section={hook}>
      <h2 className="text-h4 text-text">{title}</h2>
      {empty ? (
        <p
          className="flex items-center gap-2 text-small text-text-muted"
          data-admin-traffic-empty=""
        >
          <Icon icon={TrafficIcon} size={16} className="text-pink" />
          {s.page.empty}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-base border border-border">
          <table className="w-full border-collapse">{children}</table>
        </div>
      )}
    </section>
  );
}

function Channels({ summary }: { summary: TrafficSummary }) {
  return (
    <Section title={s.page.channels} empty={summary.byChannel.length === 0} hook="channels">
      <thead className="bg-surface-2">
        <tr>
          <th className={th}>{s.page.channel}</th>
          <th className={th}>{s.page.group}</th>
          <th className={cn(th, num)}>{s.page.landings}</th>
          <th className={th}>{s.page.share}</th>
          <th className={th}>{s.page.seen}</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {summary.byChannel.map((c) => (
          <tr key={c.channel.key}>
            <td className={td}>{c.channel.label}</td>
            <td className={td}>{s.groups[c.channel.group]}</td>
            <td className={cn(td, num)}>{c.hits}</td>
            <td className={td}>
              <Bar percent={share(c.hits, summary.landings)} />
            </td>
            <td className={cn(td, 'text-text-muted tabular-nums')}>
              {c.firstDay === c.lastDay ? c.firstDay : `${c.firstDay} → ${c.lastDay}`}
            </td>
          </tr>
        ))}
      </tbody>
    </Section>
  );
}

function Sources({ summary }: { summary: TrafficSummary }) {
  return (
    <Section title={s.page.sources} empty={summary.bySource.length === 0} hook="sources">
      <thead className="bg-surface-2">
        <tr>
          <th className={th}>{s.page.source}</th>
          <th className={th}>{s.page.channel}</th>
          <th className={cn(th, num)}>{s.page.landings}</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {summary.bySource.slice(0, TOP).map((r) => (
          <tr key={r.source}>
            <td className={cn(td, 'font-mono text-caption')} dir="ltr">
              {r.source}
            </td>
            <td className={td}>{r.channel.label}</td>
            <td className={cn(td, num)}>{r.hits}</td>
          </tr>
        ))}
      </tbody>
    </Section>
  );
}

function Pages({ summary }: { summary: TrafficSummary }) {
  return (
    <Section title={s.page.pages} empty={summary.byPath.length === 0} hook="pages">
      <thead className="bg-surface-2">
        <tr>
          <th className={th}>{s.page.pageCol}</th>
          <th className={cn(th, num)}>{s.page.landings}</th>
          <th className={th}>{s.page.topChannel}</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {summary.byPath.slice(0, TOP).map((r) => (
          <tr key={r.path}>
            <td className={cn(td, 'font-mono text-caption')} dir="ltr">
              {r.path}
            </td>
            <td className={cn(td, num)}>{r.hits}</td>
            <td className={td}>{r.top.label}</td>
          </tr>
        ))}
      </tbody>
    </Section>
  );
}

function Crawlers({ summary }: { summary: TrafficSummary }) {
  return (
    <Section title={s.page.crawlers} empty={summary.byBot.length === 0} hook="crawlers">
      <thead className="bg-surface-2">
        <tr>
          <th className={th}>{s.page.bot}</th>
          <th className={th}>{s.page.family}</th>
          <th className={th}>{s.page.role}</th>
          <th className={cn(th, num)}>{s.page.reads}</th>
          <th className={th}>{s.page.readMost}</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {summary.byBot.map((b) => {
          const bot = botByKey(b.bot);
          return (
            <tr key={b.bot}>
              <td className={td}>{bot?.token ?? b.bot}</td>
              <td className={td}>{s.families[b.family]}</td>
              <td className={td}>{bot ? <Badge tone="muted">{s.roles[bot.role]}</Badge> : ''}</td>
              <td className={cn(td, num)}>{b.hits}</td>
              <td className={cn(td, 'font-mono text-caption')} dir="ltr">
                {b.paths.map((p) => `${p.path} (${p.hits})`).join(', ')}
              </td>
            </tr>
          );
        })}
      </tbody>
    </Section>
  );
}

/**
 * The Traffic page (`/admin/traffic`, ADR-048): the site's own count over 7, 30 or 90 days,
 * as tables (the channels, the sources, the landing pages, the crawlers), each with its empty
 * state, and the three honesty lines at the foot. Admins only: the gate redirects a visitor
 * to the login and shows an editor the sentence; the rows are read with the user's access.
 */
export async function TrafficView(props: AdminViewServerProps) {
  adminView(props, ADMIN_VIEWS.traffic.path);
  if (!isAdminUser(props)) return <AdminsOnly />;
  const days = rangeOf(props.searchParams?.['days']);
  const summary = await trafficSummary(props.payload, { days, user: viewUser(props) });
  const adminRoute = props.payload.config.routes.admin;
  const base = `${adminRoute}${ADMIN_VIEWS.traffic.path}`;
  const top = summary.byChannel[0];
  return (
    <Gutter>
      <div className="flex flex-col gap-8 pb-2" data-admin-ui="" data-admin-traffic-page={days}>
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="flex items-center gap-2 text-h2 text-text">
              <Icon icon={TrafficIcon} size={24} className="text-pink" />
              {s.page.title}
            </h1>
            <p className="text-small text-text-muted">
              {s.page.intro.replace('{days}', String(days)).replace('{since}', summary.since)}
            </p>
          </div>
          <nav aria-label={s.page.range} className="flex gap-2" data-admin-traffic-range="">
            {RANGES.map((r) => (
              <Link
                key={r}
                href={`${base}?days=${r}`}
                aria-current={r === days ? 'page' : undefined}
                className={cn(
                  'rounded-pill border px-3 py-1 text-small transition-colors duration-(--duration-fast)',
                  r === days
                    ? 'border-pink bg-pink-tint text-pink'
                    : 'border-border text-text-muted hover:text-text',
                )}
              >
                {s.page.days.replace('{n}', String(r))}
              </Link>
            ))}
          </nav>
        </header>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4" data-admin-traffic-totals="">
          {[
            [s.card.landings, String(summary.landings)],
            [s.card.topChannel, top ? top.channel.label : ''],
            [s.card.crawls, String(summary.crawls)],
            [s.page.aiShare, `${share(summary.byGroup.ai, summary.landings)}%`],
          ].map(([label, value]) => (
            <div key={label} className="flex flex-col gap-0.5">
              <span className="text-caption text-text-muted">{label}</span>
              <span className="text-h4 text-text">{value}</span>
            </div>
          ))}
        </div>
        <ul className="flex flex-col gap-2" data-admin-traffic-groups="">
          {CHANNEL_GROUPS.map((group) => (
            <li
              key={group}
              className="grid grid-cols-[8rem_1fr_4rem] items-center gap-3 text-small"
            >
              <span className="text-text">{s.groups[group]}</span>
              <span className="h-2 overflow-hidden rounded-pill bg-surface-2" aria-hidden="true">
                <span
                  className="block h-full rounded-pill bg-pink"
                  style={{ width: `${share(summary.byGroup[group], summary.landings)}%` }}
                />
              </span>
              <span className="text-end text-text-muted tabular-nums">
                {summary.byGroup[group]}
              </span>
            </li>
          ))}
        </ul>
        <Channels summary={summary} />
        <Sources summary={summary} />
        <Pages summary={summary} />
        <Crawlers summary={summary} />
        <footer className="flex flex-col gap-1 border-t border-border pt-4 text-caption text-text-muted">
          {s.page.honesty.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </footer>
      </div>
    </Gutter>
  );
}
