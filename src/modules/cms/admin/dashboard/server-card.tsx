import { ChevronDown, ExternalLink, Server } from 'lucide-react';
import { Badge } from '@/components/shared/badge';
import { Card } from '@/components/shared/card';
import { Icon } from '@/components/shared/icon';
import type { HealthReport } from '@/lib/cms/health';
import { ENGINE_STATE_TONE } from '@/modules/ai-content/state';
import { nextOccurrence, riyadhSlot, SCHEDULES } from '@/modules/cms/admin/dashboard/schedule';
import { formatSlot } from '@/modules/cms/admin/format';
import { type AdminStrings, adminStringsFor } from '@/modules/cms/admin/strings';

export type Tone = 'success' | 'warning' | 'error' | 'muted';

export interface HealthRow {
  key: string;
  tone: Tone;
  text: string;
}

type Kind = { live: string; mock: string; off: string };

function kindRow(key: string, rows: Kind, kind: string): HealthRow {
  if (kind === 'live') return { key, tone: 'success', text: rows.live };
  if (kind === 'mock') return { key, tone: 'warning', text: rows.mock };
  return { key, tone: 'error', text: rows.off };
}

function jobsFailedRow(
  failed: number | null,
  s: AdminStrings['dashboard']['health']['rows']['jobsFailed'],
): HealthRow {
  if (failed === null) return { key: 'jobsFailed', tone: 'muted', text: s.unknown };
  if (failed === 0) return { key: 'jobsFailed', tone: 'success', text: s.none };
  return { key: 'jobsFailed', tone: 'error', text: s.some.replace('{n}', String(failed)) };
}

/** The report as sentences an editor understands, each with a colour that says the same. */
export function healthRows(r: HealthReport, language: string): HealthRow[] {
  const s = adminStringsFor(language).dashboard.health;
  return [
    { key: 'db', tone: r.db === 'ok' ? 'success' : 'error', text: s.rows.db[r.db] },
    { key: 'jobs', tone: r.jobs === 'on' ? 'success' : 'warning', text: s.rows.jobs[r.jobs] },
    jobsFailedRow(r.jobsFailed, s.rows.jobsFailed),
    {
      key: 'email',
      tone: r.email === 'resend' ? 'success' : 'warning',
      text: s.rows.email[r.email],
    },
    {
      key: 'turnstile',
      tone: r.turnstile === 'on' ? 'success' : 'warning',
      text: s.rows.turnstile[r.turnstile],
    },
    {
      key: 'indexnow',
      tone: r.indexnow === 'on' ? 'success' : 'warning',
      text: s.rows.indexnow[r.indexnow],
    },
    { key: 'media', tone: r.media === 's3' ? 'success' : 'warning', text: s.rows.media[r.media] },
    kindRow('contact', s.rows.contact, r.contact),
    kindRow('newsletter', s.rows.newsletter, r.newsletter),
    { key: 'engine', tone: ENGINE_STATE_TONE[r.engine], text: s.engine[r.engine] },
  ];
}

/** The card's badge: the worst row wins. */
export function worstTone(rows: HealthRow[]): Tone {
  if (rows.some((r) => r.tone === 'error')) return 'error';
  if (rows.some((r) => r.tone === 'warning')) return 'warning';
  return 'success';
}

const DOT: Record<Tone, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
  muted: 'bg-text-muted',
};

/**
 * "Server" on the dashboard (ADR-039, ADR-059): the same report `/api/health` answers, as
 * ten rows with a colour each, the version, the jobs queue (the next time each scheduled job
 * runs, on the Riyadh clock) and the "Full report" link. Collapsed by default (a `details`,
 * no client state) and open when a row is red: what the environment is stays out of the way
 * until something needs a person.
 */
export function ServerCard({
  report,
  language,
  now,
}: {
  report: HealthReport;
  language: string;
  /** The render's clock, one for every section. */
  now: Date;
}) {
  const s = adminStringsFor(language);
  const h = s.dashboard.health;
  const rows = healthRows(report, language);
  const worst = worstTone(rows);
  return (
    <Card className="p-0" data-admin-dashboard-server={worst} data-admin-health="">
      <details open={worst === 'error'} className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-base p-5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40 [&::-webkit-details-marker]:hidden">
          <h2 className="flex items-center gap-2 text-h4 text-text">
            <Icon icon={Server} size={20} className="text-accent" />
            {h.title}
          </h2>
          <span className="flex items-center gap-3">
            <Badge tone={worst} data-admin-health-summary={worst}>
              {report.version === 'dev' ? 'dev' : `${h.version} ${report.version}`}
            </Badge>
            <Icon
              icon={ChevronDown}
              size={16}
              className="text-text-muted transition-transform duration-(--duration-fast) group-open:rotate-180 motion-reduce:transition-none"
            />
          </span>
        </summary>
        <div className="flex flex-col gap-4 px-5 pb-5">
          <ul className="flex flex-col gap-2">
            {rows.map((row) => (
              <li
                key={row.key}
                className="flex items-center gap-2.5 text-small text-text"
                data-health-row={row.key}
                data-tone={row.tone}
              >
                <span
                  aria-hidden="true"
                  className={`size-2 shrink-0 rounded-pill ${DOT[row.tone]}`}
                />
                {row.text}
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-1" data-admin-dashboard-queue="">
            <span className="text-caption text-text-muted">{h.queue}</span>
            <ul className="flex flex-col gap-1 text-small">
              {SCHEDULES.map((job) => (
                <li key={job.key} className="flex flex-wrap justify-between gap-x-3">
                  <span className="text-text">{h.schedules[job.key]}</span>
                  <span className="text-text-muted">
                    {s.time.riyadh.replace(
                      '{when}',
                      formatSlot(nextOccurrence(riyadhSlot(job.cron), now), language, now),
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <a
            href="/api/health"
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1.5 self-start text-caption text-accent hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            {h.check}
            <Icon icon={ExternalLink} size={12} />
          </a>
        </div>
      </details>
    </Card>
  );
}
