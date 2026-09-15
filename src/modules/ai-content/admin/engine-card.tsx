import { Link } from '@payloadcms/ui';
import { Bot } from 'lucide-react';
import type { Payload } from 'payload';
import { Badge } from '@/components/shared/badge';
import { Card } from '@/components/shared/card';
import { Icon } from '@/components/shared/icon';
import { riyadh, riyadhDayStart, riyadhMonthStart } from '@/lib/riyadh';
import {
  ENGINE_STATE_TONE,
  type EngineConnectionSummary,
  type EngineState,
  engineState,
} from '@/modules/ai-content/state';
import { relativeTime } from '@/modules/cms/admin/dashboard/relative-time';
import { adminStrings } from '@/modules/cms/admin/strings';

const s = adminStrings.engine.card;

export interface EngineSummary {
  state: EngineState;
  connection: EngineConnectionSummary | null;
  postsThisMonth: number;
  averageScore: number | null;
  failures: number;
  costUsd: number;
  nextSlot: string;
  recent: Array<{ id: number; label: string; status: string; score: number | null; at: string }>;
}

/** The numbers behind the card (BRD 10.2.7), read once per dashboard render. */
export async function engineSummary(payload: Payload, now = new Date()): Promise<EngineSummary> {
  const {
    state,
    connection,
    publishHourRiyadh: hour,
    postsPerDay,
  } = await engineState(payload, now);
  const month = riyadhMonthStart(now).toISOString();
  const [monthRuns, recent, today] = await Promise.all([
    payload.find({
      collection: 'ai-runs',
      where: {
        and: [{ kind: { equals: 'generate' } }, { startedAt: { greater_than_equal: month } }],
      },
      depth: 0,
      limit: 500,
      pagination: false,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'ai-runs',
      depth: 0,
      limit: 5,
      sort: '-startedAt',
      overrideAccess: true,
    }),
    payload.count({
      collection: 'ai-runs',
      where: {
        and: [
          { kind: { equals: 'generate' } },
          { startedAt: { greater_than_equal: riyadhDayStart(now).toISOString() } },
          { status: { not_equals: 'skipped' } },
        ],
      },
      overrideAccess: true,
    }),
  ]);
  const done = monthRuns.docs.filter((r) => r.status === 'done');
  const scores = done.map((r) => r.score).filter((n): n is number => typeof n === 'number');
  let nextSlot: string = s.nextSlotOff;
  if (state === 'noConnection' || state === 'connectionOff') nextSlot = s.nextSlotNoConnection;
  else if (state !== 'off') {
    if (today.totalDocs >= postsPerDay) nextSlot = s.nextSlotDone.replace('{hour}', String(hour));
    else if (riyadh(now).hour < hour) nextSlot = s.nextSlotToday.replace('{hour}', String(hour));
    else nextSlot = s.nextSlotSoon;
  }
  return {
    state,
    connection,
    postsThisMonth: done.length,
    averageScore: scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null,
    failures: monthRuns.docs.filter((r) => r.status === 'failed').length,
    costUsd: Math.round(monthRuns.docs.reduce((n, r) => n + (r.costUsd ?? 0), 0) * 100) / 100,
    nextSlot,
    recent: recent.docs.map((r) => ({
      id: r.id,
      label: r.label,
      status: r.status,
      score: r.score ?? null,
      at: r.startedAt ?? r.createdAt,
    })),
  };
}

const STATUS_TONE = {
  done: 'success',
  failed: 'error',
  running: 'warning',
  skipped: 'muted',
} as const;

function stat(label: string, value: string) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-caption text-text-muted">{label}</span>
      <span className="text-h4 text-text">{value}</span>
    </div>
  );
}

/** The "Content engine" card on the dashboard (admins): the monitoring §10.2.7 asks for. */
export function EngineCard({
  summary,
  adminRoute,
}: {
  summary: EngineSummary;
  adminRoute: string;
}) {
  const stateTone = ENGINE_STATE_TONE[summary.state];
  const stateLabel = s.state[summary.state];
  const c = summary.connection;
  return (
    <Card
      className="flex flex-col gap-4 p-5"
      data-admin-engine=""
      data-admin-engine-state={summary.state}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-h4 text-text">
          <Icon icon={Bot} size={20} className="text-accent" />
          {s.title}
        </h2>
        <Badge tone={stateTone}>{stateLabel}</Badge>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stat(s.postsThisMonth, String(summary.postsThisMonth))}
        {stat(s.averageScore, summary.averageScore === null ? '·' : String(summary.averageScore))}
        {stat(s.failures, String(summary.failures))}
        {stat(s.cost, `$${summary.costUsd.toFixed(2)}`)}
      </div>
      <p className="text-small text-text-muted">
        <span className="font-medium text-text">{s.nextSlot}:</span> {summary.nextSlot}
      </p>
      <p className="text-small text-text-muted" data-admin-engine-connection={c ? c.id : 'none'}>
        <span className="font-medium text-text">{s.connection}:</span>{' '}
        {c ? (
          <>
            <Link
              href={`${adminRoute}/collections/connections/${c.id}`}
              className="text-accent underline underline-offset-2"
            >
              {c.label}
            </Link>
            {c.enabled ? '' : ` (${s.connectionOff})`} · ${c.spentUsd.toFixed(2)}
            {c.limitUsd === null ? ` ${s.noLimit}` : ` / $${c.limitUsd}`}
          </>
        ) : (
          <Link
            href={`${adminRoute}/collections/connections`}
            className="text-accent underline underline-offset-2"
          >
            {s.pickConnection}
          </Link>
        )}
      </p>
      {summary.recent.length === 0 ? (
        <p className="text-small text-text-muted">{s.empty}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border" data-admin-engine-recent="">
          {summary.recent.map((run) => (
            <li key={run.id}>
              <Link
                href={`${adminRoute}/collections/ai-runs/${run.id}`}
                className="flex items-center gap-3 py-2 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                <Badge tone={STATUS_TONE[run.status as keyof typeof STATUS_TONE] ?? 'muted'}>
                  {run.status}
                </Badge>
                <span className="min-w-0 flex-1 truncate text-small text-text">{run.label}</span>
                {run.score !== null && (
                  <span className="text-caption text-text-muted">{run.score}</span>
                )}
                <time dateTime={run.at} className="shrink-0 text-caption text-text-muted">
                  {relativeTime(run.at)}
                </time>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-4 text-caption">
        <Link href={`${adminRoute}/globals/ai-settings`} className="text-accent hover:underline">
          {s.settings}
        </Link>
        <Link href={`${adminRoute}/collections/ai-topics`} className="text-accent hover:underline">
          {s.topics}
        </Link>
        <Link href={`${adminRoute}/collections/ai-runs`} className="text-accent hover:underline">
          {s.runs}
        </Link>
      </div>
    </Card>
  );
}
