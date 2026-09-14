import 'server-only';
import { draftMode } from 'next/headers';
import type { Where } from 'payload';
import { inLocale, PUBLISHED } from '@/lib/cms/read';

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

/**
 * The Local API options for a versioned read: drafts, or published rows only; in both cases
 * only the documents that exist in the request locale (`field` is the title-like field).
 */
export async function versionedRead(field = 'title'): Promise<{ draft: boolean; where: Where }> {
  const presence = inLocale(field);
  return (await readsDrafts())
    ? { draft: true, where: presence }
    : { draft: false, where: { and: [PUBLISHED, presence] } };
}
