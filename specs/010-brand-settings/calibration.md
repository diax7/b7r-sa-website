# Task 1a.0: calibrating the derivation rules against the shipped palette

Run 2026-09-22 before `derive.ts` was written, per the spec. Every candidate rule was tested
against the hex currently in `src/styles/globals.css`. Sources cited: BRD
`docs/brd-sections/01-design-system.md:14, 20, 21` on which blues are sampled from the logo
and which are derived.

## The shipped palette in OKLCH

| Token | Hex | L | C | H |
|---|---|---|---|---|
| primary | `#0058b0` | 47.0 | 0.1576 | 255.5 |
| primary-hover | `#004a94` | 41.6 | 0.1374 | 255.1 |
| primary-dark | `#1858a8` | 46.7 | 0.1433 | 256.5 |
| navy | `#0a2f5e` | 30.9 | 0.0934 | 256.6 |
| accent | `#0098e0` | 64.9 | 0.1496 | 240.4 |
| accent-tint | `#e6f5fc` | 96.1 | 0.0185 | 227.3 |
| accent-on-tint | `#00639c` | 48.2 | 0.1195 | 244.3 |
| ground | `#f6f8fb` | 97.8 | 0.0045 | 258.3 |
| border | `#e5e9ef` | 93.3 | 0.0092 | 258.3 |
| text (ink) | `#14181f` | 20.8 | 0.0153 | 261.6 |
| text-muted | `#5b6470` | 50.0 | 0.0222 | 255.6 |

## Result: three rules reproduce exactly, and they are the honest ones

| Token | Rule | Verdict |
|---|---|---|
| `primary-hover` | **primary multiplied by 0.84 in sRGB** ("16 percent darker") | **Exact.** The exact range is 0.839 to 0.843, so 0.84 is the round number in the middle, not a fudge. |
| `ground` | **primary-dark at 4.1 percent over surface** | **Exact.** Note the source: not primary and not navy. |
| `accent-tint` | **accent at 10 percent over surface** | **Exact.** The rule the spec already claimed. |

## Result: four tokens are designed, not computed

Each was tested against every plausible rule and none reproduces it.

| Token | Closest rule tried | Result |
|---|---|---|
| `border` | navy at 10 percent over surface | `#e6eaef` against `#e5e9ef`. **One channel out by one.** Close enough to look identical, not close enough to be the same value. |
| `text-muted` | ink lightened until 4.6:1 on surface | `#70767f` against `#5b6470`. Far out, and the hues differ (ink 261.6, muted 255.6), so no lightness search on ink reaches it. As an alpha blend of navy the best fit is out by 21 in a channel. |
| `accent-on-tint` | accent darkened until 4.5:1 on the tint | `#0073b9` against `#00639c`. The shipped value sits at 5.77:1, well past AA, so it was chosen by eye rather than by threshold. |
| `navy` | primary darkened, chroma scaled | `#002f63` against `#0a2f5e`, and no sRGB multiple of primary can produce navy's red channel of 10 from primary's 0. Despite `01-design-system.md:21` calling it "(derived)", it is not computationally derived. |

`primary-dark` is confirmed as a source, as the CTO's measurements predicted: at L 46.7 against
primary's 47.0 it is the same lightness, so "primary darkened" was never the rule. It is the
logo's second blue (`01-design-system.md:14, 20`), and it now also carries `ground`.

## What this means for the model

Reproducing hand-designed hexes by rule is not possible, and forcing it would mean either
fudge constants or changing colours the site ships today. So the model splits the two
requirements that were quietly conflated:

- **Today's site must not change.** `DEFAULT_BRAND` stores the designed values verbatim. The
  equality gate compares them against a checked-in fixture of the pre-change stylesheet, so it
  catches a typo in `defaults.ts` rather than comparing a file to itself.
- **Changing a source must move the family.** Every derived token carries its rule. The three
  exact rules apply always and produce no jump. The four designed tokens ship with their
  designed values and recompute from their rules the moment a source changes, because that
  moment is a rebrand and a coherent recomputed family is the point.

The property test still guarantees the promise that matters: for any sources, every rule's
output passes its contrast requirement.

## Sources: five, not four

`primary`, `primary-dark`, `accent`, `navy`, `ink`.

Dhia approved "four you set, eight derived" and will see five pickers. `primary-dark` earns
its place twice over: it is a brand blue sampled from the logo, and `ground` derives from it.
**Flagged for Dhia rather than decided silently.**

## Two errors found in the BRD

Both in `docs/brd-sections/01-design-system.md`, both measured against the shipped hexes:

1. Line 27 says `--color-text-muted` is **"4.6:1 on white"**. It measures **6.00:1**. The token
   is more readable than documented, so nothing shipped is at risk.
2. Line 22 says `--color-accent` is **"3.5:1 on white"**. It measures **3.20:1**. This one
   carries weight: that figure is the stated reason accent is banned for body text on white
   and allowed at 24 px bold or above. At 3.20:1 it still clears the 3:1 large-text threshold,
   but by a thinner margin than the BRD claims, so the rule it justifies should not be relaxed
   on the strength of the written number.

Both are corrected in the BRD amendment that lands with ADR-065.
