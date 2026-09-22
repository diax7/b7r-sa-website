# 010 implementation plan

Spec: `spec.md` in this folder. Branch `brand/settings` off main at 9989617.

> **Revision 2, 2026-09-22.** Revision 1 scored 64/100 and was refused. Its central claim,
> that a scoped token override needs a `@theme inline` restructure, was false: custom
> properties inherit and `var()` substitutes on the element the declaration applies to, so
> `[data-surface='deep-sea'] { --color-surface: … }` works against the stylesheets exactly as
> they are. Worse, `@theme inline` emits no `--color-*` property at all
> (`src/app/(payload)/admin.css:63-65` documents this), so the restructure would have deleted
> the variable out from under 43 hand-written rules, including the site's background, body
> colour and both typefaces. The restructure is gone, and phase 1a is smaller for it.

## The constraint that shapes everything

**No database is reachable on this machine.** Postgres is not running, Docker's daemon is
down with no image cached, and `pnpm build` fails at `payloadInitError` on the untouched tip
of main too (verified by stashing and rebuilding).

- **Runnable here:** `typecheck`, `lint`, `format:check`, `check:rtl`, `check:dash`, and the
  full vitest suite (1320 tests; none touch Postgres).
- **Not runnable here:** `pnpm build`, the Playwright e2e, any runtime read of a global.

So every new unit is pure and unit-tested: values in, values out, no Payload, no React, no IO.
That is good design regardless, and here it is also the only way the hard parts are provable.

## Phase 1a: the pure modules, and the block that restates today

Nothing an editor can see changes, and no stylesheet is touched.

### Task 1a.0: calibrate the rules against today's values (do this first)

Before writing `derive.ts`, take the four sources and check, token by token, whether each
candidate rule reproduces the hex shipping today. Write the arithmetic into the commit
message. Per the spec, each token ends in one of three states: the rule reproduces it exactly,
the rule's constant is tuned to a round number that does, or the token is **promoted to a
source** because it is a brand fact rather than a derivation. `primary-dark` (`#1858a8`) is
the likely promotion: the BRD calls it the logo's secondary blue, a different hue from
primary. **The number of sources is an output of this task, not an input.**

This is the task that decides whether the derivation engine is honest or a pile of fudge
factors, so it happens before any code depends on it.

### New files

| File | What it holds |
|---|---|
| `src/modules/brand/types.ts` | `Hex`, `BrandSources`, `Derived`, `Brand`, `SurfaceSet`. |
| `src/modules/brand/oklch.ts` | sRGB to OKLab to OKLCH and back, published matrices, about 80 lines, no dependency. Includes an in-gamut clamp. |
| `src/modules/brand/contrast.ts` | WCAG relative luminance and ratio; `darkenUntil(colour, on, ratio)` and `lightenUntil`, binary search on OKLCH lightness, returning a failure rather than throwing when no lightness satisfies the requirement. |
| `src/modules/brand/derive.ts` | `derive(sources): { ok: true, value } \| { ok: false, failures }`. The calibrated rules, each carrying its contrast requirement. |
| `src/modules/brand/defaults.ts` | `DEFAULT_BRAND`: today's exact values. |
| `src/modules/brand/css.ts` | `brandCss(brand): string`. Emits `:root:root { … }` plus one scope per surface set. Falls back to `DEFAULT_BRAND` and logs if `derive` fails, so a bad brand can never take down a render. |

### Modified files

| File | Change |
|---|---|
| `src/app/site-document.tsx` | Emits `brandCss(DEFAULT_BRAND)` as a `<style>` block in `<head>`. Nothing else in 1a. The font preload list stays hardcoded until 1b brings the families that would justify deriving it. |

`src/styles/tokens.css` and `src/styles/globals.css` are **not touched in 1a**.

### Why `:root:root`

`site-document.tsx:11` imports `globals.css` and Next hoists it into `<head>`. A runtime block
declaring `:root { … }` has the same specificity as Tailwind's `:root, :host { … }`, so the
winner would be decided by hoisting order, which cannot be verified here without a build.
`:root:root` is specificity (0,2,0) and closes the question for one character.

### Tests for 1a

| Test | Asserts |
|---|---|
| `tests/brand-oklch.test.ts` | Round trip over random colours, **and that every `darkenUntil` / `lightenUntil` result is in sRGB gamut**. Hand-rolled OKLCH fails at gamut clipping after a lightness search far more often than at the round trip. |
| `tests/brand-derive.test.ts` | **The property test:** for any sources drawn at random, every derived pair passes its required ratio, or `derive` reports a failure and never returns a failing pair as success. A rule gets broken on purpose to watch this fail before it is trusted. Also extends `tests/contrast.test.ts`'s concept rather than duplicating its name. |
| `tests/brand-css.test.ts` | **Gate 1, anchored equality:** the expected values come from `git show 9989617:src/styles/globals.css` read inside the test, not from `defaults.ts`, so the comparison is against something this change cannot move. `brandCss(DEFAULT_BRAND)` must produce exactly those values, token by token, naming any token that moved. |
| `tests/brand-vars-defined.test.ts` | **Gate 2, the reverse assertion:** every `var(--…)` referenced in `globals.css`, `tokens.css` and `admin.css` is defined either by a non-inline `@theme` block or by `brandCss(DEFAULT_BRAND)`. This is the test that mechanically catches a token being removed from under a hand-written rule, and it is the one this feature needs permanently. |

Revision 1's gate compared `defaults.ts` against a file whose values came from `defaults.ts`.
It would not have caught a changed token. Gate 1's fixture fixes that; gate 2 catches the
class of failure that made revision 1 dangerous.

For the deferred visual check: **the repo already has this mechanism**. `scripts/dev/golden.mjs`
and the checked-in `.golden/*.html` cover exactly the five pages in question. Revision 1
invented a "screenshot diff on CI" that already exists under another name. It runs when a
database does.

### Existing artifacts this phase must not break

| Artifact | Why it matters |
|---|---|
| `tests/contrast.test.ts:13-17` | Parses `--color-${name}:\s*(#[0-9a-fA-F]{6});` out of `globals.css` and **throws** if a token is missing. It is the project's WCAG AA gate over the shipped pairs. Untouched now that the restructure is gone; it must stay green. |
| `tests/tokens.test.ts:9` | Same parse, keeping `src/lib/tokens.ts` in sync with the stylesheet. |
| `src/lib/tokens.ts` | `BRAND_PRIMARY_HEX` and `TOKEN_HEX` feed the viewport theme colour, the manifest, the OG builder and the 410 page, all outside the Tailwind pipeline. **Its fate is decided in 1b**: a reader of the Appearance global, or declared "does not follow" and named in 1b's panel. |

### States and edges

- Invalid hex: rejected at the type boundary in 1a, by the global's validator in 1b.
- Unsatisfiable derivation: `derive` returns a failure, `brandCss` falls back to
  `DEFAULT_BRAND` and logs. It cannot throw into a render.
- The global 404 renders outside any layout but still goes through `SiteDocument`, so it gets
  the block by construction. Asserted explicitly.

### Also landing in 1a

**ADR-065** and the dated amendment to BRD §3.2. The gradient contradicts "never gradients
between hues, a single flat colour per surface", Dhia approved it, and every comparable
deviation in this project is recorded as a BRD amendment plus an ADR. It lands with the first
code rather than trailing it.

## Phase 1b: the Appearance global and its screen

Named **Appearance** («المظهر»), not Brand: `site-settings.ts:164` already has a Brand section
and the glossary forbids two concepts sharing a word.

The admin surface is governed by `.claude/rules/admin-ui.md` and enforced by four test files.
Naming the gates here so 1b is not discovered to be three phases:

1. **Glossary rows before the first string.** Every new concept needs a row in
   `src/modules/cms/admin/glossary.ts` in both directions: appearance, background set, source
   colour, derived tone, typeface, gradient, grain. Retrofitting the glossary after writing the
   strings is the worst possible order.
2. `adminGroup('site')`, a row in `ADMIN_NAV` with its order and place, an icon in
   `GLOBAL_ICONS` that is a **place** and does not repeat the group's first entry.
3. `admin.custom.shows` in both languages; the header through `globalComponents(slug)`.
4. Bilingual `label`; a description map under `src/modules/cms/admin/descriptions/` applied by
   `describeFields()`; every sentence at most 140 characters, Arabic verb-first and never
   opening with «في».
5. `sectionIcon()` on every tab and collapsible (rule 17).
6. `pnpm payload generate:importmap`, with `importMap.js` committed.
7. The new view added to the axe pass in `e2e/admin.spec.ts`.
8. `afterChange` through the existing `src/modules/cms/hooks/revalidate.ts`, which already
   handles being called outside a request.
9. The outsider test: the public credential can neither read nor write the global.

**The "what will not follow" panel ships in 1b, not 1d.** Otherwise the window between them
ships a screen that lies: an admin changes the blue and the theme colour, manifest, OG images,
410 page, 3D icons and logo all stay old with nothing saying so.

**The typeface select and its four `@font-face` sets land together.** The faces are static at
`tokens.css:245-279` and the metric fallback at `:282-289` is tuned for Rayat specifically
(`size-adjust: 104%`, `ascent-override: 96%`). Shipping the select without the other three
families' faces, subsets and fallbacks gives a font that never loads plus a fallback tuned for
the wrong family: the site renders in Segoe UI and CLS regresses past its gate. `--font-sans`
must switch the fallback family name too, not only the primary.

## Phases 1c, 1d and 2

**1c** `surfaces.ts` and the four default sets, the gradient reproduced as `sea-mist` with its
grain tile, `Section` taking a set by name. `Section` already emits `data-tone` and swaps
`bg-ground` for `bg-surface`, so this evolves an existing prop.

**1d** the SVG logo, the e-mails reading the brand at send time, the generated favicon and PWA
colour.

**2** the `background` select on the home tabs and the page blocks.

## Judgment calls

1. **Hand-rolled OKLCH over a dependency.** About 80 lines of published matrices, needed on the
   client for 1b's live strip, and `CLAUDE.md` asks that dependencies be justified. The
   in-gamut assertion above is the real safety net, not the round trip.
2. **Semantic colours excluded.** Success, warning, error and WhatsApp keep their literals. A
   failure that follows the brand blue stops reading as a failure.
3. **Radius, motion and the type scale excluded.** Not brand values; nobody asked; each one
   added is a token that can be set to something that breaks a layout.
4. **Two gates, not one.** Anchored equality plus the reverse "every var is defined"
   assertion, with `golden.mjs` for the visual check when a database exists.
5. **Inline `<style>` over a stylesheet link**, at `:root:root`. Under a kilobyte, must not
   flash unstyled, and a second request would cost more than it saves.
6. **The derivation engine is convenience on top of the real guarantee.** The refusal of a
   failing override is what delivers the AA promise; derivation saves the editor work. Kept
   because it is bounded, pure and testable, and because calibration (1a.0) is what keeps it
   from becoming magic numbers.
