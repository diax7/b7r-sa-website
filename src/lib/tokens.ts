/**
 * The few brand values that must exist outside CSS: the viewport theme colour, the manifest,
 * the OG images and the static 410 body. Each mirrors a `--color-*` token in
 * `src/styles/globals.css`; `tests/tokens.test.ts` keeps them in sync.
 */
export const BRAND_PRIMARY_HEX = '#0058B0';

/** `--color-{name}` → hex, for markup rendered outside the Tailwind pipeline. */
export const TOKEN_HEX = {
  primary: BRAND_PRIMARY_HEX,
  surface: '#FFFFFF',
  text: '#14181F',
  'text-muted': '#5B6470',
} as const;
