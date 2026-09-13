'use client';

import { useEffect, useSyncExternalStore, type MouseEvent } from 'react';
import { cn } from '@/lib/cn';

interface HubFilterProps {
  hubs: Array<{ slug: string; name: string }>;
  /** Label of the «all» chip. */
  allLabel: string;
  /** Selector of the grid whose cards carry `data-hub`; its `[data-hub-empty]` sibling shows when nothing matches. */
  grid: string;
}

/**
 * Hub chips (BRD 6.11): links with `?hub=`, so the filter works without JS and the full
 * list stays server-rendered for crawlers; with JS the island reads `location.search`,
 * hides the cards of other hubs, and updates the URL without a navigation.
 */
const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  window.addEventListener('popstate', fn);
  return () => {
    listeners.delete(fn);
    window.removeEventListener('popstate', fn);
  };
};
const readHub = () => new URLSearchParams(window.location.search).get('hub') ?? '';
const serverHub = () => '';

export function HubFilter({ hubs, allLabel, grid }: HubFilterProps) {
  // The URL is the source of truth; the server snapshot is «all» so hydration never mismatches.
  const active = useSyncExternalStore(subscribe, readHub, serverHub);

  useEffect(() => {
    const container = document.querySelector<HTMLElement>(grid);
    if (!container) return;
    let visible = 0;
    for (const item of container.querySelectorAll<HTMLElement>('[data-hub]')) {
      const show = !active || item.dataset['hub'] === active;
      const cell = item.closest<HTMLElement>('li') ?? item;
      cell.hidden = !show;
      if (show) visible++;
    }
    const empty = document.querySelector<HTMLElement>('[data-hub-empty]');
    if (empty) empty.hidden = visible > 0;
  }, [active, grid]);

  const choose = (slug: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const url = new URL(window.location.href);
    if (slug) url.searchParams.set('hub', slug);
    else url.searchParams.delete('hub');
    window.history.replaceState(null, '', url);
    for (const fn of listeners) fn();
  };

  const chip = (slug: string, name: string) => (
    <li key={slug || 'all'}>
      <a
        href={slug ? `?hub=${slug}` : '/blog'}
        onClick={choose(slug)}
        aria-current={active === slug ? 'true' : undefined}
        className={cn(
          'inline-flex h-10 items-center rounded-pill border px-4 text-small font-medium transition-colors duration-(--duration-fast)',
          active === slug
            ? 'border-primary bg-primary text-white'
            : 'border-border bg-surface text-text hover:border-primary hover:text-primary',
        )}
      >
        {name}
      </a>
    </li>
  );

  return (
    <ul className="flex flex-wrap gap-2" data-hub-filter="">
      {chip('', allLabel)}
      {hubs.map((h) => chip(h.slug, h.name))}
    </ul>
  );
}
