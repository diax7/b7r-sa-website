# Implementation Plan: Level 5, the English site

**Branches**: `level-5/site` (5a), `level-5/blog` (5b), `level-5/engine` (5c) | **Date**: 2026-09-14 |
**Spec**: `specs/009-level-5-english/spec.md`
**CTO plan review**: 2026-09-14, 88 with revisions, then 93 GO; folded below (the proxy learns `/en` so an
unknown English URL gets the one static 404 document, now bilingual; locale presence gates
reads in both directions at the query, twins detected from one `locale: 'all'` read;
`messages/ar.json` folds into the copy bank and next-intl is retired with ADR-003; golden
HTML of the five LHCI URLs before and after the copy refactor; every agent-written English
text listed as owed Dhia's read; the English document's feed and manifest links; one place for
the reading-time constants; LHCI capped at two English URLs).

## Summary

Three phases, each a PR on green CI with a CTO code review. **5a** gives every public page
an English twin under `/en/` from a second root layout, moves the interface copy into typed
per-locale banks, reads the CMS per locale without fallback, seeds the English content,
emits hreflang and sitemap alternates, and adds the switcher. **5b** does the same for the
blog (routes per locale, translation pairs, search, feed, reading time) and ships the three
Level 1 posts in English. **5c** teaches the engine a second language (topic language, per
locale prompts, checks, facts sheet, dedupe, an English backlog) and adds `llms.txt`.

## Constitution Check

| # | Gate | Pass? |
|---|---|---|
| I | RTL | The Arabic document is untouched; the English one is `dir="ltr"` on the same logical-property CSS, so nothing flips by hand. `check:rtl` unchanged. An e2e asserts `dir` per locale and that the layout mirrors (the header's inline-start slot holds the logo in both) |
| II | Static | `/en/*` prerenders like its twin: the same `generateStaticParams` per route (filtered to documents with English), `dynamicParams` as today, no `searchParams`, no middleware. The e2e asserts `x-nextjs-cache` on `/en` |
| III | Copy | English interface copy is a new BRD section (verbatim-tested); English CMS content is seeded content owed Dhia's read (listed in the PR); no machine translation at render |
| IV | Budgets | No new client JS: the switcher is a link; the search island already exists and takes its fold function by locale; Lighthouse CI adds `/en` and `/en/products` |
| V | Tokens | Same primitives; the only English-specific style is `dir`-driven |
| VI | No fabrication | English product and page copy comes from the same facts (Appendix A, the facts sheet); the English legal pages are marked drafts owed a read |
| VII | Modules | `lib/i18n` (locale type, paths) is a leaf; `content/copy/*` replaces `content/pages.ts` and `content/blog/index.ts`; `modules/*` take `locale` as a prop; nothing imports from the route groups |
| VIII | ADRs | ADR-043 (English: subdirectory, second root layout, per-locale banks, "in English" predicate without fallback, switcher without redirect, per-locale engine); BRD §3, §4.16, §7.3, §7.5, §9.1, §10.2.1, §12.5 amendments through the sections, rebuild, copy; a new section `09-english-copy-bank.md` |
| IX | Tests | Per phase below; every gate in prek and CI |
| X | No attribution | Yes |

## Technical context (verified in the repo)

- **Root layouts**: `app/(site)/layout.tsx` renders `SiteDocument` (`<html lang="ar" dir="rtl">`).
  Next allows one root layout per route group, and a navigation across groups is a full
  document load. `app/(en)/en/layout.tsx` renders `SiteDocument` with `locale="en"`.
- **The 404 path (CTO 1)**: `notFound()` under a route-group root layout renders the bare
  `__next_error__` document (the 2b finding behind B0), so there is no English `not-found`
  document. The proxy (`src/proxy.ts`, `lib/site-routes.ts`) learns the `/en` prefix:
  `topLevelSlug` accepts `/en/<slug>` and checks it against an English allowlist
  (`/api/pages/slugs?locale=en`, pages with an English title); an unknown `/en/*` is
  rewritten to the global 404 like an unknown root URL. The global 404 (`global-not-found.tsx`,
  ADR-024) becomes bilingual: Arabic first, an English line and a link to `/en` (it cannot
  vary by URL). `/en/products/<unknown>` and `/en/blog/<unknown>` behave like their Arabic
  twins (ADR-030). The `/en` 302 rows in `lib/redirects.ts` are removed.
- **A third copy home (CTO 3)**: `messages/ar.json` (2.8 KB) is imported directly by 18
  files through next-intl's plugin wiring (ADR-003); no `useTranslations`/`getTranslations`
  call exists. It folds into `content/copy/ar.ts`, the plugin and the dependency go, and
  ADR-003 is superseded by ADR-043. One mechanism, one verbatim test.
- **Data layer (CTO 2)**: `PUBLIC_READ` in `lib/cms/read.ts` fixes `locale: 'ar'`; it becomes
  `publicRead(locale)` with `fallbackLocale: false` in both locales, and locale presence gates
  every versioned reader **at the query, in both directions**: `where: { title: { exists: true } }`
  (or `name`) evaluated in the request locale, so an English-only post never reaches the
  Arabic mappers (the day the first one publishes, `/blog` still regenerates) and an
  Arabic-only page never reaches `/en`. Twin detection for hreflang and the switcher comes
  from one read of the title field at `locale: 'all'` (a `locales: Locale[]` on each view
  model), never a second full read per page. The `getX()` readers take `locale` (default
  `ar`) so the Arabic call sites change only where they pass it on. Globals have no `where`:
  a global's English presence is judged on one required field (`home.hero.slides[0].headline`,
  `site-settings.brandName`, `navigation.ctaLabel`, `seo-defaults.titleTemplate`), and `/en`
  as a whole is gated on `site-settings` and `navigation` being in English, so a half-seeded
  environment answers 404 for `/en`, never a shell with empty labels (CTO re-review nit 1).
  The English allowlist for the proxy is its own static route, `/api/pages/slugs/en`, so
  ISR applies as to the Arabic one and the proxy caches both lists the same way (nit 2).
- **Localised fields**: 46 fields are `localized: true` across products, pages, faqs,
  testimonials, integrations, categories, authors, tags, posts, home, site-settings,
  navigation, seo-defaults (checked in 2a: "all text fields"). Slugs are not localised (same
  slug both languages), by design.
- **Copy today**: `content/pages.ts` (products, contact, shell, status pages), `content/blog/index.ts`
  (blog template), `content/seo-copy.ts` (title template, product SEO row, cost note), and
  inline Arabic in ~25 components (aria labels, small labels, the designer, the consent bar,
  the WhatsApp widget, `lib/dates.ts` month names, `lib/reading-time.ts`). All of it moves to
  `content/copy/ar.ts` behind one `SiteCopy` type; `content/copy/en.ts` `satisfies SiteCopy`.
- **Metadata**: `pageMetadata(meta)` builds canonical, OG, Twitter, robots; it gains
  `locale` and `alternates` (`{ languages: { ar, en, 'x-default' } }`) and the per-locale
  title template; `sitemapEntries` gains `alternates.languages` per entry. Next emits
  `<link rel="alternate" hreflang>` from `alternates.languages`.
- **Fonts**: `public/fonts/ITFRayatRound-*.woff2` include U+0020-007E; English needs nothing
  more. `--font-sans` stays.
- **The 3a reading time** counts words at an Arabic pace; English uses 200 wpm; both
  constants live in `lib/reading-time.ts` behind the locale switch (CTO 7).
- **The engine**: `topics.language` decides everything downstream; `payloadStore.facts()`
  reads the site settings and products in the topic's locale; `checks.ts` gets a `locale`
  option; `prompts.ts` has an English system prompt and rubric text; the mock provider builds
  English fixtures from the facts; `slugFor` keeps English titles as they are (no
  transliteration); `dedupe` compares within a locale.

## Phase 5a: the English site (branch `level-5/site`)

- `lib/i18n.ts`: `Locale`, `LOCALES`, `DEFAULT_LOCALE`, `localePath(locale, path)`,
  `otherLocale`, `ogLocale`, `htmlDir`. Unit tests.
- `content/copy/{types,ar,en}.ts` + `copyFor(locale)`; `content/pages.ts`, `content/blog/index.ts`
  and `content/seo-copy.ts` fold into it; the inline strings move in (each component takes
  `copy` or `locale` from its page). `tests/content-verbatim.test.ts` reads the English bank
  from the new BRD section too.
- `app/(en)/en/{layout,page}.tsx` and one wrapper per public route (`products`,
  `products/[slug]`, `[slug]`, `how-it-works`, `about`, `contact`, `faq`, `terms`, `shipping`,
  `privacy`), each calling the shared page component with `locale="en"` and the same
  `generateStaticParams` filtered by `inLocale`. `SiteDocument` takes `locale`.
- Data layer per locale (`publicRead(locale)` with the presence gate both ways, readers with
  `locale`, twins from one `locale: 'all'` read), the proxy's `/en` allowlist, the bilingual
  global 404, the `/en` redirects removed.
- Metadata and JSON-LD per locale: title template, `og:locale` and `og:locale:alternate`
  for the twin, `content-language`, `inLanguage`, `Organization.alternateName`, alternates
  only when the twin exists (the Arabic page emits the `en` link too); sitemap alternates.
  The English document still announces `/feed.xml` (Arabic) until 5b's `/en/feed.xml`; the
  manifest gets `lang` (CTO 6).
- Switcher in the header and footer (a link with `hreflang`/`lang`; the twin URL or the home).
- Forms per locale: contact and newsletter copy, validation messages, confirmation e-mail
  text; the API routes accept a `locale` field (validated against `LOCALES`).
- The designer island and the consent bar per locale (copy through props).
- Dates and units per locale (`formatDate(locale)`, `SAR`, weight unit).
- Seed: English values for products (Appendix A in English), the seven pages' blocks, FAQ,
  home, navigation, site settings, SEO defaults, integrations, testimonials (placeholders);
  legal drafts. Written into `content/seed/*` next to the Arabic values; `content:migrate --force`
  adds the English values to existing documents where the English title is empty (the one
  case the seed updates a document, recorded in ADR-043).
- Golden HTML (CTO 4): before the copy refactor, `scripts/dev/golden.mjs` snapshots the
  rendered HTML of the five LHCI URLs; after it, the diff is empty (whitespace aside). Kept
  for 5b and 5c.
- Tests: unit (i18n paths, copy parity, metadata alternates, sitemap alternates, date
  formats, `publicRead` where per locale); e2e `e2e/english.spec.ts` (every `/en` route 200 +
  `lang/dir`, no Arabic in `main`, hreflang pairs both ways, switcher targets, sitemap
  alternates, `/en/no-such-page` → 404 as the full bilingual document with no
  `__next_error__`, an Arabic-only page absent from `/en` and from the alternates, an
  English-only document absent from the Arabic site and its sitemap, forms in English,
  Lighthouse `/en` and `/en/products` only (CTO 8)).
- Content owed Dhia's read (CTO 5), listed in the PR and in Appendix G's pattern: the
  English product and page copy, the English hub descriptions and author bio (5b), the
  legal drafts, the English banned phrases and claims for the engine (5c).
- Docs: ADR-043 (with the bilingual 404, the `--force` fill exception to ADR-026 and the
  retirement of ADR-003), BRD amendments (§3, §4.16, §7.3, §7.5, §9.1, §12.5), the English
  copy bank section, design system (switcher), RUNBOOK (how to publish a page in English).

## Phase 5b: the blog in English (branch `level-5/blog`)

- Routes under `(en)/en/blog/**` and `(en)/en/author/[slug]` mirroring the Arabic ones;
  `lib/cms/blog.ts` readers take `locale`; listings filter `inLocale`; pagination per locale;
  the search index and fold per locale; `/en/feed.xml`; reading time per locale; the
  editorial rules per locale (Arabic banned phrases apply to Arabic values only; the em dash
  rule and the length rule apply to both).
- Translation pairs: a post with both values emits hreflang both ways and the switcher targets
  the twin; otherwise the switcher targets `/en/blog` or `/blog`.
- Seed: English versions of the three Level 1 posts (`content/seed/blog/*.en.md`), hub names
  and descriptions, the author bio in English.
- Admin: nothing new (the locale switcher in the panel already edits the English tab); the
  IDEAS note about hiding `en` is closed.
- Tests: unit (readers per locale, reading time, rules per locale), e2e (English blog routes,
  a pair's hreflang, English-only post absent from Arabic listings, feed per locale).

## Phase 5c: the engine in English (branch `level-5/engine`)

- `ai-topics.language` (select, default `ar`, in the CSV import too); `ai-settings` style
  tab per language (style guide, system prompt, banned phrases); the pipeline threads the
  locale: facts sheet per locale, prompts, checks (`locale` option: Arabic-paragraph
  deduction for English, banned phrases per language), slug, dedupe per locale, publish per
  locale, hub link targets under `/en/`; the mock provider's English fixtures; the dashboard
  card and the digest label the language.
- Seed: 15 English topics (Appendix E amendment) aimed at the English prompts of §7.7, with
  windows where seasonal.
- `app/llms.txt/route.ts` (and `/en/llms.txt`): the site summary, the key pages and the
  published posts with one-line summaries, per locale, revalidated with the sitemap.
- Tests: unit (checks per locale, English mock run through the pipeline, slug for English),
  e2e (an English run with the mock publishes to `/en/blog`, Arabic unaffected).
- Docs: ADR-043 amendment, BRD §10.2.1 (`language`), Appendix E (English backlog), RUNBOOK.

## Judgement calls

- A second root layout rather than a `[locale]` segment at the root: the Arabic URLs do not
  change, the Arabic build stays identical, and the English document is a real document with
  its own `lang`/`dir` rather than a swapped attribute.
- No fallback from English to Arabic at render: a half-translated page hurts more than a
  missing one; the "in English" predicate decides what exists in English.
- The English legal texts and the English CMS copy are content Dhia reads before launch
  of `/en`; until then `/en` is built and reviewable on :3004.
- One font family: the brand font's Latin is the brand in English too.
