import { Link } from '@payloadcms/ui';
import { Badge } from '@/components/shared/badge';
import { DashboardSection, SectionLink } from '@/modules/cms/admin/dashboard/section';
import { formatSlot, relativeTime } from '@/modules/cms/admin/format';
import { COLLECTION_ICONS } from '@/modules/cms/admin/icons';
import { adminStringsFor } from '@/modules/cms/admin/strings';
import type { LedgerReading } from '@/modules/visibility/ledger/reading';

const AssistantsIcon = COLLECTION_ICONS.citations;
const pct = (n: number, of: number) => (of > 0 ? `${Math.round((n / of) * 100)}%` : '0%');

/**
 * "What the assistants say" on the dashboard (ADR-049 D5, ADR-059, admins): per engine the
 * cited rate on the category prompts and the linked rate over four weeks, the last run, and
 * the next morning a prompt is due (computed from the prompts' periods; the plain sentence
 * when nothing can be computed). "Run now" is not here: it costs money and stays on the
 * Score page.
 */
export function AssistantsCard({
  reading,
  nextRun,
  href,
  adminRoute,
  language,
  now,
}: {
  reading: LedgerReading;
  /** The next 07:00 Riyadh a prompt is due, or null for the plain sentence. */
  nextRun: Date | null;
  href: string;
  adminRoute: string;
  language: string;
  /** The render's clock, one for every section. */
  now: Date;
}) {
  const s = adminStringsFor(language);
  const a = s.dashboard.assistants;
  const ledger = s.visibility.ledger;
  const engines = reading.engines;
  const nextText = nextRun
    ? s.time.riyadh.replace('{when}', formatSlot(nextRun, language, now))
    : a.nextRunDue;
  return (
    <DashboardSection
      hook="assistants"
      title={a.title}
      icon={AssistantsIcon}
      end={<SectionLink href={href}>{a.link}</SectionLink>}
    >
      {engines.length === 0 ? (
        <p className="text-small text-text-muted" data-admin-assistants-empty="">
          {ledger.empty}{' '}
          <Link
            href={`${adminRoute}/collections/prompts`}
            className="text-accent underline underline-offset-2"
          >
            {ledger.prompts}
          </Link>
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2" data-admin-assistants-engines={engines.length}>
          {engines.map((e) => (
            <li
              key={e.connection}
              className="flex flex-col gap-1 rounded-base border border-border p-3"
              data-admin-ledger-engine={e.connection}
            >
              <span className="text-small font-medium text-text">{e.label}</span>
              <span className="text-h3 text-text tabular-nums">{pct(e.mentioned, e.runs)}</span>
              <span className="text-caption text-text-muted tabular-nums">
                {ledger.rateLine
                  .replace('{cited}', String(e.mentioned))
                  .replace('{runs}', String(e.runs))
                  .replace('{linked}', pct(e.linked, e.rows))}
              </span>
              {e.monthlyLimitUsd === null && (
                <Badge tone="warning" className="self-start" data-admin-no-limit="">
                  {ledger.noLimit}
                </Badge>
              )}
            </li>
          ))}
        </ul>
      )}
      <dl className="grid grid-cols-2 gap-4 text-small">
        <div className="flex flex-col gap-0.5">
          <dt className="text-caption text-text-muted">{a.lastRun}</dt>
          <dd className="text-text" data-admin-assistants-last="">
            {reading.lastRunAt ? (
              <time dateTime={reading.lastRunAt}>
                {relativeTime(reading.lastRunAt, language, now)}
              </time>
            ) : (
              a.notYet
            )}
          </dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-caption text-text-muted">{a.nextRun}</dt>
          <dd className="text-text" data-admin-assistants-next={nextRun ? 'computed' : 'sentence'}>
            {nextText}
          </dd>
        </div>
      </dl>
    </DashboardSection>
  );
}
