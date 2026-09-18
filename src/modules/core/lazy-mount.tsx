'use client';

import { Suspense, useEffect, useRef, useState, type ReactNode } from 'react';

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

/**
 * Mounts `children` (typically a `lazy()` island) only when the host element approaches the
 * viewport, keeping the first-paint JS within the BRD 7.8 budget. Until then the `fallback`
 * (server-rendered) is what visitors and crawlers see, and it stays on screen while the
 * island's chunk downloads: the children sit in a Suspense boundary with the same fallback,
 * so the swap never empties the box (a `next/dynamic` island with no `loading` renders
 * nothing in that window, which is a layout shift when the box has height). The children
 * never render on the server, `eager` included: `React.lazy` would otherwise run the island's
 * module in Node.
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

  useEffect(() => {
    if (eager) {
      // oxlint-disable-next-line react/set-state-in-effect -- the eager flag is only known after hydration (hash)
      setNear(true);
      return;
    }
    const el = host.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) {
      setNear(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [eager, rootMargin]);

  return (
    <div ref={host} className={className}>
      {near ? <Suspense fallback={fallback}>{children}</Suspense> : fallback}
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
