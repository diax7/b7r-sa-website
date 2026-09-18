/**
 * The AI spend, Phase 3 of the 2026-09-18 programme (docs/audits/2026-09-18-ai-cost.md):
 * every prompt weekly, the cheap models on the Google and Anthropic connections (the rates
 * follow through `fillFromKind`), a monthly limit on every AI connection, and the stale
 * queued ledger jobs removed so the next queue is on the container's clock. Prints every
 * row it changes and never a key. Never triggers a run.
 *
 *   pnpm exec tsx scripts/ai-spend.ts [--env .env.cranl.local]
 *
 * Without `--env` it reads the usual env files (the review database); with it, that file's
 * DATABASE_URL and PAYLOAD_SECRET point it at another database (production).
 */
import { readFileSync } from 'node:fs';
import nextEnv from '@next/env';
import { getPayload } from 'payload';

const envFlag = process.argv.indexOf('--env');
if (envFlag > -1) {
  const file = process.argv[envFlag + 1];
  if (!file) {
    console.error('usage: tsx scripts/ai-spend.ts [--env <file>]');
    process.exit(2);
  }
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = /^(DATABASE_URL|PAYLOAD_SECRET)=(.*)$/.exec(line);
    if (m) process.env[m[1]!] = m[2]!.trim();
  }
} else {
  nextEnv.loadEnvConfig(process.cwd());
}

/** The period every prompt gets (the seed's default since Phase 3). */
const EVERY_DAYS = 7;
/** The cheap model per kind, and the monthly brake in USD (the audit's §6). */
const MODEL: Record<string, string> = {
  google: 'gemini-3-flash-preview',
  anthropic: 'claude-haiku-4-5',
};
const LIMIT: Record<string, number> = { openai: 10, google: 5, anthropic: 5 };

async function main(): Promise<void> {
  const { default: config } = await import('../src/payload.config');
  const payload = await getPayload({ config });
  const host = new URL(process.env['DATABASE_URL'] ?? 'postgres://x').hostname;
  console.log(`ai-spend: database at ${host}`);

  const prompts = await payload.find({ collection: 'prompts', limit: 500, depth: 0 });
  let periods = 0;
  for (const p of prompts.docs) {
    if (p.everyDays === EVERY_DAYS) continue;
    await payload.update({ collection: 'prompts', id: p.id, data: { everyDays: EVERY_DAYS } });
    periods += 1;
    console.log(`  prompt ${p.id}: everyDays ${p.everyDays} -> ${EVERY_DAYS}`);
  }
  console.log(`  prompts: ${periods} of ${prompts.docs.length} changed to ${EVERY_DAYS} days`);

  const connections = await payload.find({ collection: 'connections', limit: 100, depth: 0 });
  for (const c of connections.docs) {
    const data: Record<string, unknown> = {};
    const model = MODEL[c.kind];
    if (model && c.model !== model) data['model'] = model;
    const limit = LIMIT[c.kind];
    if (limit !== undefined && c.monthlyLimitUsd !== limit) data['monthlyLimitUsd'] = limit;
    if (Object.keys(data).length === 0) {
      console.log(
        `  connection ${c.id} (${c.kind}): unchanged (${c.model ?? ''}, limit ${c.monthlyLimitUsd ?? 'none'})`,
      );
      continue;
    }
    const after = await payload.update({ collection: 'connections', id: c.id, data });
    console.log(
      `  connection ${c.id} (${c.kind}): ${c.model ?? ''} -> ${after.model}, rates ${after.inputPerMillionUsd} / ${after.outputPerMillionUsd}, limit ${c.monthlyLimitUsd ?? 'none'} -> ${after.monthlyLimitUsd}`,
    );
  }

  // Queued jobs carrying the old schedule (queued by a process on another clock): removed,
  // and the container re-queues each task at its next cron tick.
  const stale = await payload.find({
    collection: 'payload-jobs',
    where: {
      and: [
        { taskSlug: { in: ['citation-ledger', 'content-freshness', 'content-digest'] } },
        { completedAt: { exists: false } },
        { hasError: { not_equals: true } },
      ],
    },
    limit: 50,
    depth: 0,
  });
  for (const job of stale.docs) {
    await payload.delete({ collection: 'payload-jobs', id: job.id });
    console.log(`  job ${job.id} (${job.taskSlug}, ${job.waitUntil ?? 'now'}): removed`);
  }
  console.log('ai-spend: done');
}

main().then(
  () => process.exit(0),
  (error: unknown) => {
    console.error(error);
    process.exit(1);
  },
);
