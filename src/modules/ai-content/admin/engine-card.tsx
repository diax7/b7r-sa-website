import { Link } from '@payloadcms/ui';
import { Bot } from 'lucide-react';
import type { Payload } from 'payload';
import { Badge } from '@/components/shared/badge';
import { cn } from '@/lib/cn';
import { riyadh, riyadhDayStart, riyadhMonthStart } from '@/lib/riyadh';
import { costTodayOf } from '@/modules/ai-content/caps';
import {
  ENGINE_STATE_TONE,
  type EngineConnectionSummary,
  type EngineState,
  engineState,
} from '@/modules/ai-content/state';
import type { ConnectionRow } from '@/modules/cms/admin/dashboard/readers';
import {
  Bar,
  type BarTone,
  DashboardSection,
  SectionLink,
} from '@/modules/cms/admin/dashboard/section';
import { formatNumber, relativeTime } from '@/modules/cms/admin/format';
import { type AdminStrings, adminStringsFor } from '@/modules/cms/admin/strings';

/** When the engine next writes: a fact, worded by the card in the UI language. */
export type NextSlot =
  | { kind: 'off' }
  | { kind: 'noConnection' }
  | { kind: 'soon' }
  | { kind: 'today' | 'done'; hour: number };

export interface EngineSummary {
  state: EngineState;
  connection: EngineConnectionSummary | null;
  postsThisMonth: number;
  maxPostsPerMonth: number;
  costTodayUsd: number;
  dailyCostCapUsd: number;
  costThisMonthUsd: number;
  nextSlot: NextSlot;
}

/** The numbers behind the card (BRD 10.2.7): the month's posts and cost, today's cost, the next slot. */
export async function engineSummary(payload: Payload, now = new Date()): Promise<EngineSummary> {
  const {
    state,
    connection,
    publishHourRiyadh: hour,
    postsPerDay,
    maxPostsPerMonth,
    dailyCostCapUsd,
  } = await engineState(payload, now);
  const [month, today] = await Promise.all([
    payload.find({
      collection: 'ai-runs',
      where: {
        and: [
          { kind: { equals: 'generate' } },
          { startedAt: { greater_than_equal: riyadhMonthStart(now).toISOString() } },
        ],
      },
      depth: 0,
      limit: 500,
      pagination: false,
      select: { status: true, costUsd: true },
      overrideAccess: true,
    }),
    payload.find({
      collection: 'ai-runs',
      where: {
        and: [
          { startedAt: { greater_than_equal: riyadhDayStart(now).toISOString() } },
          { status: { not_equals: 'skipped' } },
        ],
      },
      depth: 0,
      limit: 200,
      pagination: false,
      select: { kind: true, costUsd: true },
      overrideAccess: true,
    }),
  ]);
  const runsToday = today.docs.filter((r) => r.kind === 'generate').length;
  let nextSlot: NextSlot = { kind: 'off' };
  if (state === 'noConnection' || state === 'connectionOff') nextSlot = { kind: 'noConnection' };
  else if (state !== 'off') {
    if (runsToday >= postsPerDay) nextSlot = { kind: 'done', hour };
    else if (riyadh(now).hour < hour) nextSlot = { kind: 'today', hour };
    else nextSlot = { kind: 'soon' };
  }
  return {
    state,
    connection,
    postsThisMonth: month.docs.filter((r) => r.status === 'done').length,
    maxPostsPerMonth,
    costTodayUsd: Math.round(costTodayOf(today.docs) * 100) / 100,
    dailyCostCapUsd,
    costThisMonthUsd: Math.round(month.docs.reduce((n, r) => n + (r.costUsd ?? 0), 0) * 100) / 100,
    nextSlot,
  };
}

function nextSlotText(slot: NextSlot, s: AdminStrings['engine']['card']): string {
  if (slot.kind === 'off') return s.nextSlotOff;
  if (slot.kind === 'noConnection') return s.nextSlotNoConnection;
  if (slot.kind === 'soon') return s.nextSlotSoon;
  const template = slot.kind === 'done' ? s.nextSlotDone : s.nextSlotToday;
  return template.replace('{hour}', String(slot.hour));
}

const usd = (n: number) => `$${n.toFixed(2)}`;
const share = (n: number, cap: number) => (cap > 0 ? Math.round((n / cap) * 100) : 0);

/** A figure against its cap with a bar: the Blog violet (identity), amber from 80 %, red at the cap. */
function Cap({
  label,
  value,
  n,
  cap,
  hook,
}: {
  label: string;
  value: string;
  n: number;
  cap: number;
  hook: string;
}) {
  const percent = share(n, cap);
  const tone: BarTone = percent >= 100 ? 'error' : percent >= 80 ? 'warning' : 'violet';
  return (
    <div className="flex flex-col gap-1" data-admin-engine-cap={hook}>
      <span className="text-caption text-text-muted">{label}</span>
      <span className="text-h4 text-text tabular-nums">{value}</span>
      <Bar percent={percent} tone={tone} />
    </div>
  );
}

/** The spend bar of a connection: amber with "no monthly limit" when it has none (the ledger card's rule), red at the limit. */
function SpendCell({
  row,
  s,
  noLimit,
}: {
  row: ConnectionRow;
  s: AdminStrings['engine']['card'];
  noLimit: string;
}) {
  const over = row.limitUsd !== null && row.spentUsd >= row.limitUsd;
  const percent = row.limitUsd === null ? 100 : share(row.spentUsd, row.limitUsd);
  const tone: BarTone = row.limitUsd === null ? 'warning' : over ? 'error' : 'slate';
  return (
    <div className="flex min-w-40 flex-col gap-1" data-admin-connection-spend={row.spentUsd}>
      <span className="flex items-center justify-between gap-2 text-small tabular-nums">
        <span className="text-text">
          {usd(row.spentUsd)}
          {row.limitUsd !== null && <span className="text-text-muted"> / {usd(row.limitUsd)}</span>}
        </span>
        {row.limitUsd === null ? (
          <Badge tone="warning" data-admin-no-limit="">
            {noLimit}
          </Badge>
        ) : over ? (
          <Badge tone="error" data-admin-over-limit="">
            {s.overLimit}
          </Badge>
        ) : null}
      </span>
      <Bar percent={percent} tone={tone} />
    </div>
  );
}

const th = 'py-1 pe-3 text-start text-caption font-medium text-text-muted';
const td = 'py-2 pe-3 align-top text-small text-text';

/**
 * "Engine and spend" on the dashboard (ADR-042, ADR-047, ADR-059, admins): the engine's
 * state, the month's posts against the monthly cap, today's cost against the daily cap, the
 * next slot, then one row per AI connection with its spend against its limit as a bar (amber
 * and "no monthly limit" when it has none, the CTO's edit), its runs and its last test. The
 * links at the foot open the settings, the topics and the runs. No run list here: a failed
 * run reaches the "needs a hand" line, and the runs page holds the rest.
 */
export function EngineCard({
  summary,
  connections,
  adminRoute,
  language,
  now,
}: {
  summary: EngineSummary;
  connections: ConnectionRow[] | null;
  adminRoute: string;
  language: string;
  /** The render's clock, one for every section. */
  now: Date;
}) {
  const strings = adminStringsFor(language);
  const s = strings.engine.card;
  const c = summary.connection;
  return (
    <DashboardSection
      hook="engine"
      title={s.title}
      icon={Bot}
      hue="violet"
      end={<Badge tone={ENGINE_STATE_TONE[summary.state]}>{s.state[summary.state]}</Badge>}
      data-admin-engine=""
      data-admin-engine-state={summary.state}
    >
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Cap
          label={s.postsThisMonth}
          value={s.ofCap
            .replace('{n}', formatNumber(summary.postsThisMonth, language))
            .replace('{cap}', formatNumber(summary.maxPostsPerMonth, language))}
          n={summary.postsThisMonth}
          cap={summary.maxPostsPerMonth}
          hook="posts"
        />
        <Cap
          label={s.costToday}
          value={`${usd(summary.costTodayUsd)} / ${usd(summary.dailyCostCapUsd)}`}
          n={summary.costTodayUsd}
          cap={summary.dailyCostCapUsd}
          hook="cost-today"
        />
        <div className="flex flex-col gap-1">
          <span className="text-caption text-text-muted">{s.cost}</span>
          <span className="text-h4 text-text tabular-nums">{usd(summary.costThisMonthUsd)}</span>
        </div>
      </div>
      <p className="text-small text-text-muted">
        <span className="font-medium text-text">{s.nextSlot}:</span>{' '}
        {nextSlotText(summary.nextSlot, s)}
      </p>
      {!c && (
        <p className="text-small text-text-muted" data-admin-engine-connection="none">
          <Link
            href={`${adminRoute}/collections/connections`}
            className="text-accent underline underline-offset-2"
          >
            {s.pickConnection}
          </Link>
        </p>
      )}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-caption text-text-muted">{s.connections}</span>
          <SectionLink href={`${adminRoute}/collections/connections`}>
            {s.allConnections}
          </SectionLink>
        </div>
        {connections === null || connections.length === 0 ? (
          <p className="text-small text-text-muted" data-admin-engine-connections="0">
            {s.noConnections}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table
              className="w-full border-collapse"
              data-admin-engine-connections={connections.length}
            >
              <thead>
                <tr>
                  <th className={th}>{s.connection}</th>
                  <th className={th}>{s.spend}</th>
                  <th className={cn(th, 'text-end')}>{s.runsThisMonth}</th>
                  <th className={th}>{s.lastTest}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {connections.map((row) => (
                  <tr
                    key={row.id}
                    data-admin-connection={row.id}
                    data-admin-engine-connection={c?.id === row.id ? row.id : undefined}
                  >
                    <td className={td}>
                      <Link
                        href={`${adminRoute}/collections/connections/${row.id}`}
                        className="text-accent underline underline-offset-2"
                      >
                        {row.label}
                      </Link>
                      {!row.enabled && (
                        <span className="text-text-muted"> ({s.connectionOff})</span>
                      )}
                    </td>
                    <td className={td}>
                      <SpendCell row={row} s={s} noLimit={strings.visibility.ledger.noLimit} />
                    </td>
                    <td className={cn(td, 'text-end tabular-nums')}>
                      {formatNumber(row.runs, language)}
                    </td>
                    <td className={cn(td, 'text-text-muted')}>
                      {row.lastTestAt === null
                        ? s.neverTested
                        : (row.lastTestOk ? s.testPassed : s.testFailed).replace(
                            '{when}',
                            relativeTime(row.lastTestAt, language, now),
                          )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
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
    </DashboardSection>
  );
}
