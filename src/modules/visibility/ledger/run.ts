import type { Payload, TaskConfig } from 'payload';
import { riyadh } from '@/lib/riyadh';
import { addUsage, estimateCostUsd, type Usage, ZERO_USAGE } from '@/modules/ai-content/cost';
import { AI_QUEUE } from '@/modules/ai-content/workflow';
import { type ConnectionSpec, KINDS, kindsThat, mockAllowed } from '@/modules/connections/kinds';
import { readConnection } from '@/modules/connections/read';
import { safeMessage } from '@/modules/connections/safe-message';
import { connectionSpend } from '@/modules/connections/spend';
import { type Asker, mockAsker, sdkAsker } from '@/modules/visibility/ledger/ask';
import { mentionsBrand, readAnswer } from '@/modules/visibility/ledger/read-answer';

export const CITATION_LEDGER = 'citation-ledger' as const;
/** A connection is asked once an hour at most: a double "Run now" costs one batch. */
export const LEDGER_COOLDOWN_MS = 60 * 60_000;
/** The batch stops asking after this and records the rest as not run. */
export const LEDGER_BUDGET_MS = 20 * 60_000;

export interface LedgerPrompt {
  id: number;
  text: string;
  language: 'ar' | 'en';
  namesBrand: boolean;
}

export interface LedgerConnectionResult {
  connection: string;
  status: 'done' | 'failed' | 'skipped';
  reason: string | null;
  asked: number;
  cited: number;
  notRun: number;
  costUsd: number;
}

export interface LedgerResult {
  date: string;
  prompts: number;
  connections: LedgerConnectionResult[];
}

/** What a connection's batch costs: the tokens at its rates plus the vendor's per-search fee. */
export function batchCostUsd(spec: ConnectionSpec, usage: Usage, searches: number): number {
  const tokens = estimateCostUsd(usage, spec.rates);
  return Math.round((tokens + searches * KINDS[spec.kind].searchFeeUsd) * 10_000) / 10_000;
}

/** The label the runs list shows: the outcome in one line, the failures and the leftovers named. */
export function batchLabel(args: {
  label: string;
  asked: number;
  cited: number;
  failed?: number;
  notRun: number;
}): string {
  const { label, asked, cited, failed = 0, notRun } = args;
  return `Citation ledger, ${label}: ${asked} prompt${asked === 1 ? '' : 's'}, ${cited} cited${failed ? `, ${failed} failed` : ''}${notRun ? `, ${notRun} not run` : ''}`;
}

async function enabledPrompts(payload: Payload): Promise<LedgerPrompt[]> {
  const found = await payload.find({
    collection: 'prompts',
    where: { enabled: { equals: true } },
    sort: 'order',
    depth: 0,
    pagination: false,
    overrideAccess: true,
  });
  // The text decides too: a prompt naming B7R leaves the rate whether or not the box is ticked.
  return found.docs.map((p) => ({
    id: p.id,
    text: p.text,
    language: p.language,
    namesBrand: p.namesBrand === true || mentionsBrand(p.text),
  }));
}

/** The reasons a connection is not asked this batch, checked before any call. */
async function refusal(
  payload: Payload,
  spec: ConnectionSpec,
  now: Date,
  env: Record<string, string | undefined>,
): Promise<string | null> {
  if (spec.kind === 'mock' && !mockAllowed(env)) return 'the mock kind needs AI_CONTENT_MOCK=1';
  if (spec.kind !== 'mock' && !spec.apiKey) return 'no API key saved on this connection';
  if (spec.kind !== 'mock' && !spec.model) return 'no model id on this connection';
  const spend = await connectionSpend(payload, spec.id, now);
  if (spec.monthlyLimitUsd !== null && spend.spentUsd >= spec.monthlyLimitUsd) {
    return `this month's cost ${spend.spentUsd.toFixed(2)} USD reached the limit ${spec.monthlyLimitUsd} USD`;
  }
  const recent = await payload.count({
    collection: 'ai-runs',
    where: {
      and: [
        { connection: { equals: spec.id } },
        { kind: { equals: 'citation' } },
        { status: { not_equals: 'skipped' } },
        {
          startedAt: {
            greater_than_equal: new Date(now.getTime() - LEDGER_COOLDOWN_MS).toISOString(),
          },
        },
      ],
    },
    overrideAccess: true,
  });
  if (recent.totalDocs > 0) return 'asked within the hour';
  return null;
}

async function skippedRun(payload: Payload, spec: ConnectionSpec, reason: string, now: Date) {
  await payload.create({
    collection: 'ai-runs',
    data: {
      label: `Citation ledger, ${spec.label}: skipped`,
      kind: 'citation',
      status: 'skipped',
      provider: spec.kind,
      model: spec.model,
      connection: spec.id,
      error: reason,
      startedAt: now.toISOString(),
      finishedAt: now.toISOString(),
    },
    depth: 0,
    overrideAccess: true,
  });
}

/** One connection's batch: every prompt within the budget, one `ai-runs` row, one citation row each. */
async function askAll(args: {
  payload: Payload;
  spec: ConnectionSpec;
  prompts: LedgerPrompt[];
  ask: Asker;
  date: string;
  startedAt: Date;
  clock: () => number;
}): Promise<LedgerConnectionResult> {
  const { payload, spec, prompts, ask, date, startedAt, clock } = args;
  const run = await payload.create({
    collection: 'ai-runs',
    data: {
      label: `Citation ledger, ${spec.label}: running`,
      kind: 'citation',
      status: 'running',
      provider: spec.kind,
      model: spec.model,
      connection: spec.id,
      startedAt: startedAt.toISOString(),
    },
    depth: 0,
    overrideAccess: true,
  });
  let usage = ZERO_USAGE;
  let searches = 0;
  let asked = 0;
  let cited = 0;
  let notRun = 0;
  const errors: string[] = [];
  for (const prompt of prompts) {
    if (clock() - startedAt.getTime() > LEDGER_BUDGET_MS) {
      notRun += 1;
      continue;
    }
    try {
      // One prompt at a time: the vendors rate-limit and the budget is wall-clock.
      // oxlint-disable-next-line no-await-in-loop
      const answer = await ask(prompt.text);
      const reading = readAnswer({
        kind: spec.kind,
        text: answer.text,
        sources: answer.sources,
        raw: answer.raw,
      });
      usage = addUsage(usage, answer.usage);
      searches += answer.searches;
      asked += 1;
      if (reading.mentioned) cited += 1;
      // oxlint-disable-next-line no-await-in-loop
      await payload.create({
        collection: 'citations',
        data: {
          title: `${date} · ${spec.label}`,
          date,
          provider: spec.kind,
          model: spec.model,
          mode: answer.mode,
          mentioned: reading.mentioned,
          linked: reading.linked,
          namesBrand: prompt.namesBrand,
          promptText: prompt.text,
          excerpt: reading.excerpt,
          urls: reading.urls,
          competitors: reading.competitors,
          prompt: prompt.id,
          connection: spec.id,
          run: run.id,
        },
        depth: 0,
        overrideAccess: true,
      });
    } catch (error) {
      errors.push(`${prompt.id}: ${safeMessage(error, spec.apiKey)}`);
    }
  }
  const costUsd = batchCostUsd(spec, usage, searches);
  const status = asked === 0 && errors.length > 0 ? 'failed' : 'done';
  const finishedAt = new Date(clock());
  await payload.update({
    collection: 'ai-runs',
    id: run.id,
    data: {
      label: batchLabel({ label: spec.label, asked, cited, failed: errors.length, notRun }),
      status,
      tokensIn: usage.inputTokens,
      tokensOut: usage.outputTokens,
      costUsd,
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      steps: { asked, cited, notRun, searches, errors: errors.slice(0, 20) },
      ...(errors.length ? { error: errors.slice(0, 5).join('\n') } : {}),
      finishedAt: finishedAt.toISOString(),
    },
    depth: 0,
    overrideAccess: true,
  });
  return { connection: spec.label, status, reason: null, asked, cited, notRun, costUsd };
}

/**
 * The weekly batch (ADR-049 D5): every enabled AI connection asks every enabled prompt, one
 * `citation` run per connection (the tokens, the searches and the cost summed), one
 * `citations` row per prompt. A connection over its monthly limit, without a key, or asked
 * within the hour is skipped with a run that says why. The mock kind answers without a call
 * behind its gate. Runs on the `ai` queue, serial by ADR-033.
 */
export async function runLedger(
  payload: Payload,
  options: { now?: Date; env?: Record<string, string | undefined>; clock?: () => number } = {},
): Promise<LedgerResult> {
  const now = options.now ?? new Date();
  const env = options.env ?? process.env;
  const clock = options.clock ?? (() => Date.now());
  const date = riyadh(now).dateKey;
  const prompts = await enabledPrompts(payload);
  const rows = await payload.find({
    collection: 'connections',
    where: { and: [{ enabled: { equals: true } }, { kind: { in: kindsThat('ai') } }] },
    sort: 'id',
    depth: 0,
    pagination: false,
    overrideAccess: true,
  });
  const result: LedgerResult = { date, prompts: prompts.length, connections: [] };
  for (const row of rows.docs) {
    // Serial: one vendor at a time keeps the budget honest and the log readable.
    // oxlint-disable-next-line no-await-in-loop
    const spec = await readConnection(payload, row.id);
    if (!spec) continue;
    // oxlint-disable-next-line no-await-in-loop
    const reason = await refusal(payload, spec, now, env);
    if (reason) {
      // oxlint-disable-next-line no-await-in-loop
      await skippedRun(payload, spec, reason, now);
      result.connections.push({
        connection: spec.label,
        status: 'skipped',
        reason,
        asked: 0,
        cited: 0,
        notRun: prompts.length,
        costUsd: 0,
      });
      continue;
    }
    const ask =
      spec.kind === 'mock' ? mockAsker() : sdkAsker({ ...spec, apiKey: spec.apiKey ?? '' });
    result.connections.push(
      // oxlint-disable-next-line no-await-in-loop
      await askAll({ payload, spec, prompts, ask, date, startedAt: new Date(clock()), clock }),
    );
  }
  payload.logger.info({
    msg: `citation ledger: ${result.connections.map((c) => `${c.connection} ${c.status}${c.status === 'done' ? ` ${c.cited}/${c.asked}` : ''}`).join('; ') || 'no AI connection'}`,
  });
  return result;
}

export const citationLedgerTask: TaskConfig<{
  input: object;
  output: { summary: string };
}> = {
  slug: CITATION_LEDGER,
  label: 'Visibility: citation ledger',
  // Monday 07:00 Riyadh on a UTC clock (Riyadh has no DST).
  schedule: [{ cron: '0 4 * * 1', queue: AI_QUEUE }],
  inputSchema: [],
  outputSchema: [{ name: 'summary', type: 'text' }],
  handler: async ({ req }) => {
    const result = await runLedger(req.payload);
    return {
      output: {
        summary: result.connections
          .map(
            (c) =>
              `${c.connection}: ${c.status}${c.reason ? ` (${c.reason})` : ` ${c.cited}/${c.asked}`}`,
          )
          .join('; '),
      },
    };
  },
};

/** "Run now" on the page: one job, served by the `ai` queue within the minute. */
export function queueLedger(payload: Payload) {
  return payload.jobs.queue({ task: CITATION_LEDGER, queue: AI_QUEUE, input: {} });
}
