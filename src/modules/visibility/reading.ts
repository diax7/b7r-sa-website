import 'server-only';
import type { Payload, TypedUser } from 'payload';
import { type Score, scoreOf } from '@/modules/visibility/score';
import { buildSnapshot } from '@/modules/visibility/snapshot';

export interface Reading {
  score: Score;
  at: string;
}

/** The last reading per process, good for a minute: the snapshot reads every document. */
export const READING_TTL_MS = 60_000;

const KEY = '__b7rVisibilityReading';

function cache(): { reading: Reading | null; by: string | null } {
  const g = globalThis as typeof globalThis & {
    [KEY]?: { reading: Reading | null; by: string | null };
  };
  g[KEY] ??= { reading: null, by: null };
  return g[KEY];
}

/**
 * The score as the page and the card show it (ADR-049): a fresh snapshot judged by the rules,
 * cached for a minute per process and per user (the reads run under the user's access), or
 * recomputed on demand. Never stored: the score is a function of the content; the nightly
 * snapshot keeps the history.
 */
export async function reading(
  payload: Payload,
  options: { user?: TypedUser | null; fresh?: boolean } = {},
): Promise<Reading> {
  const c = cache();
  const by = options.user ? String(options.user.id) : 'server';
  const fresh =
    c.reading && c.by === by && Date.now() - new Date(c.reading.at).getTime() < READING_TTL_MS;
  if (!options.fresh && fresh && c.reading) return c.reading;
  const snapshot = await buildSnapshot(payload, { user: options.user ?? null });
  const next: Reading = { score: scoreOf(snapshot), at: snapshot.at };
  c.reading = next;
  c.by = by;
  return next;
}
