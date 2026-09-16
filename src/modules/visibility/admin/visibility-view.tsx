import { Gutter, Link } from '@payloadcms/ui';
import { Check, ChevronRight, CircleAlert, CircleX, type LucideIcon } from 'lucide-react';
import type { AdminViewServerProps } from 'payload';
import { Icon } from '@/components/shared/icon';
import { cn } from '@/lib/cn';
import { ADMIN_VIEWS } from '@/modules/cms/admin/icons';
import { adminStrings } from '@/modules/cms/admin/strings';
import { relativeTime } from '@/modules/cms/admin/dashboard/relative-time';
import { adminView, viewUser } from '@/modules/cms/admin/views/gate';
import { Ring } from '@/modules/visibility/admin/ring';
import { reading } from '@/modules/visibility/reading';
import type { SectionScore } from '@/modules/visibility/score';
import type { Finding, Status } from '@/modules/visibility/types';

const s = adminStrings.visibility;
const ScoreIcon = ADMIN_VIEWS.visibility.icon;

/** The status colours mean what the design system says: green done, amber next, red missing. */
const STATUS: Record<Status, { icon: LucideIcon; className: string }> = {
  done: { icon: Check, className: 'text-success' },
  next: { icon: CircleAlert, className: 'text-warning' },
  missing: { icon: CircleX, className: 'text-error' },
};

function FindingRow({ finding }: { finding: Finding }) {
  const status = STATUS[finding.status];
  const count =
    finding.count && finding.count.total > 0
      ? ` (${finding.count.done} of ${finding.count.total})`
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
          <span className="text-small text-text">
            {finding.title}
            {count}
            <span className="ms-2 text-caption text-text-muted tabular-nums">
              {Math.round(finding.earned)}/{finding.weight}
            </span>
          </span>
          {finding.status !== 'done' && (
            <span className="text-caption text-text-muted">
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

function SectionCard({ section }: { section: SectionScore }) {
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
          <FindingRow key={f.key} finding={f} />
        ))}
      </ul>
      {done.length > 5 && (
        <details className="text-caption text-text-muted">
          <summary className="cursor-pointer">
            {s.moreDone.replace('{n}', String(done.length - 5))}
          </summary>
          <ul className="mt-2 flex flex-col divide-y divide-border">
            {done.slice(5).map((f) => (
              <FindingRow key={f.key} finding={f} />
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
 * only; the reads run with the user's access. "Recompute" bypasses the minute's cache.
 */
export async function VisibilityView(props: AdminViewServerProps) {
  const refused = adminView(props, ADMIN_VIEWS.visibility.path);
  if (refused) return refused;
  const fresh = props.searchParams?.['fresh'] !== undefined;
  const { score, at } = await reading(props.payload, { user: viewUser(props), fresh });
  const base = `${props.payload.config.routes.admin}${ADMIN_VIEWS.visibility.path}`;
  const open = score.findings.filter((f) => f.status !== 'done').length;
  return (
    <Gutter>
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
                {relativeTime(at)}
              </time>
            </p>
          </div>
        </header>
        <div className="grid gap-6 lg:grid-cols-2">
          {score.sections.map((section) => (
            <SectionCard key={section.key} section={section} />
          ))}
        </div>
        <footer className="flex flex-col gap-1 border-t border-border pt-4 text-caption text-text-muted">
          <p>{s.page.howOverall}</p>
          <p>{s.page.howSiteOnly}</p>
        </footer>
      </div>
    </Gutter>
  );
}
