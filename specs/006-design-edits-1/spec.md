# Feature Specification: Design edits 1 — Dhia's review of Level 1 + 2a

**Feature Branch**: `design/edits-1` · **Created**: 2026-09-13 · **Status**: Implemented (pending Dhia's review)

**Input**: Dhia's design review (2026-09-13) after seeing the site: the home page is mostly
fine; About and How We Work feel basic; the product page is too long; the designer, video,
WhatsApp widget, number formatting and riyal symbol need specific changes. Answers to the
three steering questions: About = existing copy + visuals; How We Work = a connected visual
flow; video overlay = the current section copy. Every departure from the BRD is recorded
(ADR-035…038) and the BRD sections are amended.

## User Scenarios & Testing

### US1 — Product cards show two colours and flip (P1)
On `/products` and in the related cards of a product page, a card shows the first two colour
swatches (one for the tote); the home strip keeps its expand-on-hover panels (CTO call,
parked in IDEAS). Hovering a swatch previews that colour; clicking a swatch makes it the active colour
(white by default). Hovering the photo shows the back of the **active** colour when it has
one; leaving restores the front. Keyboard: swatches are buttons inside the card link area,
focusable, `aria-pressed` on the active one; the card link keeps its single accessible name.
Nothing here navigates except the card link.

### US2 — Product page: shorter, description beside sizes (P1)
The gallery keeps thumbnails and the hover/keyboard flip but loses the «صورة n من 4»
counter and its callout; description + specs and the size chart share one section, side by
side from `md` (description/specs on the start side, size chart on the end side), stacked on
phones; section paddings tighten; the sticky mobile bar and the related products stay.

### US3 — Designer: compact, one colour, upload on the product (P1)
The home designer shows every product in white (the tote in beige) — no colour picker. The
printable area itself is the upload target: an empty area shows the prompt «اضغط لرفع
شعارك أو صورتك» and a click (or keyboard activation) opens the file picker; drag-and-drop
still works. A placed design shows an «×» control on hover/selection that removes it and
returns the prompt. The print-area outline and the design's handles render only while the
pointer is inside the canvas (or the design is selected via keyboard); otherwise the mockup
reads as a clean preview. The pricing controls and results stay, in a tighter layout.

### US4 — Video section becomes a looping background (P1)
The section plays the marketing video muted, looping, inline, with the current title and
lead (and the register CTA) overlaid on a dark gradient. Under `prefers-reduced-motion`,
`Save-Data`, or when the video cannot play, the poster shows instead with the same overlay.
No click-to-play control; the video is decorative (`aria-hidden`), the text carries the
meaning.

### US5 — Global: widget side, number grouping, riyal size (P1)
The WhatsApp widget sits at the bottom-left (the logical start side of this RTL site) and
its button does not move when the panel opens (the panel anchors above the button). Every number ≥ 1 000 renders with
thousands separators (Western digits, `1,234`) — profit figures, prices, stats, the
calculator's monthly figures. The riyal symbol renders about 15 % smaller than today next to
its digits, everywhere `SarAmount` is used.

### US6 — About page redesigned with the existing copy (P2)
Keeps every BRD string. New structure: a header with the brand photo (`lifestyle/
hanging-tshirt-mockup.jpg`) and the story as a two-column feature; a facts band with four
figures from BRD 1.1 (delivery within 5 days, 30 SAR welcome credit, 0 stock, from Jeddah);
the three value cards as a staggered grid with the 3D icons; the MISK credential as a
highlighted card with the logo; the location line as a closing band. Same copy, verbatim
test unchanged.

### US7 — How We Work: a connected visual flow (P2)
The five steps render as one journey: the 3D icons on a connected path (horizontal on
desktop, vertical on phones) with a scroll-driven progress line (CSS scroll-timeline where
supported, static line otherwise; reduced motion → static), number/title/text beside each
icon; the profit equation follows as a highlighted card. Copy unchanged.

### US8 — Nothing else regresses (P1)
All Level 1/2a e2e suites, Lighthouse on the five URLs (home JS budget included), axe,
RTL class check and the verbatim tests stay green; the CMS-backed reads are untouched.

## Requirements
- FR-001 `ProductCard` gains client-side colour/flip state (small client island; the card
  stays server-rendered with the first colour for no-JS); swatches limited to two; used by
  the listing and the related cards (the home strip is unchanged).
- FR-002 Gallery counter removed (the live region can announce the thumbnail label instead);
  `product-page.tsx` combines description/specs and size chart in one `Section` with a
  responsive two-column grid; tone alternation adjusted.
- FR-003 Designer: `product-picker` shows products without the colour row; the canvas
  overlay (`design-canvas.tsx`) owns the upload prompt (a `<label>`/button over the print
  area) and the remove control; edit chrome toggled by pointer-in / selection state; the
  dropzone component is removed; layout compacted (controls beside the canvas from `md`).
- FR-004 Video: poster + overlay server-rendered; a lazy client component adds `<video loop
  playsinline preload="none">` with `muted` set as a property before `play()`;
  `prefers-reduced-motion: reduce`, `navigator.connection?.saveData` and a rejected `play()`
  keep the poster; a fixed scrim keeps the copy at AA on every frame; JS-off shows the
  poster + overlay.
- FR-005 Widget: `start-6` (logical), panel anchored `bottom-full start-0` on the same
  fixed dock; e2e updated. `formatNumber()` helper (`Intl.NumberFormat('en-US')` grouping,
  no decimals unless present) used by `SarAmount` and every displayed figure — never by
  form inputs; `SarSymbol` default `height="0.85em"`.
- FR-006 About/How We Work rebuilt from existing primitives (`Section`, `SectionHeader`,
  `Card`, `Reveal`); no new dependency; images through `next/image`.
- FR-007 Docs: ADR-035 (product card colour state), ADR-036 (designer upload-on-product,
  single colour), ADR-037 (video muted loop; constitution V bump), ADR-038 (widget
  bottom-left as the logical start, number grouping, riyal size); BRD §3.7, §3.11, §4.8,
  §4.9, §6.4.3, §6.4.5, §6.6, §6.15 amended; Appendix G rows for the two new strings.
- FR-008 Tests: unit (`formatNumber`, card colour state reducer, designer overlay state);
  e2e updated for the widget side, the gallery, the designer upload path, the card flip,
  the video element; screenshots of About and How We Work on desktop and iPhone for Dhia.

## Success Criteria
- SC-001 Dhia reviews the pages on :3004 and approves; every item of the review is visibly
  addressed.
- SC-002 Gates green; home JS budget within 180 kB; Lighthouse unchanged or better.
