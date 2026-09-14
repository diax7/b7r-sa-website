# Tasks: Level 5, the English site

Branches `level-5/site`, `level-5/blog`, `level-5/engine`. CTO: plan 88 → 93 GO.

## Phase 5a: the English site
- [x] T501 `lib/i18n.ts` (locale, paths, `otherLocale`, `ogLocale`, `htmlDir`) with tests.
- [x] T500 `scripts/dev/golden.mjs`: HTML snapshots of the five LHCI URLs before the refactor.
- [x] T502 `content/copy/{types,ar,en}.ts` + `copyFor`; fold `content/pages.ts`,
  `content/blog/index.ts`, `content/seo-copy.ts`, `messages/ar.json` and the inline component
  strings into the banks; next-intl removed; `tests/content-verbatim` reads the English bank
  from the BRD section.
- [x] T503 Data layer per locale: `publicRead(locale)` with the `title exists` gate in both
  directions and `fallbackLocale: false`; readers with `locale`; twins from one `locale: 'all'`
  read.
- [x] T504 `app/(en)/en/**`: layout, home and a wrapper per public route; `SiteDocument` per
  locale; the proxy's `/en` allowlist; the bilingual global 404; the `/en` 302 rows removed.
- [x] T505 Metadata, JSON-LD, sitemap alternates and hreflang per locale; title template;
  `og:locale`; `content-language`.
- [x] T506 Switcher in header and footer; forms, e-mails, designer, consent bar, dates and
  units per locale.
- [x] T507 Seed: English CMS content (products, pages, FAQ, home, navigation, settings, SEO
  defaults, integrations, testimonials, legal drafts); `content:migrate --force` fills empty
  English values on existing documents.
- [x] T508 Tests: unit + `e2e/english.spec.ts` + Lighthouse `/en`; docs: ADR-043, BRD
  amendments and the English copy bank section, design system, RUNBOOK.

## Phase 5b: the blog in English
- [x] T511 Blog readers, routes and feed per locale; pagination, search index and fold,
  reading time and editorial rules per locale; translation pairs' hreflang.
- [x] T512 Seed: the three Level 1 posts in English, hubs and author in English.
- [x] T513 Tests and docs (ADR-043 amendment, BRD §6.11/§10.1 notes, IDEAS closed).

## Phase 5c: the engine in English
- [ ] T521 `ai-topics.language`, settings per language, the pipeline per locale (facts,
  prompts, checks, slug, dedupe, publish, links), the mock's English fixtures, dashboard and
  digest labels.
- [ ] T522 The English backlog (15 topics) in the seed; `llms.txt` per locale.
- [ ] T523 Tests (unit + e2e English run) and docs (ADR-043 amendment, BRD §10.2.1 and
  Appendix E, RUNBOOK).
