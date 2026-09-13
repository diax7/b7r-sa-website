# Tasks: Design edits 1

**Input**: `plan.md` (CTO plan review 2026-09-13, 93 GO). **Branch**: `design/edits-1`.

## Phase A — global + product surfaces (CTO code review 88 → revisions folded into B)
- [x] A1 `formatNumber` + `SarAmount`; riyal symbol 0.85 em; unit tests.
- [x] A2 WhatsApp widget at the inline end (bottom-left), panel anchored above the button; e2e.
- [x] A3 Product card island: stretched name link, two 44 px swatches, card-hover flip paused
  while previewing; listing + related cards; e2e.
- [x] A4 Product page: one-photo gallery with hover/tap/arrow flip, front/back pills, swatches;
  description + specs + size chart in one section; e2e.

## Phase B — designer + video (CTO code review 88 → revisions folded into C)
- [x] B1 Designer: one colour per product, print-area upload target (focusable input +
  prompt), «×» remove (44 px, inert while hidden), edit chrome on mouse-hover or selection,
  touch keeps selection, drag-and-drop on the mockup, sample link, compact layout, static
  fallback; `upload.ts`; object URLs revoked by one effect; `role="img"` on the picture only.
- [x] B2 Video: server-rendered poster + copy + CTA over a scrim; lazy muted loop with poster
  fallbacks; `video_play` retired; e2e.
- [x] B3 CI warm-up in Playwright's `globalSetup`.

## Phase C — About + How We Work + docs
- [x] C1 About redesign (photo beside the story, facts band from existing strings, 3D-art cards,
  MISK tint card); e2e.
- [x] C2 How We Work journey (connected path, numbered 3D icons, scroll-driven progress line,
  profit card); e2e.
- [x] C3 Axe scans the mounted home islands; target-size assertions.
- [x] C4 ADR-035…038, constitution 1.1.0, BRD §3.7/§3.11/§6.4.3/§6.4.5/§6.5/§6.6/§6.7/§6.8/§6.15
  + §6.16 events, Appendix G row 17, IDEAS; screenshots for Dhia; CTO review; PR.
- [x] C5 CTO revisions (89 → 94 GO): the flow line's view timeline named on the track and static
  under reduced motion; the About facts band from the why-us pairs; the upload prompt fits the
  print area on every stage (container queries).

## For Dhia's review on :3004
- The designer starts with an empty print area and the upload prompt (the sample is one click
  away); the earlier build pre-placed the sample — say which you prefer.
- The home strip keeps its expand-on-hover panels (the two-swatch cards are on `/products`
  and the related cards).
