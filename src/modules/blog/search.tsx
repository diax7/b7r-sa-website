'use client';

import Link from 'next/link';
import { useEffect, useId, useState, useSyncExternalStore } from 'react';
import { fold } from '@/lib/arabic-fold';
import type { PostIndexEntry } from '@/lib/cms/blog';

interface SearchProps {
  index: PostIndexEntry[];
  /** The blog's path under the locale's prefix (`/en/blog`). */
  basePath: string;
  copy: { label: string; placeholder: string; results: string; empty: string; clear: string };
  /** The grid to hide while results show. */
  grid: string;
}

const MIN_QUERY = 2;
const MAX_RESULTS = 12;

/** Folded match on the title first, then the excerpt and the hub name. */
export function searchIndex(query: string, index: PostIndexEntry[]): PostIndexEntry[] {
  const q = fold(query);
  if (q.length < MIN_QUERY) return [];
  const score = (entry: PostIndexEntry) => {
    if (fold(entry.title).includes(q)) return 2;
    if (fold(entry.excerpt).includes(q) || fold(entry.hub).includes(q)) return 1;
    return 0;
  };
  return index
    .map((entry, i) => ({ entry, i, score: score(entry) }))
    .filter((r) => r.score > 0)
    .toSorted((a, b) => b.score - a.score || a.i - b.i)
    .slice(0, MAX_RESULTS)
    .map((r) => r.entry);
}

/**
 * The blog search (ADR-041): a client island over the index the page embeds, so `/blog`
 * stays static and no request reaches the server. `?q=` is read on mount only, so a search
 * can be linked; typing updates the URL without a navigation.
 */
const noop = () => () => {};
const readInitialQuery = () => new URLSearchParams(window.location.search).get('q') ?? '';
const serverQuery = () => '';

export function BlogSearch({ index, basePath, copy, grid }: SearchProps) {
  const id = useId();
  // The URL's `q` on the client, nothing on the server, so hydration never mismatches and a
  // linked search opens with its results; typing takes over from there.
  const initial = useSyncExternalStore(noop, readInitialQuery, serverQuery);
  const [typed, setTyped] = useState<string | null>(null);
  const query = typed ?? initial;
  const setQuery = setTyped;
  const results = searchIndex(query, index);
  const active = fold(query).length >= MIN_QUERY;

  useEffect(() => {
    // Only what the user typed rewrites the URL: on a deep link the initial `q` must survive
    // until the store has read it.
    if (typed !== null) {
      const url = new URL(window.location.href);
      if (typed) url.searchParams.set('q', typed);
      else url.searchParams.delete('q');
      window.history.replaceState(null, '', url);
    }
    const container = document.querySelector<HTMLElement>(grid);
    if (container) container.hidden = active;
  }, [typed, active, grid]);

  return (
    <div className="flex flex-col gap-4" data-blog-search="">
      <form
        role="search"
        onSubmit={(e) => e.preventDefault()}
        className="flex items-center gap-2 rounded-pill border border-border bg-surface px-4 focus-within:border-primary"
      >
        <label htmlFor={id} className="sr-only">
          {copy.label}
        </label>
        <input
          id={id}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={copy.placeholder}
          autoComplete="off"
          className="h-12 w-full bg-transparent text-body text-text outline-hidden placeholder:text-text-muted"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="text-small text-text-muted hover:text-primary"
          >
            {copy.clear}
          </button>
        )}
      </form>
      {active && (
        <section aria-live="polite" aria-label={copy.results} data-blog-results="">
          {results.length === 0 ? (
            <p className="text-body text-text-muted">{copy.empty}</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border rounded-base border border-border bg-surface">
              {results.map((entry) => (
                <li key={entry.slug}>
                  <Link
                    href={`${basePath}/${entry.slug}`}
                    className="flex flex-col gap-1 px-5 py-4 hover:bg-ground"
                  >
                    <span className="text-h4 text-text">{entry.title}</span>
                    <span className="text-small text-text-muted">{entry.excerpt}</span>
                    <span className="text-caption text-primary">{entry.hub}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
