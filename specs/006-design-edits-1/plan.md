# Implementation Plan: Design edits 1

**Branch**: `design/edits-1` (from `main` after the 2a merge) | **Date**: 2026-09-13 |
**Spec**: `specs/006-design-edits-1/spec.md`
**CTO plan review**: 2026-09-13, 86 → revised below (lazy client video with `muted` set as a
property, touch-safe designer selection, stretched-link card markup, constitution V bump +
BRD §3.7/§6.6, home strip left out, logical widget position, verbatim facts strings, video
scrim, `formatNumber` on displayed values only, focusable upload input).

## Summary

Dhia's design review, item by item, without new dependencies and without touching the CMS
data layer: product cards with two swatches and hover flip; a shorter product page with
description and sizes side by side; a compact single-colour designer whose print area is the
upload target; a looping background video with the copy overlaid; the WhatsApp widget at the
bottom-left and anchored; thousands separators and a smaller riyal symbol everywhere; About
and How We Work rebuilt from the existing copy and primitives. Every BRD departure gets an
ADR and a section amendment. Delivered in three reviewed phases and shown to Dhia on :3004.

## Technical Context

No new packages. Client islands stay lazy where they are today (designer, gallery); the
product card gains a small `'use client'` island for swatch/flip state (~1 kB) on the listing
and related cards only (the home strip keeps its expand-on-hover panels — two hover
behaviours in one element would fight; noted in IDEAS). Video is the existing
`public/video/printer-marketing.mp4` (1.3 MB) + poster: the server renders poster + overlay
(the no-JS state) and a small client component mounted by `NearViewport` creates the
`<video>` with `preload="none"`, sets `el.muted = true` as a property (React omits the
attribute in SSR) before `play()`, and keeps the poster when `play()` rejects, under
reduced motion or `saveData`; nothing is fetched above the fold, so LCP and Lighthouse are
untouched and the home JS budget test guards the rest. Scroll-driven progress on How We Work uses CSS `animation-timeline:
view()` with a static fallback (no JS), matching ADR-012.

## Constitution Check

| # | Gate | Pass? |
|---|---|---|
| I | RTL | Widget moves to `start-6` (logical; bottom-left in this RTL-only site) — BRD 6.15's physical exception is retired in ADR-038; everything logical, `check:rtl` clean |
| II | Static | All server-rendered; islands hydrate later |
| III | Copy | New strings: the upload prompt «اضغط لرفع شعارك أو صورتك» and the remove control «إزالة التصميم» → Appendix G rows for Dhia (and recorded for the 2b `home` seed); the About facts band reuses the hero proof chips / why-us strings verbatim (no new labels); About/How-we-work strings unchanged (verbatim tests) |
| IV | Budgets | Home: the video loop is a lazy ~1 kB island below the fold; the card island stays off the home route (listing + related only); budget test enforces 180 kB; LH five URLs |
| V | Tokens | Existing tokens. The muted marketing loop is a deliberate departure from "no continuous animation except the waves": constitution V gets a MINOR bump naming `VideoSection` (muted, decorative, lazy, poster under reduced motion / Save-Data) and BRD §3.7 + §6.4.5 are amended (ADR-037) |
| VI | No fabrication | About facts band uses BRD 1.1 numbers only |
| VII | Modules | Changes stay inside `modules/{products,designer,home,pages,core}` and `components/shared` |
| VIII | ADRs | ADR-035…038; constitution 1.1.0 |
| IX | Tests | listed per phase |
| X | No attribution | Yes |

## Approach

### Phase A — global + product surfaces
- `components/shared/format-number.ts`: `formatNumber(n)` → `Intl.NumberFormat('en-US')`
  grouping with the integer / two-decimal rule; `formatSarDigits` uses it. Displayed values
  only — never the `Input`/`Stepper` values (`type=number` rejects grouped strings). Unit
  test: 999 → `999`, 1000 → `1,000`, 89.5 → `89.50`, 1234567 → `1,234,567`. Every displayed
  number (`results-card`, sticky bar, stats) goes through it.
- `SarSymbol`: `height="0.85em"`, `width` scaled (0.76em), `align-[-0.06em]`; visual check
  on the product page, strip, calculator and sticky bar.
- WhatsApp widget: dock `start-6` (logical — bottom-left in RTL, no `rtl-allow`; BRD 6.15
  amended, ADR-038 retires the physical exception), panel `absolute bottom-full mb-3
  start-0` inside the dock so the button never moves; e2e `widgets.spec.ts` updated
  (bottom-left, button rect unchanged after open).
- Product card (`modules/products/product-card.tsx` → server shell + `product-card-media.tsx`
  client island): stretched-link markup — the card is `relative`, the heading holds the
  `<Link className="after:absolute after:inset-0">` named by the product, swatches sit
  `relative z-10` above it as `<button>`s with `aria-pressed`; `onMouseEnter` previews,
  `onClick` sets active; image pair per colour with the hover flip bound to the active
  colour (`group-hover`); no-JS renders the first colour front/back as today. Used by the
  listing and the related cards only. E2E: hover swatch → `src` changes; click → persists;
  hover image → back photo visible; axe link-name clean.
- Product page: gallery without the counter (thumbnail buttons keep `aria-label`s; the live
  region announces the active thumbnail label); one `Section` for description + specs +
  size chart (`grid md:grid-cols-[3fr_2fr] gap-10`), tighter `pt/pb`; tones re-sequenced;
  e2e `products.spec.ts` updated (counter gone, `dl` + `table` in one section).

### Phase B — designer + video (home)
- Designer: remove `ColorPicker` and `DesignDropzone`; `initialState` colour = white (tote:
  its only colour), no design placed (the print area shows the prompt; «جرّب تصميماً
  جاهزاً» in the controls places the sample); `DesignCanvas` gets `onUploadRequest`,
  `onRemove`, `selected` props: over the empty print area an `<input type="file">` that is
  visually hidden but focusable (never `display:none`) with a `<label>` as its visual — the
  prompt, a focus ring on the print area, Enter/Space opens the picker; drag-and-drop stays
  on the canvas. With a design placed, one «×» button (`aria-label="إزالة التصميم"`) at a
  fixed spot, the top-end corner of the print area, visible while chrome is visible. Chrome
  (print-area rect + transformer) shows while `hover (mouse) || selected`; `selected`
  clears on a tap/click outside the design or on «×», and on `pointerleave` only when
  `pointerType === 'mouse'` — touch keeps its selection. Layout: `md:grid-cols-[1.1fr_1fr]`
  canvas + controls, results card under the controls; mobile unchanged (sticky results
  bar). The static fallback (`designer-static.tsx`) mirrors the new layout. E2E
  `designer.spec.ts` updated (upload via the print-area input, remove via «×», bounds hidden
  until hover; Pixel 7: tap the design → handles visible, tap outside → hidden);
  `csp.spec.ts` upload path updated.
- Video: `VideoSection` server component renders the poster (`next/image`) + the copy and
  register CTA on a fixed scrim (`bg-navy/60` behind the text block, plus the gradient, so
  AA holds on every frame — axe cannot measure text over video) inside the existing
  section; `NearViewport` mounts `video-loop.tsx` (client), which creates `<video loop
  playsInline preload="none" poster>` over the poster, sets `muted = true` as a property,
  calls `play()`, and unmounts itself (poster stays) when `play()` rejects, under
  `prefers-reduced-motion: reduce` or `navigator.connection.saveData`; `aria-hidden`.
  `video-player*.tsx` and the `video_play` event go (BRD §6.6 amended, analytics e2e list
  updated). E2E: after scrolling into view a `video` exists with `loop`, `muted === true`
  and `paused === false`; under `reducedMotion: 'reduce'` no `video` element; the poster
  and copy are in the SSR HTML.

### Phase C — About + How We Work
- About: header (`Section` surface) with a two-column feature — brand photo (`next/image`,
  `hanging-tshirt-mockup.jpg`, `priority`, explicit `sizes`, ≤ 220 kB) and the story; facts
  band (ground tone) built only from strings the BRD already has — the hero proof chips
  («مجاني 100%», «بدون حد أدنى للطلبات», «توصيل لكل المملكة خلال 5 أيام») and the welcome
  credit as `SarAmount value={30}` with the hero microcopy — no new labels; the three value
  cards as a staggered grid with the 3D icons (`icons-3d`), `Reveal`; MISK credential card
  with the logo on a primary-tint surface; closing band with the location line and the
  register CTA. Verbatim test untouched (same strings).
- How We Work: the five steps as a connected flow — a `<ol>` with a decorative path
  (`::before` line, `animation-timeline: view()` progress on `@supports`, static
  otherwise), the 3D icon in a circular frame, number/title/text; horizontal from `lg`
  (5 columns, path across the top), vertical stack on phones; profit equation as a
  highlighted card (primary tint) with the example line; the rest of the page unchanged.
  E2E `pages.spec.ts` updated for the new landmarks; axe on both pages.
- Screenshots (desktop + iPhone) of both pages attached to the PR for Dhia.

### Docs
ADR-035…038; constitution 1.1.0 (principle V names the muted loop); BRD amendments (§3.7
motion rule, §3.11 riyal size + number grouping, §4.8/§4.9 page structure notes, §6.4.3
designer, §6.4.5 video, §6.6 product page + the retired `video_play` event, §6.15 widget);
Appendix G rows for the two new strings (also listed for the 2b `home` seed); IDEAS (colour
picker parked; home strip swatches parked).

## Judgment calls
- Video is decorative and muted; text stays HTML for SEO/a11y; poster under reduced motion.
- Product card swatches are buttons, and interactive content inside `<a>` is invalid HTML →
  stretched-link pattern: the heading's link carries the name and covers the card with a
  pseudo-element; swatches sit above it. The home strip is out of scope (two hover
  behaviours in one panel; parked in IDEAS) unless Dhia names it.
- The designer keeps drag-and-drop and the sample design button (moved into the controls
  column) — the spec asks for click-to-upload, not less.

## Open items for Dhia (do not block)
None — every input is in hand (copy stays, assets exist).
