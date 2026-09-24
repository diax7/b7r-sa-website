/**
 * WCAG 2.1 contrast, and the lightness searches the derivation rules are built from
 * (spec 010). `tests/contrast.test.ts` guards the pairs the design system ships today; this
 * is the machinery that generates pairs from colours nobody has chosen yet.
 *
 * Nothing here raises. These functions run inside `SiteDocument`, which renders every page
 * and the global 404, so a throw would take the site down; an unsatisfiable requirement is
 * returned as a failure carrying the best ratio it reached, which the panel turns into the
 * editor's refusal (ADR-061's rule that a failure degrades rather than cascades).
 */
import { hexToOklch, type Oklch, oklchToHex, withLightness } from '@/modules/brand/oklch';

/** A search that either found a colour or ran out of lightness trying. */
export type Search =
  | { ok: true; value: string }
  | { ok: false; best: number; wanted: number; on: string };

/** How many halvings the binary search takes: 2^-24 of the lightness range is far past a hex step. */
const STEPS = 24;

function relativeLuminance(hex: string): number {
  const digits = /^#([0-9a-f]{6})$/i.exec(hex)?.[1];
  if (!digits) throw new Error(`brand: "${hex}" is not a #rrggbb colour`);
  const [r, g, b] = [0, 2, 4].map((i) => {
    const channel = parseInt(digits.slice(i, i + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** The WCAG 2.1 ratio between two colours, 1 to 21, order independent. */
export function contrastRatio(a: string, b: string): number {
  const [lighter, darker] = [relativeLuminance(a), relativeLuminance(b)].toSorted(
    (x, y) => y - x,
  ) as [number, number];
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Walks `colour`'s lightness towards `target` until it reaches `ratio` against `on`, keeping
 * its hue and chroma. Returns the first colour that meets the requirement, or a failure
 * carrying the best ratio the walk reached.
 */
function search(colour: string, on: string, ratio: number, target: 0 | 100): Search {
  const start: Oklch = hexToOklch(colour);
  let best = contrastRatio(colour, on);
  if (best >= ratio) return { ok: true, value: colour };

  // The endpoint is the most extreme lightness available; if even that misses, nothing between
  // can reach the requirement, because contrast against a fixed background is monotonic in
  // lightness on each side of it.
  const endpoint = oklchToHex(withLightness(start, target));
  const endpointRatio = contrastRatio(endpoint, on);
  if (endpointRatio < ratio) {
    return { ok: false, best: Math.max(best, endpointRatio), wanted: ratio, on };
  }

  let near = start.l;
  let far: number = target;
  let found = endpoint;
  for (let step = 0; step < STEPS; step++) {
    const middle = (near + far) / 2;
    const candidate = oklchToHex(withLightness(start, middle));
    const candidateRatio = contrastRatio(candidate, on);
    if (candidateRatio >= ratio) {
      found = candidate;
      best = candidateRatio;
      far = middle;
    } else {
      near = middle;
    }
  }
  return { ok: true, value: found };
}

/** `colour` darkened just far enough to reach `ratio` against `on`. */
export function darkenUntil(colour: string, on: string, ratio: number): Search {
  return search(colour, on, ratio, 0);
}

/** `colour` lightened just far enough to reach `ratio` against `on`. */
export function lightenUntil(colour: string, on: string, ratio: number): Search {
  return search(colour, on, ratio, 100);
}

/**
 * The lightest version of `colour` that still reaches `ratio` against `on`: the rule muted
 * text follows, where the aim is to recede as far as readability allows rather than to pass
 * a threshold from the wrong side.
 */
export function lightestMeeting(colour: string, on: string, ratio: number): Search {
  const start = hexToOklch(colour);
  if (contrastRatio(colour, on) < ratio) {
    return { ok: false, best: contrastRatio(colour, on), wanted: ratio, on };
  }
  let meets = start.l;
  let fails = 100;
  let found = colour;
  for (let step = 0; step < STEPS; step++) {
    const middle = (meets + fails) / 2;
    const candidate = oklchToHex(withLightness(start, middle));
    if (contrastRatio(candidate, on) >= ratio) {
      meets = middle;
      found = candidate;
    } else {
      fails = middle;
    }
  }
  return { ok: true, value: found };
}
