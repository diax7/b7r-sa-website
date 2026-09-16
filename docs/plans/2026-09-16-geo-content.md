# Project 4: the GEO content (2026-09-16)

The fourth project of Dhia's 2026-09-15 programme: the content the visibility score (ADR-049)
says is missing on the site's side. On the review server the score reads 49 with these open
on the content side: **E6** `FAQPage` JSON-LD (BRD §7.10 lists it as "explicitly not done"),
**E7** a compare page, **E3** two Arabic posts that open with a story instead of a 40 to
80-word answer, **E4** two posts without a question heading, **E1** two English post titles
over 70 characters. The rest of the open items are Dhia's side (the three service connections,
the production origin, the author's bio and photo, the five off-site boxes). Until E6 and E7
ship, the score's ceiling is 93.

## Interview (2026-09-16, AskUserQuestion)

1. The compare page: **B7R vs Printful**, the facts about Printful drafted from its public
   pages with the date read, the page a draft until Dhia approves it in the admin.
2. `FAQPage` JSON-LD: **the FAQ page only**, both languages, from the page's own `faqList`
   block.
3. The rewrites: **drafted by the developer, approved by Dhia** before they go live.
4. The off-site checklist: **draft the copy for him** (one document), he posts and ticks.

## D1. `FAQPage` JSON-LD on the FAQ page (E6)

- `jsonLd.faqPage(items)` in `modules/core/seo/json-ld.ts`: a `FAQPage` node whose
  `mainEntity` is one `Question` per item with an `acceptedAnswer` of type `Answer` and the
  answer as plain text (the FAQ answers are plain text already; a markdown link, if one ever
  appears, is flattened to its label).
- `CmsPageBody` (`modules/pages/cms-page.tsx`) emits it on the page whose slug is `faq`, in
  the page's language, from the same items its `faqList` block renders (`faqItemsFor(block,
  locale)`, a helper the block already has the loading for: selection `all` or `home`, offset,
  limit), so the schema can never drift from the visible questions. Both `/faq` and `/en/faq`.
  The gate is the slug, not "any page with the block": `how-it-works` carries a `faqList`
  slice of the same questions, and the same questions as `FAQPage` on two pages is what the
  schema guidelines warn against. The node carries `@id` (`<url>#faq`), `inLanguage`,
  `mainEntity[].name` and `acceptedAnswer.text`; `tests/json-ld.test.ts`'s per-type table
  gains its required fields.
- Rule E6 (`rules/extractability.ts`) stops being hard-coded `missing`: `done` when the
  published page `faq` carries a `faqList` block (the snapshot's `pages` already carry their
  blocks), `missing` when the page is unpublished or the block removed; the guide says which.
  It stays a rule with its 4 points (ADR-049's "by construction" means enforced by
  validation; an editor can unpublish the page).
- BRD §7.10 amended (ADR-050): `FAQPage` returns for the answer engines on the FAQ page;
  `HowTo`, `SearchAction`, `Speakable`, GBP and `LocalBusiness` stay out. BRD §7.4's schema
  table gains the FAQ page's row.

## D2. The compare page (E7)

- A new block type `compare` in the five places a block lives: `content/schema.ts` (the zod
  shape), `modules/cms/blocks.ts` (the Payload block, both labels and a description per
  field through the pages' descriptions map, ADR-046), `lib/cms/mappers.ts` (Payload → schema,
  `tests/cms-mapping.test.ts`), the seed's `blockData()` in `scripts/migrate-content.ts`
  (schema → Payload data) and the renderer `modules/pages/blocks/compare.tsx`. The shape:
  `title?`, `intro?`, `ours` (the column name, «بحر برنت»), `theirs` (the other side's name),
  `asOf` (the date the other side's pages were read, shown under the table as text), `rows[]`
  of `{ criterion, ours, theirs }`, `bestFor[]`, `notBestFor[]`, `closing?`. Rendered as a
  table with a `<caption>` and `<th scope>` on rows and columns inside an `overflow-x-auto`
  container with the first column sticky (the pattern the admin tables use; three columns
  read at 400 px), the two lists after it under "best for" and "not best for" headings, the
  as-of line, logical directions only. **No external link on the page** (BRD §7.9: external
  links only to b7r.app, the profiles and Misk; `COMPETITOR_HOSTS` is the soft rule): the
  sources of the claims are named as text on the page ("Printful's shipping help page, read
  16 September 2026") and listed in the PR; the block has no URL field.
- The page `compare-printful` (a top-level slug: the `[slug]` route and the proxy's allowlist
  need no change; E7's rule reads a slug starting with `compare` or `vs`): title «بحر برنت
  مقابل Printful: أيهما أنسب لمتجر سعودي؟», one `compare` block with eight criteria (where it
  prints and ships from, delivery to Riyadh and Jeddah, minimum order, the price of a printed
  T-shirt in SAR, Salla and Zid and Shopify links, returns and defects, VAT invoices, Arabic
  support), then a `faqList`-free closing paragraph and the CTA ribbon the page shell adds.
  Seeded in `content/seed/pages.ts` (Arabic) and `content/seed/en/pages.ts` (English) as a
  **draft**: the seed's `Page` gains `draft?: true`, honoured on the Arabic create
  (`_status: 'draft'`) and on the English update (`draft: true`, since an update without it
  publishes a versioned document), with a unit case; `ensurePage`'s skip already reads drafts,
  so "a second run is refused" holds. E7 reads `done` the day Dhia publishes it, and `next`
  once the block's `asOf` is older than 180 days, with the guide "re-read Printful's pages and
  update the date" (two lines in `rules/extractability.ts` and a table case): the as-of date
  carries points, not a block constraint. The Arabic copy is written under BRD §0.5's fallback rule (فصحى مبسطة,
  `TODO(copy)` in the seed, listed in `TODO_COPY` of the verbatim test and in the PR for his
  review, as the Level 3 template strings were); once he approves, it moves into the BRD as
  §4.18 and out of `TODO_COPY`. The English in the seed, listed the same way.
- The facts about Printful: drafted from its public help pages and pricing at the date read,
  each row a claim a reader can check ("prints in Europe and the US, ships to Saudi Arabia in
  two to four weeks", "no minimum", "no Salla or Zid app", "invoices without Saudi VAT",
  "English support"); the PR lists them for Dhia with the source page of each. No claim about
  Printful's quality; the "not best for" list is about B7R (large runs, products B7R does not
  carry), which is what makes the page credible to an assistant.
- The SEO title and description (BRD §4.16's table gains the row); the sitemap and the RSS
  need nothing (published pages are listed by construction); `llms.txt` lists the page once
  published (it reads the published pages).

## D3. The answer-first rewrites (E3, E4, E1)

- `كيف تسعّر تيشيرت مطبوع في السعودية؟` and `ما هي الطباعة عند الطلب؟ شرح مبسط بالأمثلة
  السعودية`: a new first paragraph each, 40 to 80 words, answering the title's question before
  the story (E3), and for the pricing post a question H2 («كم تكلفة تيشيرت مطبوع في
  السعودية؟») (E4); `How to price a printed T-shirt in Saudi Arabia`: one H2 rephrased as a
  question (E4). The two English SEO titles over 70 characters shortened (E1): they are
  `seo.title` on the same two posts, so they ride in the same Local API drafts as the bodies
  and in `content/seed/en/blog.ts` in the same commit.
- Where: the seed files (`content/seed/blog/*.md`, `content/seed/en/blog.ts`, the source until
  launch) and, on the review server, written as **drafts** of the three published posts
  through the Local API (`draft: true`), so the live text stays until Dhia publishes the
  draft from the admin. The e2e and the verbatim test are unaffected (bodies are
  agent-written samples, ADR-018); the rules' unit tests hold the 40 to 80 words on the new
  openings (`openingWords`) and the question heading (`hasQuestionHeading`) on the new files.
- Listed for Dhia in the PR body, paragraph by paragraph (ADR-018's "listed for his read").

## D4. The off-site kit (R1)

- `docs/OFF-SITE-KIT.md`, headed "a draft for Dhia's review" (BRD §0.4.3's spirit: it is
  marketing copy written by the agent, off the site; the ux-araby rules apply): the LinkedIn
  company page description (Arabic and English, 300
  characters each and the long form), the founder's headline and bio, a three-minute YouTube
  walkthrough script (account, product, design, store link, first order) with the shots, the
  pinned X post (Arabic, one image suggestion), and ten Saudi places worth a first mention
  (Salla and Zid partner directories, the Saudi e-commerce communities, two podcasts, three
  newsletters), each with what to send. In the BRD's voice, no em dashes, the brand's terms.
  He posts, then ticks the five boxes; nothing in code.

## CTO plan review (2026-09-16): 92, GO

Folded in above: the seed's draft flag on both locale writes (m1); the mapper and the seed
converter as the block's touchpoints (m2); no external link on the page, the sources as text
(m3, BRD §7.9); E7 `next` past 180 days instead of a block constraint (m4); the slug gate's
reason (n1); E1 in the same drafts (n2); the node's required fields in the JSON-LD table (n3);
the sticky-column table instead of a card mode (n4); the kit headed as a draft (n5).

## Tests, evidence, acceptance

- Unit: `jsonLd.faqPage` (the shape, plain-text answers, an empty list emits nothing); the
  `compare` block's schema (the minimum rows, the lists) and renderer (the caption and scopes,
  RTL and LTR, empty lists left out); E6 from the snapshot (done with the block, missing
  without the page); the rewrites through `openingWords` and `hasQuestionHeading`; the
  verbatim test with the new §4.18.
- e2e: `/faq` and `/en/faq` carry one `FAQPage` node whose questions equal the visible ones in
  order; a compare page created through the API renders the table and the two lists in both
  languages and passes axe, and E7 reads `done` on the Score page while it is published (then
  removed); the seeded `compare-printful` is a draft the public route answers 404 to and the
  preview renders.
- One PR, `geo/content`: ADR-050 (the §7.10 amendment, the compare block, the rewrites' rule,
  the kit); BRD §4.16, §4.18, §7.4, §7.10; RUNBOOK "The compare page" (publishing it, keeping
  the as-of date true) and "The off-site kit"; ADMIN-DESIGN-SYSTEM row for the block; CTO code
  review ≥ 90; both CI lines; `scripts/merge-pr.sh`.

## Out of scope

`HowTo`, `SearchAction` and `Speakable` schema; Google Business Profile and `LocalBusiness`
(BRD §7.10 stands); a second compare page (Printify) until the first is cited; rewriting the
engine's future posts (they follow the rule already); the outside work itself.
