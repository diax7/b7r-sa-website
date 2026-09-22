# 010: Brand settings, and a background per section

> Decided with Dhia on 2026-09-22. Two features, built in order: the brand settings screen
> (phase 1), then the per-section background picker (phase 2). The second is a dropdown over
> what the first owns, so it cannot come first.

## Why

Today every brand value is frozen at build time. The four blues, the neutrals, the typeface
and the logo live in `src/styles/tokens.css` and `src/styles/globals.css`, and changing any
of them is a code change. Dhia wants one screen in the panel that owns all of it: change the
blue once and the whole site follows, with no value hardcoded anywhere.

The trigger was a gradient Dhia liked and wanted as the site's background instead of flat
white. The answer to "recreate it as a vector or use the PNG" turned out to be neither on its
own: the gradient belongs in a library of named backgrounds that the brand screen owns, which
is how WordPress models a gradient (a preset with a name, a slug and a value, emitted as a CSS
variable the whole site reads).

## The decisions

| # | Decision | Why |
|---|---|---|
| 1 | Brand settings first, the per-section picker second | The picker is a dropdown over the library; it has nothing to list until the library exists |
| 2 | A background is a **set**, not a colour: background, text, muted text, and the button variant that reads on it | Shopify shipped exactly this (`color_scheme_group`), is migrating merchants to a flat palette, and its developer forum in June 2026 documents the result: a custom section background leaves the buttons and inputs inside it clashing, because they were tuned against the page background. Theme authors are now each rebuilding contrast derivation by hand. We start where they are being asked to return to. |
| 3 | Four colours set by hand, eight derived, any derived value overridable | Derivation is where the readability promise lives: a rule that says "darken until AA passes" cannot produce unreadable text whatever blue is chosen. Twelve free pickers would leave a warning as the only protection, and warnings get clicked past. |
| 4 | An override that fails its contrast requirement is **refused**, not warned | The BRD promises AA. A refusal names the pair and the ratio it got, in the editor's language. |
| 5 | Typeface: a curated list, self-hosted, default **ITF Rayat Round** | Each family needs its own metric-tuned fallback (`size-adjust`, `ascent-override`) or CLS regresses past the e2e gate, and its own subset built with `scripts/subset-fonts.sh` (the served Rayat files are subsets of the licensed woff2, Arabic plus Basic Latin plus punctuation, about 27 kB each, BRD §3.2 as amended by ADR-010). A free upload adds Arabic coverage validation and licence checks on top, and one bad file breaks every page at once. |
| 5b | The licence boundary is recorded in the screen | B7R holds a **web licence for Rayat Round that permits serving only from b7r.sa** (BRD §3.2). The curated alternates are openly licensed and carry no such restriction. The typeface field's description names this, so nobody later serves Rayat from another host without knowing. |
| 6 | The list: ITF Rayat Round (default), Baloo Bhaijaan 2, IBM Plex Sans Arabic, Tajawal | Rayat is the brand. Baloo is the closest rounded character and is already the merchant app's font, so choosing it aligns the website with the platform. The other two give a neutral and a geometric register. Families come from Google Fonts; the **files are downloaded and self-hosted**, never loaded from `fonts.googleapis.com` (a third-party request on every page, LCP we do not have, and visitor IPs in front of Google). |
| 7 | The panel's **colours** stay as they are; its **typeface** follows the brand | `tokens.css` is shared by both stylesheets, so the font token reaches the panel by construction. The panel's colours are its own system (ADR-039, ADR-060) and theming them doubles the work for no gain. |
| 8 | The six 3D feature icons stay brand-locked | No source files exist (confirmed with Dhia). The blue is in the shading, not only the background, so a programmatic recolour would look wrong. Instead the Brand screen carries a **"what will not follow"** panel naming every raster asset still holding the old colour. |

## Out of scope

Editing the panel's own colours. Uploading arbitrary font files. Per-viewer themes or a dark
mode for the site. Recolouring the 3D icons. Multi-brand or per-locale brands: there is one
brand.

## Architecture

A colour reaches a pixel like this:

```
Brand screen  ->  derive.ts  ->  brand global  ->  root layout  ->  every utility
 (a picker)      (8 tones,      (saved; all      (one <style>      (bg-primary
                  AA enforced)   pages            block in the      follows, no
                                 revalidated)     head)             rebuild)
```

No component changes colour by hand. They already use tokens; the tokens stop being frozen.

### The `@theme inline` restructure

`tokens.css` and `globals.css` declare tokens with plain `@theme`. Tailwind emits those as
custom properties on `:root` and utilities reference them, so a **root-level** override works
today. A **scoped** override does not: `var(--color-surface)` resolves where the variable is
defined, which is `:root`, so a section that redefines it would be ignored.

Phase 2 is exactly a scoped override. So phase 1a restructures the themeable tokens to:

```css
:root { --b7r-surface: #ffffff; --b7r-text: #14181f; }
[data-surface='deep-sea'] { --b7r-surface: #0a2f5e; --b7r-text: #ffffff; }

@theme inline {
  --color-surface: var(--b7r-surface);
  --color-text: var(--b7r-text);
}
```

With `inline`, the utility carries the value expression rather than a reference, so a section
subtree resolves it locally. **This is the change that makes phase 2 possible at all**, and it
is why it lands in phase 1 rather than being discovered later.

### Modules

| Path | Responsibility |
|---|---|
| `src/modules/brand/derive.ts` | Pure. Four sources in, twelve tokens out. Each rule carries its contrast requirement. No database, no React. |
| `src/modules/brand/contrast.ts` | WCAG relative luminance and ratio; `darkenUntil(colour, on, ratio)` and its lighten twin, in OKLCH so steps are perceptually even. |
| `src/modules/brand/css.ts` | The saved brand into one style block: the root variables, one scope per background set, the font stack. |
| `src/modules/brand/surfaces.ts` | A background set and its serialization, including the gradient (stops, angle, grain). |
| `src/modules/brand/global.ts` | The Payload global. Bilingual, under the panel's rules. `afterChange` revalidates every page. |
| `src/modules/brand/admin/*` | The pickers, the live derived strip, the contrast verdict, the library cards, the "what will not follow" panel. |

## Data model

The `brand` global, in the Site group, as an entry named «العلامة» / "Brand":

- **colours.sources**: `primary`, `accent`, `navy`, `ink`. Four hex fields.
- **colours.derived**: eight rows of `{ token, value, locked }`. Written by the hook from the
  sources unless `locked`, in which case the given value is validated and kept.
- **typography.family**: a select over the curated list.
- **logo**: `primary`, `onDark`, `icon` uploads.
- **surfaces**: an ordered array of sets, each `{ key, label{ar,en}, kind, background, text,
  textMuted, buttonVariant }` where `kind` is `solid`, `gradient` or `gradientGrain`.

Four sets ship as defaults and reproduce today's site exactly: `surface` (white),
`ground` (#f6f8fb), `sea-mist` (the gradient) and `deep-sea` (navy).

### Derivation rules

| Derived | Rule |
|---|---|
| `primary-hover` | primary, darkened one step |
| `primary-dark` | primary, darkened two steps |
| `accent-tint` | accent at 10% over surface |
| `accent-on-tint` | accent, darkened until it passes AA on `accent-tint` |
| `ground` | surface, shifted toward primary's hue by a fixed small amount |
| `border` | ink at 10% over surface |
| `text-muted` | ink, lightened until it sits at exactly 4.6:1 on surface |
| `on-navy` | accent, lightened until it passes AA on navy |

## Phases

| Phase | Lands | Gate |
|---|---|---|
| **1a** | `derive.ts`, `contrast.ts`, `css.ts`, the `@theme inline` restructure, the root layout emitting the block. Defaults equal today's values. | **The site renders pixel-identical.** A screenshot diff across the five BRD pages at 1440 and 390 in both languages shows zero change. |
| **1b** | The global, the screen, the access rules, the revalidation. | An admin changes primary and the site follows. A non-admin can neither read nor write the global. |
| **1c** | The surfaces library, the gradient reproduced and registered, `Section` taking a set by name. | Existing pages keep their look through the default keys. |
| **1d** | The raster cleanup: an SVG logo inheriting the token, the e-mails reading the brand at send time, the favicon and PWA colour generated, the "what will not follow" panel. | A brand change leaves nothing stale except what the panel names. |
| **2** | The `background` select on each home section tab and each page block, reading the library. | An editor sets the FAQ section to Sea mist and it renders, with its text tone. |

## Testing

- **Property test on the derivation.** For any four source colours drawn at random, every
  derived pair passes its required ratio. This is what turns "we promise AA" into something
  mechanical. A rule will be broken deliberately to watch the test fail before it is trusted.
- **Unit**: `css.ts` output, the gradient serializer, `darkenUntil` convergence and its
  behaviour when no solution exists (a requirement that cannot be met must raise, not loop).
- **Config test**: the global obeys the panel's rules (both languages on every label and
  description, the icons, the group, the description cap).
- **Outsider test**: the public credential can neither read nor write the brand global, per
  the standing rule after the 28-function leak.
- **e2e**: change a colour in the panel, assert the site's computed styles moved; axe at 1440
  and 390 in both languages on a themed section; the CLS gate holds for every family in the
  curated list.
- **Phase 1a**: the screenshot diff is the gate, and it must be empty.

## Risks

| Risk | Handling |
|---|---|
| The `@theme inline` restructure touches every token and the admin shares the file | It lands alone in 1a behind a zero-diff gate, before any feature depends on it |
| A brand save must invalidate every cached page | `afterChange` revalidates the layout; brand changes are rare so the cost is acceptable |
| The gradient's exact colours | Dhia did not supply the source PNG before going away. It will be reproduced from the image as shown in the conversation and flagged for confirmation on their return; the value is one row in the library, so refining it later is a field edit, not a code change. |
| A curated family without a tuned fallback regresses CLS | Each family ships with its own metric overrides and its own subset from `scripts/subset-fonts.sh`; the CLS e2e covers all of them |
| Weight preloading is per page today (Regular and Medium everywhere, Black on the home hero, Bold where the H1 is bold, ADR-010) | The preload list is derived from the chosen family rather than hardcoded, or switching family preloads files that no longer exist |

## Open, for Dhia on return

1. Confirm the gradient match against the original.
2. Confirm the curated font list.
3. Whether the site's logo should also become an upload, or stay a repo asset with only the
   admin's copy made themeable.
