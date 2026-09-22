/**
 * The saved brand as one style block for the document head (spec 010).
 *
 * Written as `:root:root` rather than `:root`: `site-document.tsx` imports `globals.css` and
 * Next hoists it into the head, so a plain `:root` block would tie with Tailwind's
 * `:root, :host` and the winner would depend on hoisting order, which cannot be verified
 * without a build. Specificity (0,2,0) settles it for one character.
 *
 * Never throws. This runs while `SiteDocument` renders every page and the global 404, so a
 * brand that cannot derive falls back to the shipped palette and reports it, rather than
 * taking the site down (ADR-061).
 */
import { type BrandDerived, derive, type DerivationFailure } from '@/modules/brand/derive';
import {
  type BrandSources,
  DEFAULT_SOURCES,
  SHIPPED_DERIVED,
  SURFACE,
} from '@/modules/brand/defaults';

export interface Brand {
  sources: BrandSources;
  /**
   * Values that stand instead of their rule's output. The factory ships the three colours the
   * calibration found are designed rather than computed (`calibration.md`); phase 1b's hook
   * clears those when a source changes, since that moment is a rebrand and the rules should
   * take over. An editor's own pin is kept until they reset it.
   */
  pinned: Partial<BrandDerived>;
}

/** The brand the site ships with: today's palette, exactly. */
export const DEFAULT_BRAND: Brand = {
  sources: DEFAULT_SOURCES,
  pinned: {
    border: SHIPPED_DERIVED.border,
    textMuted: SHIPPED_DERIVED.textMuted,
    accentOnTint: SHIPPED_DERIVED.accentOnTint,
  },
};

/** Every `--color-*` the brand owns. Semantic colours are not here: they stay in the stylesheet. */
export type BrandTokens = Record<string, string>;

export interface Resolved {
  tokens: BrandTokens;
  failures: DerivationFailure[];
}

/** The rules' output with the pins laid over it, and whatever fell short. */
export function resolveBrand(brand: Brand): Resolved {
  const derivation = derive(brand.sources);
  const derived: BrandDerived = { ...derivation.value, ...brand.pinned };
  return {
    tokens: {
      'color-primary': brand.sources.primary,
      'color-primary-hover': derived.primaryHover,
      'color-primary-dark': brand.sources.primaryDark,
      'color-navy': brand.sources.navy,
      'color-accent': brand.sources.accent,
      'color-accent-tint': derived.accentTint,
      'color-accent-on-tint': derived.accentOnTint,
      'color-ground': derived.ground,
      'color-surface': SURFACE,
      'color-text': brand.sources.ink,
      'color-text-muted': derived.textMuted,
      'color-border': derived.border,
    },
    failures: derivation.ok ? [] : derivation.failures,
  };
}

/** The declarations of a token map, one per line, indented for a readable head. */
function declarations(tokens: BrandTokens): string {
  return Object.entries(tokens)
    .map(([name, value]) => `--${name}:${value}`)
    .join(';');
}

/**
 * The style block for a brand. A brand whose rules cannot be satisfied falls back to the
 * shipped palette rather than rendering something unreadable; the panel refuses such a save
 * long before it can reach here, so this is the second line of defence, not the first.
 */
export function brandCss(brand: Brand): string {
  const resolved = resolveBrand(brand);
  const tokens =
    resolved.failures.length === 0 ? resolved.tokens : resolveBrand(DEFAULT_BRAND).tokens;
  return `:root:root{${declarations(tokens)}}`;
}
