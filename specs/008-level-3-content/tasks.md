# Tasks: Level 3, the blog in the CMS and the automated content engine

Branches `level-3/blog`, `level-3/engine`, `level-3/live`. CTO: plan 87 → amended.

## Phase 3a: the blog in the CMS
- [x] T101 Collections `categories`, `authors`, `tags`, `posts` (fields, access, preview,
  hooks); `fields/editorial.ts` (hard rules + warnings, unit-tested); `revalidatePosts`;
  icons, hues, the Blog group; one migration; `generate:types`, `generate:importmap`.
- [x] T102 `src/lib/lexical/*` (headings, split, plaintext) and `modules/core/rich-text`
  (the shared Lexical renderer with heading ids); the pages block uses it.
- [x] T103 `lib/cms/blog.ts` (posts with pagination, hub, tag, search; categories; author;
  related; adjacent) and the view types.
- [x] T104 Routes and templates: `/blog` (chips, featured, grid, the search island),
  `/blog/page/[n]`, `/blog/category/[hub]` (+ `/page/[n]`), `/blog/[slug]` (TOC, reading
  time, updated date, CTA after the second H2, related, previous/next), `/author/[slug]`,
  `/feed.xml` (absolute URLs); sitemap; JSON-LD; `author` in `CODE_TOP_LEVEL` and the proxy;
  the build lists every blog route static.
- [x] T105 Seed: hubs (copy written and listed for Dhia), the author, the three posts
  (Markdown → Lexical, covers into media); `src/content/blog/posts` and `load.ts` removed;
  seed-check green.
- [x] T106 Admin: "Write a post" quick action, palette fields; e2e (publish flow, five routes,
  the feed, refusals, the no-AI grep); unit tests.
- [x] T107 Docs: ADR-041, BRD §6.11/§10.1 amendments (sections, rebuild, copy), design system,
  RUNBOOK, IDEAS.

## Phase 3b: the engine, mocked
- [x] T201 `ai-settings` (tabs, `fields/secret.ts` with the four-transition test, prefilled
  style guide, banned lists, facts-sheet view, `reviewFirstRuns`, cost rates), `ai-topics`,
  `ai-runs` (read: admin); the AI group (admin only); `AI_CONTENT_MOCK` in
  `assertProductionEnv`; migration.
- [x] T202 Provider layer: interface, SDK registry (openai, deepseek, anthropic, google, pinned),
  mock provider with fixtures and a call log; `AI_CONTENT_MOCK` gate.
- [x] T203 `facts.ts`, `checks.ts`, `dedupe.ts`, `caps.ts`, `cost.ts`, `transliterate.ts`,
  `markdown.ts`; unit tests for each.
- [x] T204 The nine tasks and `generatePost`; run rows; failure alerts; `/api/ai/generate`,
  `/api/ai/regenerate`, `/api/ai/topics/import` (admin only).
- [x] T205 Admin: "Generate now", bulk add, the dashboard "Content engine" card, post
  actions, the health row.
- [x] T206 Tests: mock pipeline end to end (vitest); cms e2e with the mock provider (a generated
  post, its checks, the refusals for an editor and an outsider, no AI mention).
- [x] T207 Docs: ADR-042, BRD §10.2 amendments, RUNBOOK, design system.

## Phase 3c: the engine live
- [ ] T301 `content-tick` schedule with the guards; `freshness` and `digest` schedules; the
  12-month retention sweep.
- [ ] T302 The 30-topic backlog in the seed with windows; ten mock posts on the review server.
- [ ] T303 Tests: tick across a day, freshness on a changed `maxDays`, the digest; e2e for
  the health row and the monitoring view.
- [ ] T304 Docs: ADR-042 amendment, RUNBOOK (day to day), BRD §12.3 caveat, IDEAS; memory.
