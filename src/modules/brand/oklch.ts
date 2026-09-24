/**
 * sRGB and OKLCH, for the Appearance global's derivation rules (spec 010).
 *
 * OKLCH rather than HSL so that a lightness step is perceptually even across hues: "darken
 * until the contrast requirement is met" must behave the same for a blue as for a red, and
 * HSL's lightness does not. Hand rolled rather than pulled from a package: these are the
 * published Oklab matrices, the whole conversion is under a hundred lines, and it is needed
 * on the client for the panel's live derived strip, where a colour library would be tens of
 * kilobytes for four functions (CLAUDE.md: justify new dependencies).
 *
 * Every function here is pure and total. `oklchToHex` clamps into the sRGB gamut rather than
 * returning a channel outside it, so a lightness search can never produce an unrenderable
 * colour; `tests/brand-oklch.test.ts` holds that property.
 */

/** A colour in OKLCH: lightness 0 to 100, chroma from 0, hue in degrees. */
export interface Oklch {
  l: number;
  c: number;
  h: number;
}

const clamp01 = (n: number): number => (n < 0 ? 0 : n > 1 ? 1 : n);

/** sRGB transfer function and its inverse (IEC 61966-2-1). */
const toLinear = (c: number): number => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const fromLinear = (c: number): number =>
  c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;

/** `#rrggbb` to three channels in 0 to 1. Accepts any case; rejects anything else. */
function parseHex(hex: string): [number, number, number] {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match?.[1]) throw new Error(`brand: "${hex}" is not a #rrggbb colour`);
  const digits = match[1];
  return [0, 2, 4].map((i) => parseInt(digits.slice(i, i + 2), 16) / 255) as [
    number,
    number,
    number,
  ];
}

/** Three channels in 0 to 1 back to `#rrggbb`, clamped into gamut. */
function formatHex(rgb: readonly [number, number, number]): string {
  return `#${rgb
    .map((c) =>
      Math.round(clamp01(c) * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

/** Oklab from linear sRGB (Ottosson's matrices). */
function rgbToOklab(rgb: readonly [number, number, number]): [number, number, number] {
  const [r, g, b] = rgb.map(toLinear) as [number, number, number];
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

/** Linear sRGB from Oklab, then the transfer function. Out of gamut channels are clamped. */
function oklabToRgb(lab: readonly [number, number, number]): [number, number, number] {
  const [L, a, b] = lab;
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    fromLinear(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    fromLinear(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    fromLinear(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}

/** `#rrggbb` to OKLCH. */
export function hexToOklch(hex: string): Oklch {
  const [L, a, b] = rgbToOklab(parseHex(hex));
  return {
    l: L * 100,
    c: Math.hypot(a, b),
    h: ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360,
  };
}

/** OKLCH back to `#rrggbb`, clamped into the sRGB gamut. */
export function oklchToHex(colour: Oklch): string {
  const radians = (colour.h * Math.PI) / 180;
  return formatHex(
    oklabToRgb([colour.l / 100, colour.c * Math.cos(radians), colour.c * Math.sin(radians)]),
  );
}

/** The same colour at a different lightness, hue and chroma untouched. */
export function withLightness(colour: Oklch, l: number): Oklch {
  return { ...colour, l: Math.max(0, Math.min(100, l)) };
}

/** Multiplies every sRGB channel by `factor`: the rule `primary-hover` follows (calibration.md). */
export function scaleSrgb(hex: string, factor: number): string {
  return formatHex(parseHex(hex).map((c) => c * factor) as [number, number, number]);
}

/** `fg` laid over `bg` at `alpha`, in sRGB: the rule the tints follow (calibration.md). */
export function mixSrgb(fg: string, bg: string, alpha: number): string {
  const front = parseHex(fg);
  const back = parseHex(bg);
  return formatHex(
    front.map((c, i) => c * alpha + back[i]! * (1 - alpha)) as [number, number, number],
  );
}
