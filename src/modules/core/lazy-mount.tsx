'use client';

import {
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
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
  /** Runs once the island has committed (after the stand-in left, before the paint). */
  onMounted?: () => void;
  className?: string;
}

/** The controls a stand-in and its island expose, in the same order (the honeypot excluded). */
const focusables = (el: HTMLElement) =>
  Array.from(el.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea')).filter(
    (c) => c.tabIndex >= 0 && !c.hasAttribute('disabled'),
  );

/** Tells the host the island's tree has committed: a layout effect, so the host can drop the
 *  stand-in in the same frame, before the browser paints. */
function Committed({ onCommit, children }: { onCommit: () => void; children: ReactNode }) {
  useLayoutEffect(onCommit, [onCommit]);
  return children;
}

/**
 * Mounts `children` (a `lazy()` island) only when the host element approaches the viewport,
 * or the moment a person reaches for the stand-in (a Tab onto one of its controls, a finger
 * or a pointer on it), keeping the first-paint JS within the BRD 7.8 budget. Until then the
 * `fallback` (server-rendered) is what visitors and crawlers see; its controls are
 * `aria-disabled`, not `disabled`, so they can take focus and the reach is noticed. The host
 * renders the stand-in itself, outside the island's Suspense boundary (whose own fallback is
 * empty), and drops it in the island's layout effect: so there is exactly one stand-in in the
 * DOM at any moment and the box never empties or doubles while the chunk downloads (a
 * Suspense boundary that shows the same node as its fallback duplicated the stand-in on a
 * dehydrated boundary, PR #38's CI). A control focused in the stand-in hands its focus to the
 * island's control at the same index after the swap, so a keyboard user is never dropped to
 * the body. The children never render on the server, `eager` included: `React.lazy` would
 * otherwise run the island's module in Node.
 */
export function NearViewport({
  children,
  fallback = null,
  rootMargin = '400px 0px',
  eager = false,
  onMounted,
  className,
}: NearViewportProps) {
  const host = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [mounted, setMounted] = useState(false);
  const focusedIndex = useRef<number | null>(null);
  const mount = useCallback(() => setNear(true), []);
  const onCommit = useCallback(() => setMounted(true), []);
  const mountedCallback = useRef(onMounted);
  useEffect(() => {
    mountedCallback.current = onMounted;
  }, [onMounted]);

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
    if (!el || mounted) return;
    const onFocusIn = () => {
      focusedIndex.current = focusables(el).indexOf(document.activeElement as HTMLElement);
      mount();
    };
    // A focus that leaves for another element is not to be brought back (a Tab through the
    // stand-in into the next island's rows). The swap's removal of the focused control fires
    // a focusout with no related target, so only a move to a named element outside clears.
    const onFocusOut = (e: FocusEvent) => {
      if (e.relatedTarget instanceof Node && !el.contains(e.relatedTarget)) {
        focusedIndex.current = null;
      }
    };
    el.addEventListener('focusin', onFocusIn);
    el.addEventListener('focusout', onFocusOut);
    el.addEventListener('pointerdown', mount, { passive: true });
    // A Tab that landed in the stand-in before hydration (the listeners arrive with it).
    if (el.contains(document.activeElement)) onFocusIn();
    return () => {
      el.removeEventListener('focusin', onFocusIn);
      el.removeEventListener('focusout', onFocusOut);
      el.removeEventListener('pointerdown', mount);
    };
  }, [mounted, mount]);

  useLayoutEffect(() => {
    const el = host.current;
    if (!el || !mounted) return;
    mountedCallback.current?.();
    const index = focusedIndex.current;
    if (index === null || index < 0) return;
    // The focused stand-in control left the DOM at the swap. The browser drops the focus to
    // the body, in the same task or at its next frame (the focus fixup), so the hand-over
    // runs now, in the layout effect, and again on the next frame: a focus that moved to
    // another element on purpose is left alone, and the index is kept until the island's
    // control holds the focus.
    const settle = () => {
      const target = focusables(el)[index];
      const active = document.activeElement;
      if (!target || active === target) {
        focusedIndex.current = null;
        return;
      }
      if (!active || active === document.body || !active.isConnected) target.focus();
    };
    settle();
    const frame = requestAnimationFrame(settle);
    const later = window.setTimeout(settle, 100);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(later);
    };
  }, [mounted]);

  return (
    <div ref={host} className={className}>
      {!mounted && fallback}
      {near && (
        <Suspense fallback={null}>
          <Committed onCommit={onCommit}>{children}</Committed>
        </Suspense>
      )}
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
