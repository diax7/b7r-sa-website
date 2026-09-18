import { Link } from '@payloadcms/ui';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { formatNumber } from '@/modules/cms/admin/format';
import { type AdminStrings, adminStringsFor } from '@/modules/cms/admin/strings';
import { PullNow } from '@/modules/visibility/admin/pull-action';
import type { SignalRows } from '@/modules/visibility/signals';

type Strings = AdminStrings['visibility']['signals'];

const th = 'py-1 text-start text-caption font-medium text-text-muted';
const td = 'py-1 text-small text-text';
const num = 'text-end tabular-nums';
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

function Panel({
  title,
  date,
  connected,
  connectionsHref,
  s,
  children,
}: {
  title: string;
  date: string | null;
  connected: boolean;
  connectionsHref: string;
  s: Strings;
  children: ReactNode;
}) {
  return (
    <section
      className="flex flex-col gap-3 rounded-base border border-border bg-surface p-5"
      data-admin-signal={title}
      data-signal-state={date ? 'snapshot' : connected ? 'waiting' : 'absent'}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-h4 text-text">{title}</h3>
        {date && (
          <time dateTime={date} className="text-caption text-text-muted tabular-nums">
            {s.asOf.replace('{date}', date)}
          </time>
        )}
      </div>
      {date ? (
        children
      ) : (
        <p className="text-small text-text-muted">
          {connected ? (
            s.waiting
          ) : (
            <>
              {s.notConnected}{' '}
              <Link href={connectionsHref} className="text-accent underline underline-offset-2">
                {s.connect}
              </Link>
            </>
          )}
        </p>
      )}
    </section>
  );
}

function Totals({ rows }: { rows: Array<[string, string]> }) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-small">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-text-muted">{label}</dt>
          <dd className="text-text tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function QueryTable({
  rows,
  s,
  language,
}: {
  rows: Array<{ key: string; impressions: number; clicks: number }>;
  s: Strings;
  language: string;
}) {
  if (rows.length === 0) return null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={th}>{s.query}</th>
            <th className={cn(th, num)}>{s.impressions}</th>
            <th className={cn(th, num)}>{s.clicks}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((q) => (
            <tr key={q.key}>
              <td className={td} dir="auto">
                {q.key}
              </td>
              <td className={cn(td, num)}>{formatNumber(q.impressions, language)}</td>
              <td className={cn(td, num)}>{formatNumber(q.clicks, language)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * The outside services' latest snapshots as facts (ADR-049 D4): one panel each for Search
 * Console, Bing and PageSpeed with the snapshot's date, a "Connect" link when no connection
 * exists, a waiting sentence when one does and no pull has run yet; "Pull now" queues the
 * nightly job.
 */
export function Signals({
  rows,
  adminRoute,
  language,
}: {
  rows: SignalRows;
  adminRoute: string;
  language: string;
}) {
  const s = adminStringsFor(language).visibility.signals;
  const connections = `${adminRoute}/collections/connections`;
  const sc = rows.searchConsole;
  const bing = rows.bing;
  const psi = rows.pagespeed;
  return (
    <section className="flex flex-col gap-4" data-admin-visibility-signals="">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-h3 text-text">{s.title}</h2>
        <PullNow />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel
          title="Search Console"
          date={sc?.date ?? null}
          connected={rows.connected['google-search-console']}
          connectionsHref={connections}
          s={s}
        >
          {sc && (
            <>
              <Totals
                rows={[
                  [s.clicks, formatNumber(sc.data.totals.clicks, language)],
                  [s.impressions, formatNumber(sc.data.totals.impressions, language)],
                  [s.ctr, pct(sc.data.totals.ctr)],
                  [s.position, sc.data.totals.position.toFixed(1)],
                ]}
              />
              <p className="text-caption text-text-muted tabular-nums">
                {s.window.replace('{from}', sc.data.from).replace('{to}', sc.data.to)}
              </p>
              <QueryTable rows={sc.data.queries.slice(0, 10)} s={s} language={language} />
            </>
          )}
        </Panel>
        <Panel
          title="Bing Webmaster"
          date={bing?.date ?? null}
          connected={rows.connected['bing-webmaster']}
          connectionsHref={connections}
          s={s}
        >
          {bing && (
            <>
              <Totals
                rows={[
                  [s.clicks, formatNumber(bing.data.totals.clicks, language)],
                  [s.impressions, formatNumber(bing.data.totals.impressions, language)],
                ]}
              />
              <QueryTable
                rows={bing.data.queries.slice(0, 10).map((q) => ({ ...q, key: q.query }))}
                s={s}
                language={language}
              />
            </>
          )}
        </Panel>
        <Panel
          title="PageSpeed"
          date={psi?.date ?? null}
          connected={rows.connected.pagespeed}
          connectionsHref={connections}
          s={s}
        >
          {psi && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className={th}>{s.page}</th>
                    <th className={cn(th, num)}>{s.mobile}</th>
                    <th className={cn(th, num)}>{s.desktop}</th>
                    <th className={cn(th, num)}>LCP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[...new Set(psi.data.audits.map((a) => a.url))].map((url) => {
                    const of = (strategy: 'mobile' | 'desktop') =>
                      psi.data.audits.find((a) => a.url === url && a.strategy === strategy);
                    const mobile = of('mobile');
                    const lcp = mobile?.lcpMs;
                    return (
                      <tr key={url}>
                        <td className={cn(td, 'font-mono text-caption')} dir="ltr">
                          {new URL(url).pathname}
                        </td>
                        <td className={cn(td, num)}>{mobile?.scores.performance ?? ''}</td>
                        <td className={cn(td, num)}>{of('desktop')?.scores.performance ?? ''}</td>
                        <td className={cn(td, num)}>
                          {typeof lcp === 'number' ? `${(lcp / 1000).toFixed(1)} s` : ''}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {psi.data.errors.length > 0 && (
                <p className="mt-2 text-caption text-warning">
                  {s.psiErrors.replace('{n}', String(psi.data.errors.length))}
                </p>
              )}
            </div>
          )}
        </Panel>
      </div>
    </section>
  );
}
