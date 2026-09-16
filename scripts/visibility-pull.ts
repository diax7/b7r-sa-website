/**
 * Runs the visibility pull by hand (ADR-049 D4): every connected service, one snapshot row
 * per source for the day, then the day's score row; the same code the nightly job runs.
 * `--check` runs it twice and proves a second pull the same day replaces the day's rows
 * rather than doubling them (the CI integration check). Exit 1 on a failed service so a
 * shell notices; the page shows the last good snapshot either way.
 */
import nextEnv from '@next/env';
import { getPayload } from 'payload';

nextEnv.loadEnvConfig(process.cwd());

const check = process.argv.includes('--check');

const sources = (rows: Array<{ source: string }>) => rows.map((r) => r.source).toSorted();

async function main(): Promise<number> {
  // Imported after the env files are loaded: the config reads DATABASE_URL and the secret at import.
  const { default: config } = await import('../src/payload.config');
  const { pull } = await import('../src/modules/visibility/pull');
  const payload = await getPayload({ config });
  const first = await pull(payload);
  console.warn(
    `visibility:pull: ${first.date}: pulled ${first.pulled.join(', ') || 'nothing'}; score ${first.score ?? '?'}` +
      (first.failed.length
        ? `; failed ${first.failed.map((f) => `${f.source} (${f.error})`).join(', ')}`
        : ''),
  );
  if (!check) return first.failed.length ? 1 : 0;
  const rowsOf = async () =>
    (
      await payload.find({
        collection: 'metrics',
        where: { date: { equals: first.date } },
        limit: 100,
        depth: 0,
        overrideAccess: true,
      })
    ).docs.map((d) => ({ source: d.source, updatedAt: d.updatedAt }));
  const before = await rowsOf();
  const second = await pull(payload);
  const after = await rowsOf();
  if (
    sources(after).join() !== sources(before).join() ||
    new Set(sources(after)).size !== after.length
  ) {
    console.error(
      `visibility:pull --check: expected one row per source, got ${sources(before).join(',')} then ${sources(after).join(',')}`,
    );
    return 1;
  }
  const replaced = after.every(
    (a) => a.updatedAt > (before.find((b) => b.source === a.source)?.updatedAt ?? ''),
  );
  if (!replaced) {
    console.error('visibility:pull --check: the second pull did not replace the rows');
    return 1;
  }
  console.warn(
    `visibility:pull --check: ${after.length} row(s) for ${second.date}, each replaced once.`,
  );
  return second.failed.length ? 1 : 0;
}

try {
  process.exit(await main());
} catch (error) {
  console.error('visibility:pull failed:', error instanceof Error ? error.message : error);
  process.exit(1);
}
