'use client';

import { CornerDownLeft, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Icon } from '@/components/shared/icon';
import { VisuallyHidden } from '@/components/shared/visually-hidden';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Kbd } from '@/components/ui/kbd';
import { cn } from '@/lib/cn';
import { entityIcon, groupIcon } from '@/modules/cms/admin/icons';
import { PALETTE_EVENT } from '@/modules/cms/admin/header/palette-event';
import { MIN_QUERY, rank, searchTerm } from '@/modules/cms/admin/header/palette-rank';
import type { NavEntity } from '@/modules/cms/admin/nav/groups';
import { useAdminStrings } from '@/modules/cms/admin/use-admin-strings';

export interface PaletteEntity extends Pick<NavEntity, 'type' | 'slug' | 'label' | 'href'> {
  group: string;
}

/** A collection the palette searches: its searchable fields and the field shown as the title. */
export interface SearchableCollection {
  slug: string;
  label: string;
  fields: string[];
  titleField: string;
  href: string;
}

export interface PaletteProps {
  entities: PaletteEntity[];
  searchable: SearchableCollection[];
  apiRoute: string;
}

interface DocHit {
  key: string;
  title: string;
  /** What tells two same-titled documents apart: the slug, else the draft/published state. */
  detail: string;
  collection: string;
  slug: string;
  href: string;
}

const RECENT_KEY = 'b7r-admin-recent';
const RECENT_MAX = 5;
const DEBOUNCE_MS = 200;
const PER_COLLECTION = 5;

function readRecent(): string[] {
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    const list: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function pushRecent(href: string) {
  try {
    const next = [href, ...readRecent().filter((h) => h !== href)].slice(0, RECENT_MAX);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // Private windows throw; the list is a convenience.
  }
}

function inEditor(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && !!target.closest('[contenteditable="true"]');
}

/**
 * Ctrl/⌘ K palette (ADR-039): every section the user may open, then documents of the main
 * collections by title through Payload's REST API (its access rules are the boundary).
 * Combobox semantics: the input owns focus, arrows move `aria-activedescendant`, Enter opens.
 */
export function Palette({ entities, searchable, apiRoute }: PaletteProps) {
  const s = useAdminStrings().palette;
  const statusLabel = s.status;
  const router = useRouter();
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [hits, setHits] = useState<DocHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const abort = useRef<AbortController | null>(null);

  const openPalette = useCallback(() => {
    setQuery('');
    setActive(0);
    setHits([]);
    setRecent(readRecent());
    setOpen(true);
  }, []);

  useEffect(() => {
    const onEvent = () => openPalette();
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k' && !inEditor(e.target)) {
        e.preventDefault();
        openPalette();
      }
    };
    window.addEventListener(PALETTE_EVENT, onEvent);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener(PALETTE_EVENT, onEvent);
      window.removeEventListener('keydown', onKey);
    };
  }, [openPalette]);

  // Document search: from two characters, debounced, stale responses dropped. The states
  // are set from the input's change event and from the (asynchronous) response only.
  useEffect(() => {
    abort.current?.abort();
    const q = searchTerm(query);
    if (!open || q.length < MIN_QUERY || searchable.length === 0) return;
    const controller = new AbortController();
    abort.current = controller;
    const timer = window.setTimeout(async () => {
      const results = await Promise.all(
        searchable.map(async (c) => {
          const params = new URLSearchParams({ limit: String(PER_COLLECTION), depth: '0' });
          c.fields.forEach((f, i) => params.set(`where[or][${i}][${f}][like]`, q));
          try {
            const res = await fetch(`${apiRoute}/${c.slug}?${params}`, {
              credentials: 'include',
              signal: controller.signal,
            });
            if (!res.ok) return [];
            const body = (await res.json()) as { docs?: Array<Record<string, unknown>> };
            return (body.docs ?? []).map((doc) => {
              const slug = typeof doc['slug'] === 'string' ? doc['slug'] : '';
              const status = typeof doc['_status'] === 'string' ? doc['_status'] : '';
              return {
                key: `${c.slug}-${String(doc['id'])}`,
                title: String(doc[c.titleField] ?? doc['id']),
                detail: slug && slug !== doc[c.titleField] ? slug : (statusLabel[status] ?? ''),
                collection: c.label,
                slug: c.slug,
                href: `${c.href}/${String(doc['id'])}`,
              };
            });
          } catch {
            return [];
          }
        }),
      );
      if (controller.signal.aborted) return;
      setHits(results.flat());
      setSearching(false);
      setActive(0);
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [open, query, searchable, apiRoute, statusLabel]);

  const sections = useMemo(() => {
    const q = query.trim();
    const ranked = q
      ? rank(
          q,
          entities.map((e) => ({ ...e, keywords: `${e.group} ${e.slug}` })),
        )
      : entities.toSorted((a, b) => {
          const ra = recent.indexOf(a.href);
          const rb = recent.indexOf(b.href);
          return (ra === -1 ? RECENT_MAX : ra) - (rb === -1 ? RECENT_MAX : rb);
        });
    return { entities: ranked, hits };
  }, [entities, hits, query, recent]);

  const flat = useMemo(
    () => [
      ...sections.entities.map((e) => ({ id: `e-${e.type}-${e.slug}`, href: e.href })),
      ...sections.hits.map((h) => ({ id: `d-${h.key}`, href: h.href })),
    ],
    [sections],
  );
  const activeItem = flat[Math.min(active, Math.max(flat.length - 1, 0))];

  function go(href: string) {
    pushRecent(href);
    setOpen(false);
    router.push(href);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, flat.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeItem) {
      e.preventDefault();
      go(activeItem.href);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="top-[12vh] w-[min(100vw-32px,40rem)] max-w-none translate-y-0 p-0"
        aria-describedby={undefined}
        data-admin-ui=""
        data-admin-palette=""
      >
        <VisuallyHidden>
          <DialogTitle>{s.title}</DialogTitle>
        </VisuallyHidden>
        <div className="flex items-center gap-2.5 border-b border-border px-4">
          <Icon icon={Search} size={18} className="shrink-0 text-text-muted" />
          <input
            // oxlint-disable-next-line jsx-a11y/no-autofocus -- a palette exists to be typed into
            autoFocus
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={activeItem ? `${listId}-${activeItem.id}` : undefined}
            aria-autocomplete="list"
            aria-label={s.title}
            placeholder={s.placeholder}
            value={query}
            onChange={(e) => {
              const value = e.target.value;
              setQuery(value);
              setActive(0);
              const searches = searchTerm(value).length >= MIN_QUERY && searchable.length > 0;
              setSearching(searches);
              if (!searches) setHits([]);
            }}
            onKeyDown={onKeyDown}
            className="h-13 w-full bg-transparent text-body text-text placeholder:text-text-muted focus:outline-hidden"
          />
          <Kbd className="hidden sm:inline-flex">Esc</Kbd>
        </div>
        <div
          id={listId}
          role="listbox"
          aria-label={s.title}
          className="max-h-[50vh] overflow-y-auto p-2"
        >
          {sections.entities.length > 0 && (
            <Section title={s.sections}>
              {sections.entities.map((e) => {
                const EntityIcon = entityIcon(e.type, e.slug);
                const id = `${listId}-e-${e.type}-${e.slug}`;
                const isActive = activeItem?.id === `e-${e.type}-${e.slug}`;
                return (
                  <Row
                    key={id}
                    id={id}
                    active={isActive}
                    onSelect={() => go(e.href)}
                    onHover={() =>
                      setActive(flat.findIndex((f) => f.id === `e-${e.type}-${e.slug}`))
                    }
                  >
                    {EntityIcon && <Icon icon={EntityIcon} size={18} className="text-accent" />}
                    <span className="flex-1 truncate">{e.label}</span>
                    <span className="flex items-center gap-1 text-caption text-text-muted">
                      {(() => {
                        const GroupIcon = groupIcon(e.group);
                        return GroupIcon ? <Icon icon={GroupIcon} size={14} /> : null;
                      })()}
                      {e.group}
                    </span>
                  </Row>
                );
              })}
            </Section>
          )}
          {(sections.hits.length > 0 || searching) && (
            <Section title={searching && sections.hits.length === 0 ? s.searching : s.results}>
              {sections.hits.map((h) => {
                const EntityIcon = entityIcon('collections', h.slug);
                const id = `${listId}-d-${h.key}`;
                return (
                  <Row
                    key={id}
                    id={id}
                    active={activeItem?.id === `d-${h.key}`}
                    onSelect={() => go(h.href)}
                    onHover={() => setActive(flat.findIndex((f) => f.id === `d-${h.key}`))}
                  >
                    {EntityIcon && <Icon icon={EntityIcon} size={18} className="text-text-muted" />}
                    <span className="flex-1 truncate">{h.title}</span>
                    {h.detail && (
                      <span className="truncate text-caption text-text-muted" dir="auto">
                        {h.detail}
                      </span>
                    )}
                    <span className="shrink-0 text-caption text-text-muted">{h.collection}</span>
                  </Row>
                );
              })}
            </Section>
          )}
          {flat.length === 0 && !searching && (
            <p className="px-3 py-6 text-center text-small text-text-muted">{s.empty}</p>
          )}
        </div>
        <DialogDescription className="flex items-center justify-between gap-3 border-t border-border px-4 py-2 text-caption text-text-muted">
          <span>{searchTerm(query).length < MIN_QUERY ? s.hint : s.shortcut}</span>
          <span className="flex items-center gap-1">
            {/* The Enter key's own glyph: the same on an Arabic keyboard, so never mirrored. */}
            <Icon icon={CornerDownLeft} size={12} mirror={false} />
            {s.open}
          </span>
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div role="group" aria-label={title} className="mb-1">
      <p className="px-3 pt-2 pb-1 text-caption text-text-muted">{title}</p>
      {children}
    </div>
  );
}

function Row({
  id,
  active,
  onSelect,
  onHover,
  children,
}: {
  id: string;
  active: boolean;
  onSelect: () => void;
  onHover: () => void;
  children: React.ReactNode;
}) {
  return (
    // oxlint-disable-next-line jsx-a11y/click-events-have-key-events -- combobox pattern: the input owns the keyboard (arrows, Enter) via aria-activedescendant
    <div
      id={id}
      role="option"
      aria-selected={active}
      tabIndex={-1}
      onClick={onSelect}
      onMouseMove={onHover}
      className={cn(
        'flex h-10 cursor-pointer items-center gap-2.5 rounded-inner px-3 text-small text-text',
        active && 'bg-accent-tint',
      )}
    >
      {children}
    </div>
  );
}
