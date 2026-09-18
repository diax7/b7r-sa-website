import 'server-only';
import type { Payload, TypedUser } from 'payload';
import { pickScore, type Score, scoreOf } from '@/modules/visibility/score';
import { buildSnapshot } from '@/modules/visibility/snapshot';
import type { Language } from '@/modules/visibility/types';

/** The score in one language, as a page renders it. */
export interface Reading {
  score: Score<string>;
  at: string;
}

/** The last reading per process, good for a minute: the snapshot reads every document. */
export const READING_TTL_MS = 60_000;

const KEY = '__b7rVisibilityReading';

interface Cached {
  score: Score;
  at: string;
  by: string;
}

function cache(): { last: Cached | null } {
  const g = globalThis as typeof globalThis & { [KEY]?: { last: Cached | null } };
  g[KEY] ??= { last: null };
  return g[KEY];
}

/** The panel's UI language as the rules know it: Arabic, else English (ADR-056). */
export function ruleLanguage(language: string): Language {
  return language === 'ar' ? 'ar' : 'en';
}

/**
 * The score as the page and the card show it (ADR-049): a fresh snapshot judged by the rules,
 * cached for a minute per process and per user (the reads run under the user's access), or
 * recomputed on demand; its sentences picked in the panel's language. `language` is
 * required so a call site cannot forget it and render English inside the Arabic panel. Never
 * stored: the score is a function of the content; the nightly snapshot keeps the history.
 */
export async function reading(
  payload: Payload,
  options: { user?: TypedUser | null; fresh?: boolean; language: string },
): Promise<Reading> {
  const c = cache();
  const by = options.user ? String(options.user.id) : 'server';
  const language = ruleLanguage(options.language);
  const recent =
    c.last && c.last.by === by && Date.now() - new Date(c.last.at).getTime() < READING_TTL_MS;
  if (!options.fresh && recent && c.last) {
    return { score: pickScore(c.last.score, language), at: c.last.at };
  }
  const snapshot = await buildSnapshot(payload, { user: options.user ?? null });
  const last: Cached = { score: scoreOf(snapshot), at: snapshot.at, by };
  c.last = last;
  return { score: pickScore(last.score, language), at: last.at };
}
