# Tasks: Phase 1c: Pages, SEO layer, cutover readiness

**Input**: `plan.md` (CTO review 2026-09-13). **Branch**: `phase/1c-pages-seo`.

## Machine layer first (everything else sits on it)
- [x] T001 `lib/security-headers.ts` (full CSP incl. `style-src`, HSTS, nosniff, referrer, permissions, XFO, `Content-Language` on page routes) + `next.config.ts` `headers()`; `tests/security-headers.test.ts`.
- [x] T002 `lib/redirects.ts` (§5.2 map, sources without trailing slash, `/en` exact then `/en/:path*` 302, 410 patterns) + `next.config.ts` `redirects()`; `src/proxy.ts` with matcher limited to the 410 patterns and the cached Arabic 410 body; `tests/redirects.test.ts`.
- [x] T003 `app/sitemap.ts`, `app/robots.ts` (full §7.2), `app/manifest.ts`, `app/indexnow/[key]/route.ts`, `lib/indexnow.ts`, `scripts/indexnow.ts`; `tests/sitemap.test.ts`.
- [x] T004 `lib/env-server.ts` `assertProductionEnv()` + `instrumentation.ts` gated on `B7R_RUNTIME=production`; `/api/health` reports every integration; `.env.example`; `tests/env-server.test.ts`.
- [x] T005 `modules/core/seo/json-ld.ts` builders + `JsonLd`; `buildMetadata` extended (OG type/images, verification metas, product/post variants); home gets `OnlineStore` + `WebSite`; `tests/json-ld.test.ts`.

## Pages
- [x] T006 `modules/products`: `ProductCard`, `/products`, `/products/[slug]` (Breadcrumbs, Gallery island, price block, SpecList, SizeChart, RelatedProducts, ProductStickyBar, `product_view`), JSON-LD `ItemList`/`Product`/`Offer`/`BreadcrumbList`.
- [x] T007 `modules/pages`: how-it-works, about, faq (sticky group nav), legal (`lib/markdown.ts` with `marked`, `section-{n}` ids, `OnThisPage`, `Prose`), `WebPage` + `BreadcrumbList`.
- [x] T008 `modules/forms/contact`: `Select` (Radix), `Textarea`, `Turnstile` island (execute on submit), `ContactForm`, schema, `lib/phone.ts`, `lib/contact-transport.ts`, `POST /api/contact` (order per plan), booking card; `tests/contact-schema.test.ts`, `tests/phone.test.ts`.
- [x] T009 `modules/blog`: three sample bodies (`ux-araby`, `sample: true`), hub filter island, post cards, post template, `ShareButtons`, `BlogPosting` JSON-LD, reading-time helper + test.
- [x] T010 `scripts/build-og.ts` → `public/og/default.png` + `public/og/products/*.png`; `tests/og-images.test.ts`; favicon set verified.

## Verification and docs
- [x] T011 E2E: `routes`, `redirects`, `products`, `contact` (single project, serial, per-run IPs), `blog`, `legal`, `machine-files`, `csp`; axe on every route; budgets on product/contact/post; LHCI five URLs.
- [x] T012 BRD amendments (§7.3, §7.6, §8.10) via `docs/brd-sections` + `build-brd.py`; ADR-016…020; RUNBOOK (deploy, env matrix, `B7R_RUNTIME`, HSTS preload, rollback, cutover); `docs/LAUNCH-CHECKLIST.md`; IDEAS (CMS Markdown sanitising); Appendix G additions.
- [x] T013 Gates, Lighthouse on the five URLs (90/92/91/95/96 · 100 · 100 · 100), commit, CTO code review (94 → 96 GO), squash-merge to `main`; stop at the Dhia gate (credentials, DNS, GitHub push).
