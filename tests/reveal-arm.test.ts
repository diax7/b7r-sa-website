import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { armReveal } from '@/modules/core/reveal-arm';

/**
 * The scroll reveal's arming (ADR-055) over a stubbed viewport of 800 px: what is in view
 * is visible at once, what is below is hidden and observed, a group staggers its children,
 * later nodes are armed, and reduced motion arms nothing.
 */
type Callback = (entries: IntersectionObserverEntry[]) => void;

const observed: Element[] = [];
let callback: Callback | undefined;
let reduced = false;

function stubViewport() {
  Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });
  window.matchMedia = ((query: string) => ({
    matches: reduced && query.includes('reduce'),
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
  class StubIntersectionObserver {
    constructor(cb: Callback) {
      callback = cb;
    }
    observe(el: Element) {
      observed.push(el);
    }
    unobserve(el: Element) {
      const at = observed.indexOf(el);
      if (at >= 0) observed.splice(at, 1);
    }
    disconnect() {
      observed.length = 0;
    }
  }
  Object.defineProperty(window, 'IntersectionObserver', {
    value: StubIntersectionObserver,
    configurable: true,
    writable: true,
  });
}

/** A section whose box starts at `top` px from the viewport's top and is 300 px tall. */
function section(id: string, top: number, inner = '') {
  const el = document.createElement('section');
  el.id = id;
  el.setAttribute('data-reveal', '');
  el.innerHTML = inner;
  el.getBoundingClientRect = () =>
    ({ top, bottom: top + 300, left: 0, right: 0, width: 0, height: 300 }) as DOMRect;
  return el;
}

describe('armReveal (ADR-055)', () => {
  beforeEach(() => {
    reduced = false;
    observed.length = 0;
    callback = undefined;
    document.body.innerHTML = '';
    document.documentElement.removeAttribute('data-reveal-armed');
    stubViewport();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('marks what is in view visible, hides and observes what is below, and reveals on entry', () => {
    const above = section('above', 100);
    const edge = section('edge', 800 * 0.92 - 1);
    const below = section('below', 800 * 0.92);
    document.body.append(above, edge, below);
    const teardown = armReveal();
    expect(teardown).toBeTypeOf('function');
    expect(document.documentElement.hasAttribute('data-reveal-armed')).toBe(true);
    expect(above.className).toBe('is-visible');
    expect(edge.className).toBe('is-visible');
    expect(below.className).toBe('is-hidden');
    expect(observed).toEqual([below]);
    for (const el of [above, edge, below]) expect(el.hasAttribute('data-armed')).toBe(true);
    callback?.([{ isIntersecting: true, target: below } as unknown as IntersectionObserverEntry]);
    expect(below.classList.contains('is-visible')).toBe(true);
    expect(below.classList.contains('is-hidden')).toBe(false);
    expect(observed).toEqual([]);
    teardown?.();
    expect(document.documentElement.hasAttribute('data-reveal-armed')).toBe(false);
  });

  it('a group staggers its children by index and gives each the reveal', () => {
    const grid = section('grid', 2000, '<article>a</article><article>b</article><p>c</p>');
    grid.removeAttribute('data-reveal');
    grid.setAttribute('data-reveal-stagger', '');
    document.body.append(grid);
    armReveal();
    const children = Array.from(grid.children) as HTMLElement[];
    expect(children.map((c) => c.style.getPropertyValue('--i'))).toEqual(['0', '1', '2']);
    expect(children.every((c) => c.hasAttribute('data-reveal'))).toBe(true);
    // The children sit inside a box at 2000 px: hidden and observed.
    expect(children.every((c) => c.classList.contains('is-hidden'))).toBe(true);
    expect(observed).toHaveLength(3);
  });

  it('arms a node added later, itself or a descendant, and skips one without a reveal', async () => {
    armReveal();
    const later = section('later', 3000);
    const wrapper = document.createElement('div');
    wrapper.append(section('inner', 3000));
    const plain = document.createElement('div');
    plain.textContent = 'no reveal here';
    document.body.append(later, wrapper, plain);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(later.className).toBe('is-hidden');
    expect(wrapper.firstElementChild?.className).toBe('is-hidden');
    expect(plain.className).toBe('');
    expect(observed).toHaveLength(2);
  });

  it('arms nothing under reduced motion or without an observer', () => {
    reduced = true;
    const below = section('below', 2000);
    document.body.append(below);
    expect(armReveal()).toBeUndefined();
    expect(below.className).toBe('');
    expect(document.documentElement.hasAttribute('data-reveal-armed')).toBe(false);
    reduced = false;
    Object.defineProperty(window, 'IntersectionObserver', { value: undefined, configurable: true });
    expect(armReveal()).toBeUndefined();
    expect(below.className).toBe('');
  });
});
