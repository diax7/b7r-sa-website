# Tasks: Phase 1b: Rest of the home page

**Input**: `plan.md` (CTO GO 92/100, 2026-09-13). **Branch**: `phase/1b-home`.

- [x] T001 `modules/core/lazy-mount.tsx` (`NearViewport`, `AfterDelay`); `DesignerLoader` refactored onto it.
- [x] T002 Steps: server list + `StepsProgress` island + CSS (list default; pinned under `html.js` at `lg`; reduced motion → list); `tests/steps-progress.test.ts`.
- [x] T003 Video: section + `VideoPlayer` (mounts `<video>` after play) via client loader; poster from the BRD fallback still; MP4 in `public/video`.
- [x] T004 Why us, Testimonials (`shouldRenderTestimonials`, `tests/testimonials-rule.test.ts`), Integrations (official logos), Home FAQ + `components/ui/accordion.tsx` via client loader.
- [x] T005 WhatsApp widget (physical bottom-right, `--bottom-dock`), consent bar, `AnalyticsBridge` (sinks, delegated clicks, granted-on-reload), Consent Mode v2 default script, Umami script, `PageExtras`.
- [x] T006 Newsletter: `lib/rate-limit.ts` (+ tests), `lib/consent.ts` (+ tests), `lib/env-server.ts`, `lib/newsletter-transport.ts` (live/mock/off, duplicate rule), `POST /api/newsletter` (JSON + Origin check, honeypot, 429), `NewsletterForm`, footer slot, health field.
- [x] T007 `page.tsx` composed; `PlaceholderSection` and its copy removed.
- [x] T008 Designer static replica as the fallback (height-matched on all breakpoints, no shift on mount).
- [x] T009 E2E: `home-sections`, `widgets`, `newsletter` (single project, serial, per-test IPs), `reduced-motion`; budgets unchanged. 116 passed / 0 failed.
- [x] T010 LCP time box → ADR-014; font subsets tightened; logo `sizes`; islands out of first-paint JS (176 kB).
- [x] T011 BRD amendments (§8.1, §6.4.7, Appendix G 8/10) + ADR-012…015 + RUNBOOK + IDEAS.
- [x] T012 Gates, commit, CTO code review (94/100 GO), squash-merge to `main`.
