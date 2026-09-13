# Feature Specification: Phase 1b: Rest of the home page

**Feature Branch**: `phase/1b-home` · **Created**: 2026-09-13 · **Status**: Draft

**Input**: BRD §12.2 Phase 1b: steps (§6.4.4), video (§6.4.5), why us (§6.4.6), testimonials in
placeholder mode (§6.4.7), integrations (§6.4.8), home FAQ (§6.4.9), WhatsApp widget (§6.15),
consent bar and analytics (§6.16), newsletter (§6.14), events. Copy from §4.4–§4.7. Plus the
Phase 1a carry-over: simulated LCP on `/` above the 2.5 s gate.

**DoD (BRD §12.2)**: §6.18 items 7 (newsletter part), 8, 9, 10, 11, 12; Lighthouse and CWV
budgets on `/` with everything enabled; reduced-motion audit; e2e for the widget, consent,
and newsletter.

## User Scenarios & Testing

### US1: The merchant understands the model in three verbs (P1)

Below the designer, «ثلاث خطوات وتبدأ» shows three steps. On desktop the section pins while
the visitor scrolls through it: the active step lights up (badge filled primary, 100 %
opacity, accent progress line) and the 3D icon panel crossfades between the three icons.
On mobile it is a plain vertical list with 96 px icons and a connector line. Under reduced
motion, desktop renders the mobile list.

Acceptance:
1. Given desktop, when scrolled 0 / 40 / 75 % through the section, then step 1 / 2 / 3 is
   active and the matching icon is shown; the pin releases cleanly after the section.
2. Given JS disabled, then the three steps' titles and texts are readable in order.
3. Given reduced motion on desktop, then no sticky pin and all three icons are visible.
4. The link «اعرف أكثر عن طريقة العمل» points to `/how-it-works`.

### US2: The merchant watches how printing works (P2)

«شاهد كيف نطبع طلبك» with a 16:9 frame, poster, and a 72 px play button. Click plays the
self-hosted MP4 with sound and native controls; no autoplay, no loop; `video_play` tracked.

Acceptance: poster visible before play; `<video preload="none" playsinline>`; after click,
`controls` present and the video is playing; the poster image has Arabic alt.

### US3: The merchant sees the three proof points and social proof (P2)

«لماذا يختارنا التجار؟» renders three cards (ShieldCheck / Workflow / Zap). «تجار بدأوا معنا»
renders the three sample cards each with a visible «نموذج» badge and `data-placeholder`,
and the whole section is omitted on the production host while every entry is a placeholder.

Acceptance: three why-us cards with the exact §4.4 strings; testimonials visible with badges
on the preview host; absent when `NEXT_PUBLIC_SITE_URL=https://b7r.sa`; mobile snap carousel.

### US4: The merchant confirms the integrations and gets answers (P1)

«اربط متجرك بضغطة واحدة» shows three tiles (سلة, زد, شوبيفاي) with the official logos and the
«متاح الآن» badge; not links. «الأسئلة الشائعة» is a single-open accordion with the five
homepage items and the «كل الأسئلة» link to `/faq`.

Acceptance: 3 tiles fit in a row at 360 px; accordion buttons carry `aria-expanded`, only one
open at a time, chevron rotates, answers ≤ 35 words; `faq_open` tracked with the question.

### US5: The merchant reaches a human on WhatsApp (P1)

A green floating button at the physical bottom-right appears 1.5 s after load; a dot pulses
once 6 s after load, once per session. Click opens a 320 px card (header «بحر برنت / فريق
الدعم», greeting bubble «أهلاً 👋 كيف نقدر نساعدك؟», button «ابدأ المحادثة») that opens
`https://wa.me/966501699572?text=<encoded «مرحباً، أرغب بمعرفة المزيد عن بحر برنت.»>` in a new
tab. Escape and outside click close. No hours, no reply-time promise, no online indicator.

Acceptance: button is at the physical right in RTL; `whatsapp_click{location:"widget"}`
tracked; on mobile the popup is `calc(100vw - 32px)` wide; keyboard operable.

### US6: Analytics respects consent (P1)

Umami loads on every page without consent. A consent card appears 800 ms after load at the
bottom-end (left in RTL) with the §4.7 text and «موافق» / «رفض» / «سياسة الخصوصية». Consent
Mode v2 defaults are denied before any script. «موافق» sets `b7r_consent=granted` (180 days),
updates consent, and loads GA4; «رفض» sets `denied` and GA never loads. On later visits the
cookie is respected and no bar shows. The bar never blocks scrolling; on mobile it sits above
the WhatsApp button with 88 px clearance.

Acceptance: no `googletagmanager.com` request before consent; one after «موافق»; cookie
values and expiry; no bar on reload; Umami script tag present in both states (when
`NEXT_PUBLIC_UMAMI_SRC` is set); the `gtag('consent','default', …denied)` call is in the
initial HTML.

### US7: The merchant subscribes to the newsletter (P2)

The footer form posts to `POST /api/newsletter`. Valid email → «اشتركت. سنرسل لك الجديد فقط.»;
invalid → «أدخل بريداً إلكترونياً صحيحاً.»; honeypot filled → 200 with no side effect; 6th
request from one IP in 10 minutes → 429; duplicates → `ok: true`. `newsletter_submit` tracked.

Acceptance: e2e for each path (success via a mocked Resend transport); the button disables
while submitting; messages are announced with `aria-live`.

### US8: Every CTA and outbound click is measured (P2)

`track()` sends to Umami always and to GA4 when granted. Server-rendered links carry
`data-track` / `data-location`; a single document listener converts clicks into events, and
any link to `b7r.app` emits `outbound_app_click{href}`.

### US9: Performance holds with everything enabled (P1)

Lighthouse mobile on `/` stays ≥ 90 / 95 / 95 / 100; CLS ≤ 0.1; JS ≤ 180 kB gzip on first
paint (widgets, consent, video, steps, accordion, analytics bridge all lazy or tiny);
simulated LCP investigated with a time box and the outcome recorded.

## Requirements

- FR-001 Steps section per §6.4.4 with server-rendered list and a small scroll-progress
  island; no scroll-jacking.
- FR-002 Video section per §6.4.5; poster = `dtg-printer-stock` fallback (ffmpeg unavailable
  in the build environment; BRD permits it), documented in RUNBOOK.
- FR-003 Why-us, testimonials (placeholder rule), integrations, FAQ per §6.4.6–§6.4.9.
- FR-004 WhatsApp widget per §6.15; the one sanctioned physical `right` with `rtl-allow`.
- FR-005 Consent bar + Consent Mode v2 + Umami + GA4 per §6.16; `lib/consent.ts`.
- FR-006 `POST /api/newsletter` per §6.14 with `lib/rate-limit.ts`, honeypot, Resend audience;
  server-only env (`RESEND_API_KEY`, `RESEND_AUDIENCE_ID`) validated in `lib/env-server.ts`;
  unconfigured → `503 { ok:false, error:'not_configured' }` and the §4.5 error text.
- FR-007 Analytics bridge: `registerSink` for Umami and GA4; delegated click tracking;
  `outbound_app_click`.
- FR-008 `Accordion`, `VideoPlayer`, `WhatsAppWidget`, `ConsentBar`, `NewsletterForm`
  primitives added to the inventory; `Reveal` used on section content.
- FR-009 Remove `PlaceholderSection` (no placeholders remain on `/`).
- FR-010 Reduced-motion audit: e2e with `reducedMotion: 'reduce'` asserting no hero
  auto-advance, static waves, list-mode steps, no count-up, instant accordion.

## Success Criteria

- SC-001 §6.18 items 8, 9, 10, 11, 12 pass; item 7 newsletter part passes with the mocked
  transport and with the real API's validation/honeypot/rate-limit paths.
- SC-002 Lighthouse mobile `/`: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95,
  SEO = 100; CLS ≤ 0.1; JS on first paint ≤ 180 kB gzip.
- SC-003 axe zero serious/critical on `/` in all three projects with every section mounted.
- SC-004 LCP outcome recorded in ADR-010 (met, or the specific blocker and the 1c/2 plan).

## Out of scope

Products/other pages, SEO layer beyond `/`, contact API, sitemap/redirects, OG images (1c).
CranL deploy and GitHub push (await Dhia).
