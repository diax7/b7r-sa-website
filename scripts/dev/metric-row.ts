/**
 * One `metrics` row by hand (Level 4 PR 4c): the snapshots refuse every API write (ADR-049),
 * so the admin e2e seeds an Umami day through the local API the pull writes with, and
 * removes it the same way. The date is a Riyadh day key (`YYYY-MM-DD`).
 *
 *   pnpm exec tsx scripts/dev/metric-row.ts upsert umami 2026-09-18 '{"visitors":3900,"pageviews":9100,"visits":4100,"bounces":900,"totaltime":602700}'
 *   pnpm exec tsx scripts/dev/metric-row.ts delete umami 2026-09-18
 */
import nextEnv from '@next/env';
import { getPayload } from 'payload';

nextEnv.loadEnvConfig(process.cwd());

const [action, source, date, json] = process.argv.slice(2);

async function main(): Promise<number> {
  if (!action || !source || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    console.error('usage: metric-row.ts upsert|delete <source> <YYYY-MM-DD> [json]');
    return 2;
  }
  // Imported after the env files are loaded: the config reads DATABASE_URL at import.
  const { default: config } = await import('../../src/payload.config');
  const { METRIC_SOURCES, upsertMetric } = await import('../../src/modules/visibility/metrics');
  if (!(METRIC_SOURCES as readonly string[]).includes(source)) {
    console.error(`metric-row.ts: not a source: ${source} (${METRIC_SOURCES.join(', ')})`);
    return 2;
  }
  const payload = await getPayload({ config });
  if (action === 'upsert') {
    if (!json) {
      console.error('metric-row.ts: upsert needs the JSON data as the fourth argument');
      return 2;
    }
    await upsertMetric(payload, {
      date,
      source: source as (typeof METRIC_SOURCES)[number],
      data: JSON.parse(json) as unknown,
    });
    console.warn(`metric-row.ts: wrote ${source} ${date}`);
    return 0;
  }
  if (action === 'delete') {
    const removed = await payload.delete({
      collection: 'metrics',
      where: { and: [{ source: { equals: source } }, { date: { equals: date } }] },
      overrideAccess: true,
    });
    console.warn(`metric-row.ts: removed ${removed.docs.length} row(s) of ${source} ${date}`);
    return 0;
  }
  console.error(`metric-row.ts: unknown action ${action}`);
  return 2;
}

main().then(
  (code) => process.exit(code),
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
