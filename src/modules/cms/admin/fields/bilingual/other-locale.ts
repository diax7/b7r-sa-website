'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * The other language of the open document, read once per document view and shared by every
 * bilingual field on it (ADR-057): a small store outside React keyed by the document and
 * its `lastUpdateTime`, so a save (an autosave included) reads it again and the fields
 * reconcile their pending entries against what is stored now. Read through the REST API
 * with the editor's own cookie, in the other locale, without the fallback (an empty
 * English must read as empty, not as the Arabic) and with drafts, read-only.
 */
export type OtherLocaleState =
  | { status: 'loading'; doc: null }
  | { status: 'ready'; doc: Record<string, unknown> }
  | { status: 'error'; doc: null };

interface Entry {
  state: OtherLocaleState;
  started: boolean;
  listeners: Set<() => void>;
}

const LOADING: OtherLocaleState = { status: 'loading', doc: null };
const EMPTY: OtherLocaleState = { status: 'ready', doc: {} };
const entries = new Map<string, Entry>();

export interface OtherLocaleSource {
  apiRoute: string;
  /** The collection and id, or the global slug; a document with neither is being created. */
  collection?: string | undefined;
  global?: string | undefined;
  id?: number | string | undefined;
  locale: string;
  /** The document's last save, from `useDocumentInfo`; a new value reads it again. */
  lastUpdateTime: number;
}

/** The REST URL of the document in the other locale, or null for a document not created yet. */
export function otherLocaleUrl(source: OtherLocaleSource): string | null {
  const params = new URLSearchParams({
    locale: source.locale,
    'fallback-locale': 'none',
    draft: 'true',
    depth: '0',
  });
  if (source.global) return `${source.apiRoute}/globals/${source.global}?${params}`;
  if (source.collection && source.id !== undefined && source.id !== '') {
    return `${source.apiRoute}/${source.collection}/${String(source.id)}?${params}`;
  }
  return null;
}

function keyOf(url: string, lastUpdateTime: number): string {
  return `${url}@${lastUpdateTime}`;
}

function entryFor(url: string, lastUpdateTime: number): Entry {
  const key = keyOf(url, lastUpdateTime);
  let entry = entries.get(key);
  if (!entry) {
    // One live entry per document: after a save the earlier read stands in (no empty,
    // disabled input while the fresh one is on its way) and is dropped once it lands.
    let previous: OtherLocaleState = LOADING;
    for (const [stale, old] of entries) {
      if (!stale.startsWith(`${url}@`)) continue;
      if (old.state.status === 'ready') previous = old.state;
      entries.delete(stale);
    }
    entry = { state: previous, started: false, listeners: new Set() };
    entries.set(key, entry);
  }
  return entry;
}

async function read(entry: Entry, url: string): Promise<void> {
  let state: OtherLocaleState;
  try {
    const res = await fetch(url, { credentials: 'include' });
    state = res.ok
      ? { status: 'ready', doc: (await res.json()) as Record<string, unknown> }
      : { status: 'error', doc: null };
  } catch {
    state = { status: 'error', doc: null };
  }
  entry.state = state;
  for (const listener of entry.listeners) listener();
}

export function useOtherLocale(source: OtherLocaleSource): OtherLocaleState {
  const url = otherLocaleUrl(source);
  const { lastUpdateTime } = source;
  const subscribe = useCallback(
    (listener: () => void) => {
      if (!url) return () => undefined;
      const entry = entryFor(url, lastUpdateTime);
      entry.listeners.add(listener);
      if (!entry.started) {
        entry.started = true;
        void read(entry, url);
      }
      return () => entry.listeners.delete(listener);
    },
    [url, lastUpdateTime],
  );
  const snapshot = useCallback(
    () => (url ? entryFor(url, lastUpdateTime).state : EMPTY),
    [url, lastUpdateTime],
  );
  return useSyncExternalStore(subscribe, snapshot, () => LOADING);
}
