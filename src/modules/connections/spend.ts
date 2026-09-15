import type { Payload, PayloadRequest } from 'payload';
import { riyadhMonthStart } from '@/lib/riyadh';

export interface ConnectionSpend {
  /** The estimated cost of the connection's runs since the Riyadh month began. */
  spentUsd: number;
  calls: number;
}

/**
 * What a connection has cost this month (ADR-047): the `ai-runs` rows that name it, started
 * since the Riyadh month began, `skipped` left out (a refused run costs nothing). There is no
 * ledger: the runs are the record, and the header, the engine card and the monthly limit all
 * read this one sum; every row of the month is read (no page limit: this guards money). A
 * Test is not a run and never counts.
 */
export async function connectionSpend(
  payload: Payload,
  id: number,
  now = new Date(),
): Promise<ConnectionSpend> {
  const runs = await payload.find({
    collection: 'ai-runs',
    where: {
      and: [
        { connection: { equals: id } },
        { startedAt: { greater_than_equal: riyadhMonthStart(now).toISOString() } },
        { status: { not_equals: 'skipped' } },
      ],
    },
    depth: 0,
    pagination: false,
    select: { costUsd: true },
    overrideAccess: true,
  });
  return {
    spentUsd: Math.round(runs.docs.reduce((n, r) => n + (r.costUsd ?? 0), 0) * 10_000) / 10_000,
    calls: runs.docs.length,
  };
}

/** The spend once per request: the two virtual fields of a document share one query. */
export async function spendFor(req: PayloadRequest, id: number): Promise<ConnectionSpend> {
  const key = `connectionSpend:${id}`;
  const cached = req.context[key] as Promise<ConnectionSpend> | undefined;
  if (cached) return cached;
  const pending = connectionSpend(req.payload, id);
  req.context[key] = pending;
  return pending;
}
