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
| 3 | A few colours set by hand, the rest derived, any derived value overridable | Derivation is where the readability promise lives: a rule that says "darken until AA passes" cannot produce unreadable text whatever blue is chosen. Twelve free pickers would leave a warning as the only protection, and warnings get clicked past. **Settled by task 1a.0 on 2026-09-22, see `calibration.md`: five sources, seven derived.** Dhia approved "four you set, eight derived". Measurement moved `primary-dark` across the line into the sources, and `navy` did not move out to meet it: despite the BRD calling navy "(derived)", no rule reproduces it. So the screen shows five pickers, not four. Flagged to Dhia, not decided silently. |
| 4 | An override that fails its contrast requirement is **refused**, not warned | The BRD promises AA. A refusal names the pair and the ratio it got, in the editor's language. |
| 5 | Typeface: a curated list, self-hosted, default **ITF Rayat Round** | Each family needs its own metric-tuned fallback (`size-adjust`, `ascent-override`) or CLS regresses past the e2e gate, and its own subset built with `scripts/subset-fonts.sh` (the served Rayat files are subsets of the licensed woff2, Arabic plus Basic Latin plus punctuation, about 27 kB each, BRD §3.2 as amended by ADR-010). A free upload adds Arabic coverage validation and licence checks on top, and one bad file breaks every page at once. |
| 5b | The licence boundary is recorded in the screen | B7R holds a **web licence for Rayat Round that permits serving only from b7r.sa** (BRD §3.2). The curated alternates are openly licensed and carry no such restriction. The typeface field's description names this, so nobody later serves Rayat from another host without knowing. |
| 6 | The list: ITF Rayat Round (default), Baloo Bhaijaan 2, IBM Plex Sans Arabic, Tajawal | Rayat is the brand. Baloo is the closest rounded character and is already the merchant app's font, so choosing it aligns the website with the platform. The other two give a neutral and a geometric register. Families come from Google Fonts; the **files are downloaded and self-hosted**, never loaded from `fonts.googleapis.com` (a third-party request on every page, LCP we do not have, and visitor IPs in front of Google). |
| 7 | The panel's **colours** stay as they are; its **typeface** follows the brand | `tokens.css` is shared by both stylesheets, so the font token reaches the panel by construction. The panel's colours are its own system (ADR-039, ADR-060) and theming them doubles the work for no gain. |
| 7b | The global is called **Appearance** («المظهر»), not Brand | `site-settings.ts:164` already has a Brand section holding `brandName`, `brandNameLatin` and `ctaShiny` (ADR-054), and the BRD names it "Site settings → Brand". Two entries reading "Brand" breaks the glossary's one-word-per-concept rule. The split is clean: **Brand** is who we are in words, **Appearance** is how the site looks. Site settings is left untouched; `ctaShiny` is a known adjacency to revisit only if it confuses someone. |
| 7c | The work carries **ADR-065** and a dated amendment to BRD §3.2 | The gradient contradicts "never gradients between hues, a single flat colour per surface" (`docs/brd-sections/01-design-system.md:34`). Dhia approved it, so the decision stands, but every comparable deviation in this project is recorded as a dated in-line BRD amendment plus an ADR (ADR-054 for the button sheen, ADR-061 through ADR-064 for the recent features). ADR-065 is next. |
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

### No restructure is needed (corrected 2026-09-22 after the CTO review)

An earlier draft of this spec claimed that a scoped override could not work today and that
the tokens had to move to `@theme inline`. **That was wrong**, and the correction deletes a
whole phase of work.

Custom properties inherit, and `var()` substitutes at computed-value time on the element the
declaration applies to, not where the property was declared. Plain `@theme` emits
`:root { --color-surface: #ffffff }` and `.bg-surface { background-color: var(--color-surface) }`,
so this is all phase 2 needs, with the stylesheets exactly as they are:

```css
[data-surface='deep-sea'] {
  --color-surface: #0a2f5e;
  --color-text: #ffffff;
  --color-text-muted: #c3d2e4;
}
```

`@theme inline` would have been required only for the indirection the earlier draft proposed
to introduce, and it would have been actively harmful: it inlines a token into its utilities
and **emits no `--color-*` property at all**, which the repo already documents at
`src/app/(payload)/admin.css:63-65`. Forty-three hand-written rules read those properties
directly, including `body { background: var(--color-surface); font-family: var(--font-sans) }`
in `globals.css:83-85` and the panel's own typeface in `admin.css`. The restructure would have
removed the site's background, body colour, focus ring, selection colour and both typefaces.

The emitted runtime block is written as `:root:root { … }` so it outranks Tailwind's
`:root, :host` regardless of stylesheet order, which cannot be verified here without a build.

### Modules

| Path | Responsibility |
|---|---|
| `src/modules/brand/derive.ts` | Pure. The sources in, the derived tokens out, each rule carrying its contrast requirement. Returns a result, never throws. The source list is an output of the calibration task, not fixed in advance. No database, no React. |
| `src/modules/brand/contrast.ts` | WCAG relative luminance and ratio; `darkenUntil(colour, on, ratio)` and its lighten twin, in OKLCH so steps are perceptually even. Reports failure rather than raising when no lightness satisfies the requirement. |
| `src/modules/brand/css.ts` | The saved brand into one style block: the root variables, one scope per background set, the font stack. |
| `src/modules/brand/surfaces.ts` | A background set and its serialization, including the gradient (stops, angle, grain). |
| `src/modules/brand/global.ts` | The Payload global. Bilingual, under the panel's rules. `afterChange` revalidates every page. |
| `src/modules/brand/admin/*` | The pickers, the live derived strip, the contrast verdict, the library cards, the "what will not follow" panel. |

## Data model

The `appearance` global, in the Site group, as an entry named «المظهر» / "Appearance" (decision 7b: «العلامة» / "Brand" is taken by the Site settings section holding the brand's words):

- **sources**: the five brand colours, `primary`, `primary-dark`, `accent`, `navy`, `ink` (the
  calibration's outcome; Dhia confirmed five pickers on 2026-09-23).
- **pins**: the derived colours an editor set by hand, a list of `{ token, value }`. Stored as a
  list because Payload hands a field's validator the save deep-merged over the stored
  document, and a merge unions an object's keys but replaces a list. Six colours are derived:
  `primary-hover`, `accent-tint`, `accent-on-tint`, `ground`, `border`, `text-muted`. Three of
  them (`border`, `text-muted`, `accent-on-tint`) are designed rather than computed; their
  designed value is **not stored**: it applies while every brand colour its rule reads is still
  the shipped one, so a change and its undo can never lose it (amended 2026-09-23 after the
  CTO's phase 1b review, which found a stored "factory pin" could be dropped for good).
- **typeface**: a select over the curated list.
- **logo**: two uploads, `logoPrimary` (the header and the phone menu) and `logoOnDark` (the
  footer). A square icon upload was dropped: its only places are the client error pages and
  the structured data, neither of which reads the global, so it would have done nothing.
- **surfaces** (phase 1c): the library of background sets the brand cannot derive, a list of
  `{ key, label, kind, background, blooms, grain, text, textMuted, link, button }`.

Four sets ship. Three are built from the brand in `globals.css` and follow a rebrand:
`surface` (white), `ground` (the grey sections) and `deep-sea` (the footer's navy); they
reproduce today's site through the keys the sections already use. The fourth, `sea-mist` (the
gradient), is the library's first row, with fixed colours (Dhia, 2026-09-23).

### Derivation rules

| Derived | Rule | Reproduces today |
|---|---|---|
| `primary-hover` | primary multiplied by 0.84 in sRGB (16 percent darker) | **Yes, exactly** |
| `ground` | primary-dark at 4.1 percent over surface | **Yes, exactly** |
| `accent-tint` | accent at 10 percent over surface | **Yes, exactly** |
| `border` | navy at 10 percent over surface | No, one channel out by one |
| `text-muted` | ink lightened until 6:1 on surface | No, a designed colour |
| `accent-on-tint` | accent darkened until AA on the tint | No, the shipped value sits at 5.77:1 |
| `on-navy` | accent lightened until AA on navy | No, a designed colour |

Sources: `primary`, `primary-dark`, `accent`, `navy`, `ink`. **Five, not the four Dhia
approved**, and flagged to them: `primary-dark` is a brand blue sampled from the logo and
`ground` derives from it.

Task 1a.0 ran on 2026-09-22 and its findings are in `calibration.md`, including two errors it
turned up in the BRD's own contrast figures. The conclusion that shapes the model: hand
designed hexes cannot be reproduced by rule, so the two requirements that were quietly
conflated are split. `DEFAULT_BRAND` stores the designed values verbatim, which is why the
site cannot change; every derived token also carries its rule, and the four that are designed
rather than computed recompute the moment a source changes, because that moment is a rebrand
and a coherent family is the point. The property test still guarantees that any rule's output
passes its contrast requirement for any sources.


## Phases

| Phase | Lands | Gate |
|---|---|---|
| **1a** | The five pure modules and their tests, plus the root layout emitting `brandCss(DEFAULT_BRAND)`. No stylesheet is restructured. ADR-065 and the BRD §3.2 amendment land here. | **The emitted block re-states the values Tailwind already emits**, proven token by token against a fixture taken from the pre-change files, plus the reverse assertion that every `var(--…)` read anywhere is defined. |
| **1b** | The Appearance global, the screen, the access rules, the revalidation, **and the "what will not follow" panel**. | An admin changes primary and the site follows. A non-admin can neither read nor write the global. Nothing stale goes unnamed. |
| **1c** | The surfaces library, the gradient reproduced and registered, `Section` taking a set by name. | Existing pages keep their look through the default keys. |
| **1d** | The raster cleanup: an SVG logo inheriting the token, the e-mails reading the brand at send time, the favicon and PWA colour generated. | A brand change leaves nothing stale except what 1b's panel already names. |
| **2** | The `background` select on each home section tab and each page block, reading the library. | An editor sets the FAQ section to Sea mist and it renders, with its text tone. |

## Testing

- **Property test on the derivation.** For any four source colours drawn at random, every
  derived pair passes its required ratio. This is what turns "we promise AA" into something
  mechanical. A rule will be broken deliberately to watch the test fail before it is trusted.
- **Unit**: `css.ts` output, the gradient serializer, `darkenUntil` convergence and its
  behaviour when no solution exists (a requirement that cannot be met is reported as a failure, never raised and never looping).
- **Config test**: the global obeys the panel's rules (both languages on every label and
  description, the icons, the group, the description cap).
- **Outsider test**: the public credential can neither read nor write the Appearance global, per
  the standing rule after the 28-function leak.
- **e2e**: change a colour in the panel, assert the site's computed styles moved; axe at 1440
  and 390 in both languages on a themed section; the CLS gate holds for every family in the
  curated list.
- **Phase 1a**: two gates. Anchored equality (`brandCss(DEFAULT_BRAND)` against a checked-in fixture of the pre-change stylesheet) and the reverse assertion that every `var(--…)` read anywhere is defined. The visual check is the repo's existing `scripts/dev/golden.mjs` and runs when a database does.

## Risks

| Risk | Handling |
|---|---|
| A brand save must invalidate every cached page | `afterChange` revalidates the layout; brand changes are rare so the cost is acceptable |
| A derivation that cannot satisfy its requirement would throw inside the root layout | `SiteDocument` renders every page **and the global 404**, so a throw there takes the whole site down. `derive()` returns a result (`{ ok: true, value }` or `{ ok: false, failures }`) and `brandCss` falls back to `DEFAULT_BRAND` and logs rather than propagating, matching the project's standing rule that a failure degrades rather than cascades (ADR-061, `routeFailure()`). The editor's refusal happens in the validator, long before a render. |
| `src/lib/tokens.ts` is a third source of truth | `BRAND_PRIMARY_HEX` and `TOKEN_HEX` feed the viewport theme colour, the manifest, the OG image builder and the static 410 page, all rendered outside the Tailwind pipeline, and `tests/tokens.test.ts` keeps them in sync with `globals.css`. Phase 1b decides its fate: either it becomes a reader of the Appearance global, or it is declared "does not follow" and named in the 1b panel. It cannot be left unmentioned. |
| The gradient's exact colours | Dhia did not supply the source PNG before going away. It will be reproduced from the image as shown in the conversation and flagged for confirmation on their return; the value is one row in the library, so refining it later is a field edit, not a code change. |
| A curated family without a tuned fallback regresses CLS | Each family ships with its own metric overrides and its own subset from `scripts/subset-fonts.sh`; the CLS e2e covers all of them |
| Weight preloading is per page today (Regular and Medium everywhere, Black on the home hero, Bold where the H1 is bold, ADR-010) | The preload list is derived from the chosen family rather than hardcoded, or switching family preloads files that no longer exist |

## Open, for Dhia on return

1. Confirm the gradient match against the original.
2. Confirm the curated font list.
3. Whether the site's logo should also become an upload, or stay a repo asset with only the
   admin's copy made themeable.
