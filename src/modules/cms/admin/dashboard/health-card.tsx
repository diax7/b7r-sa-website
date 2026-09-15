import { Activity, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/shared/badge';
import { Card } from '@/components/shared/card';
import { Icon } from '@/components/shared/icon';
import type { HealthReport } from '@/lib/cms/health';
import { ENGINE_STATE_TONE } from '@/modules/ai-content/state';
import { adminStrings } from '@/modules/cms/admin/strings';

const s = adminStrings.dashboard.health;

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

function jobsFailedRow(failed: number | null): HealthRow {
  if (failed === null) return { key: 'jobsFailed', tone: 'muted', text: s.rows.jobsFailed.unknown };
  if (failed === 0) return { key: 'jobsFailed', tone: 'success', text: s.rows.jobsFailed.none };
  return {
    key: 'jobsFailed',
    tone: 'error',
    text: s.rows.jobsFailed.some.replace('{n}', String(failed)),
  };
}

/** The report as sentences an editor understands, each with a colour that says the same. */
export function healthRows(r: HealthReport): HealthRow[] {
  return [
    { key: 'db', tone: r.db === 'ok' ? 'success' : 'error', text: s.rows.db[r.db] },
    { key: 'jobs', tone: r.jobs === 'on' ? 'success' : 'warning', text: s.rows.jobs[r.jobs] },
    jobsFailedRow(r.jobsFailed),
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

export function HealthCard({ report }: { report: HealthReport }) {
  const rows = healthRows(report);
  const worst = worstTone(rows);
  return (
    <Card className="flex flex-col gap-4 p-5" data-admin-health="">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-h4 text-text">
          <Icon icon={Activity} size={20} className="text-accent" />
          {s.title}
        </h2>
        <Badge tone={worst} data-admin-health-summary={worst}>
          {report.version === 'dev' ? 'dev' : `${s.version} ${report.version}`}
        </Badge>
      </div>
      <ul className="flex flex-col gap-2">
        {rows.map((row) => (
          <li
            key={row.key}
            className="flex items-center gap-2.5 text-small text-text"
            data-health-row={row.key}
            data-tone={row.tone}
          >
            <span aria-hidden="true" className={`size-2 shrink-0 rounded-pill ${DOT[row.tone]}`} />
            {row.text}
          </li>
        ))}
      </ul>
      <a
        href="/api/health"
        target="_blank"
        rel="noopener"
        className="inline-flex items-center gap-1.5 self-start text-caption text-accent hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        {s.check}
        <Icon icon={ExternalLink} size={12} />
      </a>
    </Card>
  );
}
