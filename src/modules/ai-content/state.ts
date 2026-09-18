import type { Payload } from 'payload';
import { envAllows } from '@/modules/ai-content/caps';
import { mockAllowed } from '@/modules/connections/kinds';
import { connectionIdOf, findConnection } from '@/modules/connections/read';
import { connectionSpend } from '@/modules/connections/spend';

/**
 * The engine as the dashboard and `/api/health` describe it (ADR-039, ADR-047): one reading
 * so the two never disagree. `off` is the switch or the env; the rest needs the engine on:
 * `noConnection` (nothing picked), `connectionOff`, `mock` (a mock connection where the mock
 * is allowed), `on`.
 */
export type EngineState = 'on' | 'off' | 'mock' | 'noConnection' | 'connectionOff';

/** The colour each state takes on the dashboard card and the health row (one map, two readers). */
export const ENGINE_STATE_TONE: Record<EngineState, 'success' | 'warning' | 'error' | 'muted'> = {
  on: 'success',
  mock: 'warning',
  connectionOff: 'warning',
  noConnection: 'error',
  off: 'muted',
};

export interface EngineConnectionSummary {
  id: number;
  label: string;
  enabled: boolean;
  spentUsd: number;
  limitUsd: number | null;
}

export interface EngineStateReport {
  state: EngineState;
  connection: EngineConnectionSummary | null;
  publishHourRiyadh: number;
  postsPerDay: number;
  /** The caps the dashboard shows the month's posts and today's cost against. */
  maxPostsPerMonth: number;
  dailyCostCapUsd: number;
}

export async function engineState(payload: Payload, now = new Date()): Promise<EngineStateReport> {
  const settings = await payload.findGlobal({
    slug: 'ai-settings',
    depth: 0,
    overrideAccess: true,
  });
  const base = {
    publishHourRiyadh: settings.publishHourRiyadh ?? 9,
    postsPerDay: settings.postsPerDay ?? 1,
    maxPostsPerMonth: settings.maxPostsPerMonth ?? 31,
    dailyCostCapUsd: settings.dailyCostCapUsd ?? 5,
  };
  const id = connectionIdOf(settings);
  const doc = id === null ? null : await findConnection(payload, id);
  const connection: EngineConnectionSummary | null = doc
    ? {
        id: doc.id,
        label: doc.label,
        enabled: doc.enabled !== false,
        spentUsd: (await connectionSpend(payload, doc.id, now)).spentUsd,
        limitUsd: doc.monthlyLimitUsd ?? null,
      }
    : null;
  let state: EngineState = 'on';
  if (!settings.enabled || !envAllows()) state = 'off';
  else if (!doc) state = 'noConnection';
  else if (doc.enabled === false) state = 'connectionOff';
  else if (doc.kind === 'mock' && mockAllowed()) state = 'mock';
  return { state, connection, ...base };
}
