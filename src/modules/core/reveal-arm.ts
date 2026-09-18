/**
 * Scroll reveal for the whole site (BRD 3.7 as amended, ADR-055). Every element with
 * `data-reveal` (every `Section` by default, see `components/shared/section.tsx`) and every
 * child of a `data-reveal-stagger` group is armed: an element already in view is marked
 * visible at once and never hidden (the first paint, the LCP and the fold are never touched);
 * an element below the fold is hidden and fades up 12 px once it enters. Elements added
 * later (client navigation, lazy islands) are picked up by a MutationObserver. Nothing runs
 * under reduced motion or without IntersectionObserver, and the CSS hides nothing on its
 * own, so content is always there without JavaScript.
 *
 * Runs from `RevealObserver` after hydration, so React has finished with the DOM before a
 * class is added: no hydration diff, and the dropped case (a fast scroll in the first second)
 * shows plain content.
 */
const SELECTOR = '[data-reveal], [data-reveal-stagger]';

/** How far down the viewport an element may start and still count as "in view" at arm time. */
const IN_VIEW_RATIO = 0.92;

function elements(root: ParentNode, selector: string): Element[] {
  const found = Array.from(root.querySelectorAll(selector));
  return root instanceof Element && root.matches(selector) ? [root, ...found] : found;
}

function armStaggers(root: ParentNode) {
  for (const group of elements(root, '[data-reveal-stagger]')) {
    Array.from(group.children).forEach((child, index) => {
      (child as HTMLElement).style.setProperty('--i', String(index));
      if (!child.hasAttribute('data-reveal')) child.setAttribute('data-reveal', '');
    });
  }
}

/** Arms the document; returns the teardown. Undefined when nothing runs (reduced motion, no observer). */
export function armReveal(root: Document = document): (() => void) | undefined {
  const view = root.defaultView;
  if (!view || typeof view.IntersectionObserver !== 'function') return undefined;
  if (view.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
  const io = new view.IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        entry.target.classList.remove('is-hidden');
        io.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0 },
  );
  const arm = (node: ParentNode) => {
    armStaggers(node);
    for (const el of elements(node, '[data-reveal]:not([data-armed])')) {
      el.setAttribute('data-armed', '');
      const rect = el.getBoundingClientRect();
      if (rect.top < view.innerHeight * IN_VIEW_RATIO && rect.bottom > 0) {
        el.classList.add('is-visible');
        continue;
      }
      el.classList.add('is-hidden');
      io.observe(el);
    }
  };
  arm(root);
  const mo = new view.MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof view.Element)) continue;
        if (node.matches(SELECTOR) || node.querySelector(SELECTOR)) arm(node);
      }
    }
  });
  mo.observe(root.body, { childList: true, subtree: true });
  root.documentElement.setAttribute('data-reveal-armed', '');
  return () => {
    io.disconnect();
    mo.disconnect();
    root.documentElement.removeAttribute('data-reveal-armed');
  };
}
