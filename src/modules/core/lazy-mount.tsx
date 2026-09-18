'use client';

import {
  startTransition,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

interface NearViewportProps {
  children: ReactNode;
  /** Server-rendered stand-in shown until the island mounts. */
  fallback?: ReactNode;
  /** Distance before the viewport at which to mount (IntersectionObserver rootMargin). */
  rootMargin?: string;
  /** Mount immediately regardless of position (e.g. a deep link targets the island). */
  eager?: boolean;
  className?: string;
}

/** The controls a stand-in and its island expose, in the same order (the honeypot excluded). */
const focusables = (el: HTMLElement) =>
  Array.from(el.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea')).filter(
    (c) => c.tabIndex >= 0 && !c.hasAttribute('disabled'),
  );

/**
 * Mounts `children` (a `lazy()` island) only when the host element approaches the viewport,
 * or the moment a person reaches for the stand-in (a Tab onto one of its controls, a finger
 * or a pointer on it), keeping the first-paint JS within the BRD 7.8 budget. Until then the
 * `fallback` (server-rendered) is what visitors and crawlers see; its controls are
 * `aria-disabled`, not `disabled`, so they can take focus and the reach is noticed. The mount
 * is a transition: React keeps the stand-in on screen while the chunk downloads and swaps it
 * once, so the box never empties (a `next/dynamic` island with no `loading` renders nothing
 * in that window, a layout shift when the box has height); the Suspense fallback is the same
 * stand-in, a net for the cases a transition does not cover. A control focused in the
 * stand-in hands its focus to the island's control at the same index after the swap, so a
 * keyboard user is never dropped to the body. The children never render on the server,
 * `eager` included: `React.lazy` would otherwise run the island's module in Node.
 */
export function NearViewport({
  children,
  fallback = null,
  rootMargin = '400px 0px',
  eager = false,
  className,
}: NearViewportProps) {
  const host = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const focusedIndex = useRef<number | null>(null);
  const mount = useCallback(() => startTransition(() => setNear(true)), []);

  useEffect(() => {
    if (eager) {
      // oxlint-disable-next-line react/set-state-in-effect -- the eager flag is only known after hydration (hash)
      mount();
      return;
    }
    const el = host.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) {
      mount();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          mount();
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [eager, rootMargin, mount]);

  useEffect(() => {
    const el = host.current;
    if (!el || near) return;
    const onFocusIn = () => {
      focusedIndex.current = focusables(el).indexOf(document.activeElement as HTMLElement);
      mount();
    };
    el.addEventListener('focusin', onFocusIn);
    el.addEventListener('pointerdown', mount, { passive: true });
    return () => {
      el.removeEventListener('focusin', onFocusIn);
      el.removeEventListener('pointerdown', mount);
    };
  }, [near, mount]);

  useEffect(() => {
    const el = host.current;
    if (!el || !near) return;
    // The focused stand-in control leaves the DOM at the swap and the browser drops focus to
    // the body; a focus that moved elsewhere on purpose is left alone. The transition commits
    // the swap together with `near`, so this effect runs right after it; the observer is the
    // net for the Suspense-fallback path, where the island arrives in a later commit.
    const restore = () => {
      const index = focusedIndex.current;
      if (index === null || index < 0) return;
      const active = document.activeElement;
      if (active && active !== document.body) return;
      const target = focusables(el)[index];
      if (!target || target.getAttribute('aria-disabled') === 'true') return;
      target.focus();
      focusedIndex.current = null;
    };
    restore();
    const observer = new MutationObserver(restore);
    observer.observe(el, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [near]);

  return (
    <div ref={host} className={className}>
      <Suspense fallback={fallback}>{near ? children : fallback}</Suspense>
    </div>
  );
}

interface AfterDelayProps {
  children: ReactNode;
  /** Milliseconds after mount before `children` render. */
  ms: number;
}

/** Renders `children` after a delay (widgets that must never compete with the first paint). */
export function AfterDelay({ children, ms }: AfterDelayProps) {
  const [due, setDue] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setDue(true), ms);
    return () => window.clearTimeout(id);
  }, [ms]);
  return due ? children : null;
}
