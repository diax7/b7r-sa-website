<!--
Sync Impact Report
- Version change: (template) → 1.0.0
- Modified principles: none (initial ratification)
- Added sections: Core Principles (10), Stack and Delivery Constraints, Development Workflow, Governance
- Removed sections: none
- Templates requiring updates:
  - ✅ .specify/templates/plan-template.md — Constitution Check gates now derived from principles I–X
  - ✅ .specify/templates/spec-template.md — no change needed (scope/requirements sections align)
  - ✅ .specify/templates/tasks-template.md — no change needed (task types cover tests, guardrails)
- Follow-up TODOs: none
- Source: B7R-WEBSITE-MASTER-BRD.md §8.9 (principles), §0.4 (non-negotiables), §8.1–§8.8 (stack, gates)
-->

# B7R Website (b7r.sa) Constitution

The single source of truth for what is built is `B7R-WEBSITE-MASTER-BRD.md` (copied to
`docs/`). This constitution restates the BRD's principles (§8.9) as the gates every spec,
plan, task list, and review MUST pass. When this file and the BRD disagree, the BRD wins and
this file is amended.

## Core Principles

### I. Arabic-first, RTL-first, mobile-first; logical CSS only
`<html lang="ar" dir="rtl">` is the page direction; never set direction on `<body>` or via
CSS `direction`. Only logical CSS properties and Tailwind logical utilities (`ms- me- ps- pe-
start- end- text-start text-end rounded-s rounded-e`) are permitted; physical utilities
(`ml- mr- pl- pr- left- right- text-left text-right rounded-l rounded-r border-l border-r
float-left float-right`) fail the `check:rtl` lint. The single documented exception is the
WhatsApp widget's physical `right` placement, marked `// rtl-allow`. Directional icons are
mirrored in RTL. Layouts are designed for a mid-range Android phone on 4G first. Western
digits and Gregorian dates only.

### II. Static, server-rendered HTML for every public page
Every indexable route renders at build time with all text, links, images (with Arabic `alt`),
and JSON-LD in the initial response. No `force-dynamic`, no content behind client fetches, no
infinite scroll. Client components exist only where interaction requires them (designer
canvas, carousels, accordions, forms, widgets) and hydrate inside server-rendered shells.

### III. Copy comes from the content contract, never from components
Every user-visible string lives in `src/content/*` (typed, zod-validated) or
`messages/ar.json`; components receive copy as props. Copy is verbatim from BRD §4. Agents do
not write new Arabic marketing copy; a genuinely missing string reuses an existing §4 string
with the same intent or, failing that, is written in فصحى مبسطة per §4.1, marked
`TODO(copy)`, and listed in the PR for Dhia's review. Prices, delivery promise (5 days),
product list (5), integrations (Salla, Zid, Shopify available now), and the 30 SAR welcome
credit are exactly as the BRD states. Currency renders through `SarAmount` with the official
riyal SVG to the left of Western digits; never "ر.س" or "SAR" text as a marker.

### IV. Performance and accessibility budgets are CI gates
LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 at p75 mobile; Lighthouse mobile Performance ≥ 90,
Accessibility ≥ 95, Best Practices ≥ 95, SEO = 100 on every indexable page; home-page JS ≤
180 kB gzip; two preloaded woff2 ≤ 40 kB each; LCP image ≤ 220 kB. WCAG 2.2 AA: visible
focus ring, 44 px touch targets, skip link, landmarks, labelled forms, `aria-live` errors,
axe zero serious violations. These numbers are thresholds in `lighthouserc.json` and the
e2e suite, not aspirations.

### V. One typeface, three blues, one radius; motion is subtle and reducible
ITF Rayat Round self-hosted (five weights, roles fixed in §3.3). Colour tokens are CSS custom
properties in Tailwind 4 `@theme`; no raw hex in components; no hue gradients, glow, glass,
neon, purple/pink/teal/orange, or decorative blobs. One radius family (13 px; 20 px large
media; pill; 6 px inner). Shadows near-invisible. Motion durations and easings are tokens;
scroll reveal once, no parallax, no scroll-jacking; the only continuous animations are the
wave in `WaveDivider` and the muted marketing loop in `VideoSection` (decorative, lazy,
poster under reduced motion and Save-Data — ADR-037). Every animation has a reduced or
static variant under `prefers-reduced-motion`. Light mode only.

### VI. No fabricated content
No fake reviews, numbers, promises, urgency, or "coming soon" labels. Testimonial placeholders
carry a visible «نموذج» badge and the section is omitted in production builds until real
entries exist. Missing assets are reported, never improvised. No mention of AI anywhere on
the public site.

### VII. Modular monolith
Features are blocks under `src/modules/<name>/`, each exporting only from `index.ts`. Pages
under `src/app/` compose modules. A feature module imports from `components/*`, `content/*`,
`lib/*`, and `modules/core` only, never from another feature module's internals (enforced by
`no-restricted-imports`). Shared primitives live in `components/shared` and `components/ui`
(shadcn/Radix, restyled to the tokens). Build a primitive once; reuse it everywhere.

### VIII. Every non-obvious decision gets an ADR; every phase gets a CTO review before and after
`docs/DECISIONS.md` holds one entry per non-obvious choice (ADR-001 adopts the BRD). Each
phase is one Spec Kit feature wrapped by the cto-cycle: CTO plan review (score ≥ 90, zero
BLOCKER) before implementation; CTO code review after; findings fixed before advancing.
Phase 1a ends at a Dhia gate. Ideas outside the current phase go to `docs/IDEAS.md`, not into
the code.

### IX. Zero warnings; tests cover behaviour, edges, and errors; verify before claiming done
`pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm check:rtl`, `pnpm test`,
`pnpm build`, `pnpm e2e`, and `pnpm lhci` are all green in CI with zero warnings (an
unavoidable warning is suppressed inline with a justification). Unit tests cover profit math,
`SarAmount` formatting, the redirect map, content schemas, JSON-LD required fields, and the
rate limiter; e2e covers the flows in §8.7. Tests assert behaviour, not implementation. No
claim of completion without running the gates and reporting their real output.

### X. No AI attribution in commits or PRs; Dhia is the author of record
Conventional commits, imperative mood, ≤ 72-character subject. No `Co-Authored-By` trailer
naming an AI, no "Generated with" line, in any commit or PR description.

## Stack and Delivery Constraints

- Node 22+ LTS, pnpm, ESM; Next.js 16 App Router, React 19, TypeScript 5 strict with
  `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`,
  `noPropertyAccessFromIndexSignature`, `verbatimModuleSyntax`, `isolatedModules`; absolute
  imports via `@/…` only.
- Tailwind CSS 4 (`@theme`), shadcn/ui primitives restyled, `lucide-react` with an RTL-aware
  `Icon` wrapper, `motion`, `konva` + `react-konva` (lazy, designer only), `zod`, `resend`,
  Turnstile, `next-intl` (single locale `ar`, `/en` reserved), Umami + GA4 after consent.
- Exact pinned versions looked up at install time; `pnpm audit --audit-level=moderate`
  before adding a dependency; `minimumReleaseAge 1440`; `ignore-scripts true`.
- oxlint (typescript, import, unicorn) + oxfmt; `scripts/check-rtl-classes.ts`; Vitest;
  Playwright + axe; Lighthouse CI; `prek` hooks (typecheck + lint + rtl on commit).
- Docker multi-stage on `node:22-alpine`, `output: 'standalone'`, non-root, port 3000,
  `GET /api/health`; hosted on CranL (Saudi region); `NEXT_PUBLIC_SITE_URL` other than
  `https://b7r.sa` forces `noindex`.
- Security headers per BRD §8.10; API routes validate with zod, honeypot, rate limit; no PII
  in logs; secrets never reach the client.

## Development Workflow

- Read `B7R-WEBSITE-MASTER-BRD.md` §0 first, then the sections for the current phase.
- Per phase: `/speckit-specify` → `/speckit-clarify` → `/speckit-plan` →
  `/speckit-checklist` → `/speckit-tasks` → `/speckit-analyze` → `/speckit-implement` →
  `/speckit-converge`, wrapped by the cto-cycle skill.
- Branch per phase (`phase/1a-foundation`, `phase/1b-home`, …); one PR per phase; squash
  merge; PR lists every DoD item with evidence. Never push to `main` directly.
- Before closing a phase: `design-review` for pixel quality and "AI slop" findings, `qa`
  for flows, RTL check on Chrome Android and iOS Safari.
- Unspecified visual detail → the quieter option. Unspecified technical choice → the boring
  option already in the BRD or the B7R app.

## Governance

This constitution supersedes every other practice document in the repository except the BRD
it derives from. Amendments require: (1) a BRD change in `docs/brd-sections/` and a rebuilt
master file, (2) an ADR in `docs/DECISIONS.md`, (3) a version bump here (MAJOR for removed
or redefined principles, MINOR for added principles or materially expanded guidance, PATCH
for wording). Every plan's Constitution Check and every CTO review verifies compliance with
principles I–X; a breach of I, II, III, IV, VI, or X is a BLOCKER. Complexity beyond what
the current phase needs must be justified in the plan's Complexity Tracking table or removed.

**Version**: 1.1.0 | **Ratified**: 2026-09-12 | **Last Amended**: 2026-09-13 (principle V names the muted marketing loop next to the wave, ADR-037; BRD §3.7, §3.11, §6.4.3, §6.4.5, §6.5, §6.6, §6.15 amended in the design edits after 2a)
