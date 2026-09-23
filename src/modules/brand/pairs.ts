/**
 * Every foreground and background the palette actually puts together (spec 010).
 *
 * One table, read by two gates. `derive` uses the subset it can fix by adjusting a lightness;
 * `resolveBrand` checks all of them over the finished palette, including the pairs whose
 * background is a source an editor typed, which no rule can repair. That distinction is the
 * point: `--color-primary` is the button fill and `--color-navy` is the footer, so a pale
 * primary makes white on white and only a refusal can stop it.
 *
 * The list mirrors `tests/contrast.test.ts`, which has held the shipped pairs since the
 * design system was written; adding a combination there means adding it here. Four of its
 * pairs are deliberately absent, so that a later reader diffing the two lists does not
 * "restore" them:
 *
 * - **Button inverse** (primary on white) duplicates "Button secondary and ghost" for as long
 *   as `surface` is `#ffffff`, which it is: a coloured page is a background set, not a token.
 * - **Footer muted, white at 75 percent on navy** needs alpha compositing, which a pair of
 *   token names cannot express. It is covered by the footer's own pair.
 * - **Success line** and **Error text** are semantic, not brand (decision 2 of the spec). They
 *   never follow the brand blue, so they are checked where they are defined, in the stylesheet.
 */

/** WCAG AA: 4.5:1 for body text, 3:1 for large or bold text and for non-text contrast. */
export const AA_TEXT = 4.5;
export const AA_LARGE = 3;

/** A token name in the resolved palette, without the `color-` prefix. */
export type PaletteToken =
  | 'primary'
  | 'primary-hover'
  | 'primary-dark'
  | 'navy'
  | 'accent'
  | 'accent-tint'
  | 'accent-on-tint'
  | 'ground'
  | 'surface'
  | 'text'
  | 'text-muted'
  | 'border';

export type PairKey =
  | 'buttonPrimary'
  | 'buttonPrimaryHover'
  | 'buttonSecondary'
  | 'buttonInverseHover'
  | 'badgeAccent'
  | 'bodyOnSurface'
  | 'bodyOnGround'
  | 'mutedOnSurface'
  | 'mutedOnGround'
  | 'footerOnNavy'
  | 'ribbonOnPrimaryDark';

export interface Pair {
  /** The pair's name in both string trees (`appearance.pairs`), where the editor reads it. */
  key: PairKey;
  /** What this combination is on the page, in English, for the log. */
  use: string;
  fg: PaletteToken | '#ffffff';
  bg: PaletteToken | '#ffffff';
  min: number;
}

export const PALETTE_PAIRS: readonly Pair[] = [
  { key: 'buttonPrimary', use: 'Button primary', fg: '#ffffff', bg: 'primary', min: AA_TEXT },
  {
    key: 'buttonPrimaryHover',
    use: 'Button primary hover',
    fg: '#ffffff',
    bg: 'primary-hover',
    min: AA_TEXT,
  },
  {
    key: 'buttonSecondary',
    use: 'Button secondary and ghost',
    fg: 'primary',
    bg: 'surface',
    min: AA_TEXT,
  },
  {
    key: 'buttonInverseHover',
    use: 'Button inverse hover',
    fg: 'primary',
    bg: 'accent-tint',
    min: AA_TEXT,
  },
  {
    key: 'badgeAccent',
    use: 'Badge accent, the accent as text on its tint',
    fg: 'accent-on-tint',
    bg: 'accent-tint',
    min: AA_TEXT,
  },
  { key: 'bodyOnSurface', use: 'Body text on surface', fg: 'text', bg: 'surface', min: AA_TEXT },
  { key: 'bodyOnGround', use: 'Body text on ground', fg: 'text', bg: 'ground', min: AA_TEXT },
  {
    key: 'mutedOnSurface',
    use: 'Muted text on surface',
    fg: 'text-muted',
    bg: 'surface',
    min: AA_TEXT,
  },
  {
    key: 'mutedOnGround',
    use: 'Muted text on ground',
    fg: 'text-muted',
    bg: 'ground',
    min: AA_TEXT,
  },
  { key: 'footerOnNavy', use: 'Footer text on navy', fg: '#ffffff', bg: 'navy', min: AA_TEXT },
  {
    key: 'ribbonOnPrimaryDark',
    use: 'Ribbon text on primary dark',
    fg: '#ffffff',
    bg: 'primary-dark',
    min: AA_TEXT,
  },
] as const;
