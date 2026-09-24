/**
 * The type boundary the brand's no-throw contract rests on (spec 010, plan task 1a).
 *
 * Every colour that reaches the derivation rules comes from the Appearance global in phase
 * 1b, which means from Postgres: a NULL column, a legacy three digit hex, or a value pasted
 * with a trailing space. `brandCss` runs inside `SiteDocument`, which renders every page and
 * the global 404, so one malformed value must not be able to take the site down. Colours are
 * parsed once, here, and everything downstream takes a `Hex` that has already been checked.
 */

declare const HEX: unique symbol;

/** A colour known to be `#rrggbb`, lowercased. Only `toHex` can make one. */
export type Hex = string & { readonly [HEX]: true };

const HEX_PATTERN = /^#[0-9a-f]{6}$/;

/** Whether a value is already a well formed, lowercase `#rrggbb`. */
export function isHex(value: unknown): value is Hex {
  return typeof value === 'string' && HEX_PATTERN.test(value);
}

/**
 * A colour from outside, or `null` if it is not one. Trims and lowercases, because a value
 * typed into the panel or restored from the database routinely carries neither. Deliberately
 * does not expand `#fff`: a three digit hex means the value came from somewhere that is not
 * the panel, and guessing at it would hide that.
 */
export function toHex(value: unknown): Hex | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().toLowerCase();
  return HEX_PATTERN.test(trimmed) ? (trimmed as Hex) : null;
}

/** The same, for a record of colours: every value must parse or the whole record is refused. */
export function toHexRecord<K extends string>(
  values: Readonly<Record<K, unknown>>,
): Record<K, Hex> | null {
  const parsed = {} as Record<K, Hex>;
  for (const key of Object.keys(values) as K[]) {
    const hex = toHex(values[key]);
    if (!hex) return null;
    parsed[key] = hex;
  }
  return parsed;
}
