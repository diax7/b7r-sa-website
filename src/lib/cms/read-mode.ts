import 'server-only';
import { draftMode } from 'next/headers';
import { PUBLISHED } from '@/lib/cms/read';

/**
 * Whether this render reads drafts (ADR-039): true only inside a request that carries Next's
 * draft cookie. During a prerender `draftMode()` is an empty provider (`isEnabled: false`,
 * no dynamic tracking), so every page stays static; outside a request scope (scripts) it
 * throws and we read published content.
 */
export async function readsDrafts(): Promise<boolean> {
  try {
    return (await draftMode()).isEnabled;
  } catch {
    return false;
  }
}

/** The Local API options for a versioned read: drafts unfiltered, or published rows only. */
export async function versionedRead(): Promise<
  { draft: true } | { draft: false; where: typeof PUBLISHED }
> {
  return (await readsDrafts()) ? { draft: true } : { draft: false, where: PUBLISHED };
}
