# Design review — Phase 1a (hero, product strip, designer)

Date 2026-09-13 · Build `phase/1a-foundation` · Viewports: 1280 desktop, Pixel 7, iPhone 15.
Method: the `design-review` checklist (first impression, design-system extraction, 10-category
audit, AI-slop blacklist) applied to the rendered site with Playwright screenshots.

## First impression (desktop)

The site communicates a calm, premium Saudi brand: one typeface, one blue, a lot of white.
The eye goes to (1) the H1 «علامتك التجارية تبدأ من قطعة واحدة», (2) the primary button,
(3) the man in the black tee. That is the intended order. One word: composed.

## Inferred design system (rendered)

- Fonts: ITF Rayat Round only (five weights, subset). No default stacks.
- Colours: the BRD tokens only (primary, accent, navy, ground, text, muted, border); no raw
  hex in components (`check:rtl` enforces it).
- Type scale: display / h2 / h4 / lead / body / small / caption as BRD 3.3, `text-wrap:
  balance` on headings, tabular figures on money.
- Radius: 13 px family with 20 px media and pill chips; 6 px inner.
- Motion: crossfade 700 ms, rise 300–400 ms, strip expand 500 ms, waves 20 s; all reducible.

## AI-slop blacklist

| Pattern | Present | Note |
|---|---|---|
| Purple/blue-to-purple gradients | No | Single hue; only the hero legibility overlay (white → transparent, BRD 3.2) |
| 3-column icon grid | No | (BRD 6.4.6 asks for three why-us cards in 1b; build them with restraint) |
| Icons in coloured circles as decoration | No | Check icons in chips are functional proof marks (BRD 6.4.1) |
| Centred everything | No | Start-aligned throughout; only the ribbon is centred (BRD 6.3.1) |
| Uniform bubbly radius | No | 13 / 20 / pill / 6 hierarchy |
| Blobs / wavy dividers | Brand motif only | The sea wave at the ribbon edges is the BRD 3.1 motif, ≤ 12 px amplitude, nowhere else |
| Emoji as design | No | |
| Coloured left borders | No | |
| Generic hero copy | No | BRD 4.4 verbatim |
| Cookie-cutter rhythm | No | Hero → strip → designer differ in structure |

## Findings and fixes

- FINDING-001 (medium, designer) — product chip thumbnails used the white variant on a white
  chip; switched to the darker variant like the strip. Fixed in the build commit.
- FINDING-002 (medium, hero mobile) — copy sat mid-screen; moved into the top half per BRD
  6.4.1 with the proof chips on one scrolling row. Fixed.
- FINDING-003 (polish, footer) — payment badges shipped with 60 % transparent padding and
  rendered tiny; trimmed in the asset pipeline, trust badges on white tiles. Fixed.

- NOTE (hero desktop) — the legibility overlay runs to 55 % of the width at 0.85 opacity
  (BRD 6.4.1 says 45 %) so the headline stays readable over the placeholder photos' busy
  right third; it ghosts the hoodie and cap. Revisit when the final photos arrive.

No open findings on the three built sections. Placeholder sections are labelled and empty
by design (BRD 12.2).

## Litmus

Brand unmistakable in the first screen: yes. One visual anchor: yes (H1 over the photo).
Scannable by headlines: yes. One job per section: yes. Cards necessary: yes (designer card
is the interaction). Motion improves hierarchy: yes (strip expand, hero crossfade). Premium
without shadows: yes (hairlines carry the layout).
