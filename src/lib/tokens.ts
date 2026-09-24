/**
 * The shipped palette, for the two things drawn outside the app that cannot read the
 * Appearance global: the static 410 body, which the proxy answers before any database call,
 * and the share images, drawn once at each deploy. Both keep these colours after a change and
 * say so on the Appearance screen's "does not follow" list (spec 010). Each mirrors a
 * `--color-*` token in `src/styles/globals.css`; `tests/tokens.test.ts` keeps them in sync.
 */
export const TOKEN_HEX = {
  primary: '#0058B0',
  surface: '#FFFFFF',
  text: '#14181F',
  'text-muted': '#5B6470',
} as const;
