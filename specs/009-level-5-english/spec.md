# Feature Specification: Level 5, the English site

**Branches**: `level-5/site` (5a), `level-5/blog` (5b), `level-5/engine` (5c), each from
`main` after the previous one merges | **Date**: 2026-09-14
**Requested by**: Dhia, "start Phase 5 from 5a to 5c autonomous with the cto cycle", after
"I definitely want to add it" and the `/en/` routing question.
**BRD**: §3 (IA: `/en/*` reserved, 302 until it exists), §4.16 (SEO rows), §7.3 and §7.5
(hreflang and sitemap alternates when `/en` ships), §9.1 (locales `ar`/`en`, English left
empty until the English phase), §10.2.1 (`language: ar only in this phase`), §12.5 (English
locale listed as a future block), Appendix A (products), Appendix B (legal), Appendix D (FAQ),
Appendix E (backlog).

## Decisions taken (autonomous run; every departure from the BRD is an ADR)

| Question | Decision |
|---|---|
| Where English lives | `b7r.sa/en/...`, a subdirectory on the same domain (one authority pool, the `.sa` geo signal for both languages, one Search Console property). Not a subdomain, not a second domain, never a cookie or browser-language switch. Dhia agreed 2026-09-14. |
| Arabic URLs | Unchanged, at the root. English uses the same Latin slugs under `/en/`. |
| How `/en` renders | A second root layout in the route group `app/(en)/en/**` with `<html lang="en" dir="ltr">`; its page files are thin wrappers that call the same page components as the Arabic routes with `locale="en"`. No middleware, no `searchParams`, static as today. A language switch is a full navigation between root layouts (correct: a different document). ADR. |
| Interface copy | One typed bank per locale (`content/copy/ar.ts`, `content/copy/en.ts`, the English shape checked against the Arabic one), read through `copyFor(locale)`; the inline strings scattered in components move into the bank on the way. The English bank is written into the BRD as a new section and verified verbatim like the Arabic one. |
| CMS content | Field-level localisation already exists (`localized: true`, locales `ar`/`en`, fallback on). English reads use `fallbackLocale: false`: a document is "in English" only when its English title (or name) exists, and only those documents get an `/en` route, a sitemap alternate and hreflang. An English page never shows Arabic prose as a stand-in. The seed writes the English content for the products, the seven pages, the FAQ, the home, navigation, site settings and SEO defaults; the legal pages are English drafts owed Dhia's read (Appendix B is Arabic-only). |
| Fonts | ITF Rayat Round carries Latin and is already subset with Basic Latin; no second family. |
| Unknown `/en/*` URLs | The proxy checks `/en/<slug>` against the English allowlist and rewrites unknowns to the one static global 404, which becomes bilingual (Arabic first, an English line, a link to `/en`); there is no English 404 document because `notFound()` under a route-group root layout renders the bare shell (CTO). |
| `messages/ar.json` and next-intl | Folded into the copy bank; next-intl (wiring only, no hook in use) is removed and ADR-003 superseded (CTO). |
| Locale presence | Gated at the query in both directions (`title exists` in the request locale, `fallbackLocale: false`), so an English-only post never breaks the Arabic blog and vice versa; twins found from one `locale: 'all'` read (CTO). |
| hreflang | `ar`, `en` and `x-default → ar` on every page that has a twin, self-referencing, emitted from `pageMetadata` (`<link rel="alternate">`) and `sitemap.ts` alternates; each language canonical to itself. |
| Switcher | A real link in the header (and the footer) to the twin URL, or to the other locale's home when no twin exists, with `hreflang` and `lang` on the link. No automatic redirect; the `/en` 302 rules go. |
| Blog in English (5b) | A post is one document; an English post is the English value of its localised fields. A post with both languages is a translation pair (hreflang between them); a post with English only shows only on `/en/blog`. Listing, hub, author, pagination, search, RSS and reading time per locale. The three Level 1 posts get English versions in the seed. |
| The engine in English (5c) | `ai-topics.language` (`ar`/`en`); the pipeline takes the language from the topic: the facts sheet from the English site content, English prompts, checks per locale (no "Latin paragraphs" deduction for English, a mirror "Arabic paragraphs" one instead; banned phrases per language; the em dash and AI-mention refusals stay), the slug from the English title, dedupe per locale, publish with `locale: 'en'`. An English backlog of 15 topics aimed at the English prompts of §7.7 seeds the second language. |
| `llms.txt` | Added in 5c (both languages, generated from the CMS): cheap; evidence of effect is weak (BRD §7.10) but the cost is an hour. |
| Numerals and dates | Western numerals in both languages (already the Arabic choice); English dates `14 September 2026`; SAR shown as `SAR` in English. |

## Goals

1. **5a** Every public page exists in English under `/en/...` with English copy, English CMS
   content, LTR layout, hreflang pairs, sitemap alternates, a language switcher, English
   forms and e-mails, English metadata and JSON-LD, and the same static behaviour, budgets
   and accessibility as the Arabic site.
2. **5b** The blog runs per locale: `/en/blog`, hubs, authors, pagination, search, feed,
   post pages with translation pairs; the three Level 1 posts exist in English.
3. **5c** The engine writes English posts from an English backlog with the same guardrails,
   the dashboard and digest show both languages, and `llms.txt` describes the site.

## Non-goals

- A third language; a locale selector by browser language; machine translation on the fly.
- Translating the admin panel (it is English already, ADR-039); translating e-mails to
  editors.
- English versions of the Level 1 designer sample designs (removed by Dhia).
- Salla and Zid landing pages, the comparison page and the other future blocks of §12.5.

## Acceptance (the whole level)

1. `/en` and every `/en/*` page answer 200, `lang="en" dir="ltr"`, no Arabic script in
   `<main>` except brand and product names; the Arabic site is byte-for-byte the same in
   behaviour (the existing e2e suite stays green).
2. Every page with a twin carries both hreflang links and `x-default`, the sitemap lists
   alternates, titles use `| B7R Print`, `og:locale` is `en_US`, JSON-LD `inLanguage` is
   `en`; a page without an English twin is absent from `/en` (404) and from the alternates.
3. Lighthouse on `/en` meets the same thresholds; the JS budget is unchanged (no new island).
4. An editor fills the English tab of a product or page and publishes; `/en/...` shows it
   within 60 s and the twin links appear on both languages.
5. The blog: an English post publishes to `/en/blog/{slug}` with its hub, author, feed and
   sitemap entries; a translation pair links both ways; search folds per locale.
6. The engine: a topic with `language: en` produces an English post that passes the English
   checks (mock provider, e2e); Arabic runs are untouched.
7. Docs: ADR-043; BRD §3, §4.16, §7.3, §7.5, §9.1, §10.2, §12.5 amended; a new BRD section
   with the English copy bank; RUNBOOK and design system updated.
