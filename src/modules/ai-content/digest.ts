import type { Payload, TaskConfig } from 'payload';
import { siteBase } from '@/lib/env';
import { riyadh } from '@/lib/riyadh';
import { envAllows } from '@/modules/ai-content/caps';
import { payloadStore } from '@/modules/ai-content/store/payload-store';
import { AI_QUEUE } from '@/modules/ai-content/workflow';

/**
 * The weekly digest (BRD 10.2.4 step 9, ADR-042): one e-mail with the week's runs, their
 * scores and costs, the failures and the next slot, when "Weekly digest" is on and an
 * address is set. The 12-month retention sweep on the runs log runs here too.
 */
export const DIGEST_TASK = 'content-digest' as const;
export const RETENTION_DAYS = 365;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export interface DigestRun {
  id: number;
  label: string;
  kind: 'generate' | 'freshness' | 'citation';
  status: string;
  score: number | null;
  costUsd: number;
  error: string | null;
  post: { title: string; slug: string } | null;
  startedAt: string;
}

export interface DigestSettings {
  enabled: boolean;
  publishHourRiyadh: number;
  postsPerDay: number;
}

function usd(n: number): string {
  return `${n.toFixed(2)} USD`;
}

/** Pure: the e-mail body for the week ending at `now`. */
export function digestText(args: {
  runs: DigestRun[];
  settings: DigestSettings;
  now: Date;
  base: string;
  envOn: boolean;
}): string {
  const { runs, settings, now, base } = args;
  // The ledger's batches (ADR-049 D5) are listed on their own: they write no post.
  const writes = runs.filter((r) => r.kind !== 'citation');
  const ledger = runs.filter((r) => r.kind === 'citation');
  const done = writes.filter((r) => r.status === 'done');
  const failed = writes.filter((r) => r.status === 'failed');
  const cost = runs.reduce((n, r) => n + r.costUsd, 0);
  const lines: string[] = [
    `Content engine, the week to ${riyadh(now).dateKey} (Riyadh)`,
    '',
    `${done.length} post(s) written, ${failed.length} failure(s), ${usd(cost)} spent.`,
  ];
  if (done.length > 0) {
    lines.push('', 'Posts:');
    for (const r of done) {
      const where = r.post ? `${base}/blog/${r.post.slug}` : `run ${r.id}`;
      const title = r.post?.title ?? r.label;
      lines.push(`- ${title} (${r.kind}, score ${r.score ?? '?'}, ${usd(r.costUsd)}): ${where}`);
    }
  }
  if (failed.length > 0) {
    lines.push('', 'Failures:');
    for (const r of failed) lines.push(`- ${r.label}: ${r.error ?? 'no reason recorded'}`);
  }
  if (ledger.length > 0) {
    lines.push('', 'Citation ledger:');
    for (const r of ledger) {
      lines.push(
        `- ${r.label} (${usd(r.costUsd)})${r.status === 'skipped' && r.error ? `: ${r.error}` : ''}`,
      );
    }
  }
  lines.push('', `Next slot: ${nextSlot(settings, args.envOn)}`);
  lines.push('', `Runs: ${base}/admin/collections/ai-runs`);
  return lines.join('\n');
}

function nextSlot(settings: DigestSettings, envOn: boolean): string {
  if (!settings.enabled || !envOn) return 'the engine is switched off';
  return `${settings.publishHourRiyadh}:00 Riyadh, ${settings.postsPerDay} post(s) a day`;
}

export interface DigestResult {
  sent: boolean;
  deleted: number;
  reason: string | null;
}

async function weekRuns(payload: Payload, now: Date): Promise<DigestRun[]> {
  const since = new Date(now.getTime() - WEEK_MS).toISOString();
  const { docs } = await payload.find({
    collection: 'ai-runs',
    where: { startedAt: { greater_than_equal: since } },
    depth: 1,
    limit: 500,
    pagination: false,
    sort: 'startedAt',
    locale: 'ar',
    overrideAccess: true,
  });
  return docs.map((r) => ({
    id: r.id,
    label: r.label,
    kind: r.kind,
    status: r.status,
    score: r.score ?? null,
    costUsd: r.costUsd ?? 0,
    error: r.error ?? null,
    post: typeof r.post === 'object' && r.post ? { title: r.post.title, slug: r.post.slug } : null,
    startedAt: r.startedAt ?? r.createdAt,
  }));
}

/** Deletes run rows older than a year; a topic's `lastRun` link is set to null by the database. */
async function sweep(payload: Payload, now: Date): Promise<number> {
  const cutoff = new Date(now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const result = await payload.delete({
    collection: 'ai-runs',
    where: { startedAt: { less_than: cutoff } },
    depth: 0,
    overrideAccess: true,
  });
  return result.docs.length;
}

export async function digest(payload: Payload, now = new Date()): Promise<DigestResult> {
  const settings = await payloadStore(payload).settings();
  const deleted = await sweep(payload, now);
  if (!settings.weeklyDigest || !settings.notifyEmail) {
    return { sent: false, deleted, reason: 'no digest address or the digest is off' };
  }
  const runs = await weekRuns(payload, now);
  await payload.sendEmail({
    to: settings.notifyEmail,
    subject: `Content engine: the week's ${runs.filter((r) => r.status === 'done').length} post(s)`,
    text: digestText({ runs, settings, now, base: siteBase(), envOn: envAllows() }),
  });
  return { sent: true, deleted, reason: null };
}

export const digestTask: TaskConfig<{
  input: object;
  output: { sent: boolean; deleted: number; reason: string | null };
}> = {
  slug: DIGEST_TASK,
  label: 'Content engine: weekly digest',
  // Sunday 08:00 Riyadh on a UTC clock (the production runtime; Riyadh has no DST).
  schedule: [{ cron: '0 5 * * 0', queue: AI_QUEUE }],
  inputSchema: [],
  outputSchema: [
    { name: 'sent', type: 'checkbox' },
    { name: 'deleted', type: 'number' },
    { name: 'reason', type: 'text' },
  ],
  handler: async ({ req }) => {
    const result = await digest(req.payload);
    req.payload.logger.info({
      msg: `content engine digest: ${result.sent ? 'sent' : `not sent (${result.reason})`}, ${result.deleted} old run(s) deleted`,
    });
    return { output: result };
  },
};
