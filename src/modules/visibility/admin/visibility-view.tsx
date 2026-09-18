import { Link } from '@payloadcms/ui';
import { Check, ChevronRight, CircleAlert, CircleX, type LucideIcon } from 'lucide-react';
import type { AdminViewServerProps } from 'payload';
import { Icon } from '@/components/shared/icon';
import { cn } from '@/lib/cn';
import { relativeTime } from '@/modules/cms/admin/format';
import { ADMIN_VIEWS } from '@/modules/cms/admin/icons';
import { type AdminStrings, adminStringsFor } from '@/modules/cms/admin/strings';
import { adminView, viewLanguage, viewUser } from '@/modules/cms/admin/views/gate';
import { AdminShell } from '@/modules/cms/admin/views/shell';
import { Ledger } from '@/modules/visibility/admin/ledger';
import { Ring } from '@/modules/visibility/admin/ring';
import { Signals } from '@/modules/visibility/admin/signals';
import { ledgerReading } from '@/modules/visibility/ledger/reading';
import { reading } from '@/modules/visibility/reading';
import { scoreTrend, signalRows } from '@/modules/visibility/signals';
import type { SectionScore } from '@/modules/visibility/score';
import type { Finding, Status } from '@/modules/visibility/types';

const ScoreIcon = ADMIN_VIEWS.visibility.icon;

type Strings = AdminStrings['visibility'];

/** The status colours mean what the design system says: green done, amber next, red missing. */
const STATUS: Record<Status, { icon: LucideIcon; className: string }> = {
  done: { icon: Check, className: 'text-success' },
  next: { icon: CircleAlert, className: 'text-warning' },
  missing: { icon: CircleX, className: 'text-error' },
};

function FindingRow({ finding, s }: { finding: Finding<string>; s: Strings }) {
  const status = STATUS[finding.status];
  const count =
    finding.count && finding.count.total > 0
      ? ` (${s.countOf
          .replace('{done}', String(finding.count.done))
          .replace('{total}', String(finding.count.total))})`
      : '';
  return (
    <li
      className="flex flex-col gap-1 py-2"
      data-admin-finding={finding.key}
      data-status={finding.status}
    >
      <div className="flex items-start gap-2">
        <Icon
          icon={status.icon}
          size={16}
          className={cn('mt-0.5 shrink-0', status.className)}
          aria-label={s.status[finding.status]}
        />
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-small text-text" data-admin-finding-title="">
            {finding.title}
            {count}
            <span className="ms-2 text-caption text-text-muted tabular-nums">
              {Math.round(finding.earned)}/{finding.weight}
            </span>
          </span>
          {finding.status !== 'done' && (
            <span className="text-caption text-text-muted" data-admin-finding-guide="">
              {finding.guide}
              {finding.href && (
                <>
                  {' '}
                  <Link href={finding.href} className="text-accent underline underline-offset-2">
                    {s.open}
                  </Link>
                </>
              )}
            </span>
          )}
          {finding.status !== 'done' && finding.items && finding.items.length > 0 && (
            <ul className="mt-1 flex flex-col gap-0.5" data-admin-finding-items="">
              {finding.items.map((item) => (
                <li key={item.href + item.label} className="flex items-center gap-1 text-caption">
                  <Icon icon={ChevronRight} size={12} className="text-text-muted" />
                  <Link
                    href={item.href}
                    className="text-accent underline underline-offset-2"
                    dir="auto"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              {finding.count && finding.count.total - finding.count.done > finding.items.length && (
                <li className="text-caption text-text-muted">
                  {s.andMore.replace(
                    '{n}',
                    String(finding.count.total - finding.count.done - finding.items.length),
                  )}
                </li>
              )}
            </ul>
          )}
        </div>
      </div>
    </li>
  );
}

function SectionCard({ section, s }: { section: SectionScore<string>; s: Strings }) {
  const byStatus = (status: Status) => section.findings.filter((f) => f.status === status);
  const done = byStatus('done');
  return (
    <section
      id={section.key}
      className="scroll-mt-20 flex flex-col gap-3 rounded-base border border-border bg-surface p-5"
      data-admin-section={section.key}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-h4 text-text">{s.sections[section.key]}</h2>
        <span className="text-small text-text-muted tabular-nums">
          {Math.round(section.earned)}/{section.weight} · {section.percent}%
        </span>
      </div>
      <span className="h-2 overflow-hidden rounded-pill bg-surface-2" aria-hidden="true">
        <span
          className="block h-full rounded-pill bg-pink"
          style={{ width: `${section.percent}%` }}
        />
      </span>
      <ul className="flex flex-col divide-y divide-border">
        {[...byStatus('next'), ...byStatus('missing'), ...done.slice(0, 5)].map((f) => (
          <FindingRow key={f.key} finding={f} s={s} />
        ))}
      </ul>
      {done.length > 5 && (
        <details className="text-caption text-text-muted">
          <summary className="cursor-pointer">
            {s.moreDone.replace('{n}', String(done.length - 5))}
          </summary>
          <ul className="mt-2 flex flex-col divide-y divide-border">
            {done.slice(5).map((f) => (
              <FindingRow key={f.key} finding={f} s={s} />
            ))}
          </ul>
        </details>
      )}
      {section.facts.length > 0 && (
        <div className="flex flex-col gap-1 border-t border-border pt-3">
          <span className="text-caption font-medium text-text-muted">{s.guaranteed}</span>
          {section.facts.map((fact) => (
            <p key={fact.text} className="text-caption text-text-muted">
              {fact.text}
            </p>
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * The Score page (`/admin/visibility`, ADR-049): the overall ring, the site-only number, one
 * card per section with its findings in the order next, missing, done, each with its guide,
 * its link and its documents; the facts the site guarantees at the foot of each card. Admins
 * only; the reads run with the user's access. "Recompute" bypasses the minute's cache. The
 * rules' sentences come picked in the panel's language (ADR-056).
 */
export async function VisibilityView(props: AdminViewServerProps) {
  const language = viewLanguage(props);
  const s = adminStringsFor(language).visibility;
  const refused = adminView(props, ADMIN_VIEWS.visibility.path, s.page.title);
  if (refused) return refused;
  const fresh = props.searchParams?.['fresh'] !== undefined;
  const { score, at } = await reading(props.payload, { user: viewUser(props), fresh, language });
  const [signals, trend, ledger] = await Promise.all([
    signalRows(props.payload),
    scoreTrend(props.payload, score.overall),
    ledgerReading(props.payload, { user: viewUser(props) }),
  ]);
  const adminRoute = props.payload.config.routes.admin;
  const base = `${adminRoute}${ADMIN_VIEWS.visibility.path}`;
  const open = score.findings.filter((f) => f.status !== 'done').length;
  const trendText = trend
    ? (trend.delta === 0 ? s.page.same : trend.delta > 0 ? s.page.up : s.page.down)
        .replace('{n}', String(Math.abs(trend.delta)))
        .replace('{date}', trend.since.date)
    : null;
  return (
    <AdminShell props={props} title={s.page.title}>
      <div
        className="flex flex-col gap-8 pb-2"
        data-admin-ui=""
        data-admin-visibility-page=""
        data-admin-visibility-overall={score.overall}
      >
        <header className="flex flex-wrap items-center gap-6">
          <Ring percent={score.overall} size={112} label={s.overall} />
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="flex items-center gap-2 text-h2 text-text">
              <Icon icon={ScoreIcon} size={24} className="text-pink" />
              {s.page.title}
            </h1>
            <p className="text-small text-text" data-admin-visibility-site-only={score.siteOnly}>
              {s.page.siteOnly.replace('{n}', String(score.siteOnly))}
            </p>
            <p className="text-caption text-text-muted">
              {(open === 1 ? s.page.introOne : s.page.intro).replace('{open}', String(open))}{' '}
              <Link href={`${base}?fresh=1`} className="text-accent underline underline-offset-2">
                {s.page.recompute}
              </Link>{' '}
              <time dateTime={at} className="tabular-nums">
                {relativeTime(at, language)}
              </time>
            </p>
            {trend && trendText && (
              <p
                className="text-caption text-text-muted tabular-nums"
                data-admin-visibility-trend={trend.delta}
              >
                {trendText}
              </p>
            )}
          </div>
        </header>
        <div className="grid gap-6 lg:grid-cols-2">
          {score.sections.map((section) => (
            <SectionCard key={section.key} section={section} s={s} />
          ))}
        </div>
        <Signals rows={signals} adminRoute={adminRoute} language={language} />
        <Ledger reading={ledger} adminRoute={adminRoute} language={language} />
        <footer className="flex flex-col gap-1 border-t border-border pt-4 text-caption text-text-muted">
          <p>{s.page.howOverall}</p>
          <p>{s.page.howSiteOnly}</p>
        </footer>
      </div>
    </AdminShell>
  );
}
