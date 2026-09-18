# Pre-launch programme (2026-09-18)

Dhia's brief, the evening the site went live on CranL's temporary domain: a full audit of
every page (content, SEO and GEO, photos and speed, responsive layouts, bugs), scroll
animations on every item and every page including future ones, an almost complete redesign
of the admin (a Cloudflare-like sidebar, side-by-side Arabic and English editing, dashboard
numbers, clearer text, an Arabic admin with RTL), and less AI spend (weekly instead of daily,
cheaper models). Autonomous, multi-session; the CTO signs each phase; Dhia reads the final
report only.

Working rules: every phase is a PR (or a few) with the CTO's GO (score >= 90, no blocker),
merged through `scripts/merge-pr.sh`; CranL rebuilds `main` on every merge and the temporary
domain is checked after each; migrations stay additive; nothing runs "Run now" on the ledger
(real spend); secrets never print. This file is the source of truth for status: a phase's
box is ticked only when its criteria below are met and named in the PR.

## Phase 0: Audits (read-only, three agents in parallel)

Outputs in `docs/audits/2026-09-18-*.md`, findings graded blocker / major / minor with
`file:line` and the route, and a fix list in order.

- [x] **Site audit** (`site.md`): every route in Arabic and English on the review server;
  content (typos, placeholders, ar/en parity, tone), SEO (titles, descriptions, canonicals,
  hreflang, JSON-LD validity, sitemap, robots, OG), GEO (llms.txt, FAQPage, answer-first
  openings, the compare page), photos (format, `sizes`, LCP element, lazy loading, CLS),
  speed (Lighthouse mobile and desktop on every route), responsive (screenshots at 360,
  390, 768, 1024, 1280, 1920; overflow, wrapping, tap targets), bugs (console errors,
  broken links, forms, 404/410, the designer, the language switch, the header island).
- [x] **Admin audit** (`admin.md`): every collection, global and view walked as admin and as
  editor; the sidebar and its groups; the text of every label and description (clarity,
  consistency, ux-araby for Arabic); the edit forms' organisation (tabs, rows, order);
  what the dashboard shows and what it should; where bilingual editing hurts today; a
  Cloudflare-style sidebar proposal; the RTL readiness of our custom components.
- [x] **AI cost audit** (`ai-cost.md`): every scheduled job and its cost driver; the prompts'
  periods; the models on each connection and cheaper equivalents; the engine's model; a
  monthly estimate before and after.

Criteria: three reports exist, each with a graded list and a fix order; the CTO has read
them and agreed the fix list (a written note in each report's foot).

## Phase 1: The site (scroll reveal, then the audit's fixes)

- [x] **Scroll reveal everywhere** (ADR-055, PR #36, CTO 92): one observer mounted once, every
  `Section`, `SectionHeader`, card and block carries `data-reveal` by default (an opt-out
  prop), staggered inside grids, off under reduced motion, never the hero or anything above
  the fold, hidden only under `html.js` so content is always there without JavaScript;
  future components inherit it through the primitives.
- [x] **Content, SEO, GEO fixes** from the audit (PR #38, CTO 92: the byline from the author record, the empty hubs and author out of the sitemap with `noindex, follow`, the compare headings, the copy items, the descriptions and OG sizes; the content rows are Dhia's on the checklist, 33 to 37).
- [x] **Photos and speed fixes** from the audit (PR #38: the LCP priority, no prefetch of the home, the image sizes and cache; item 12 the JS floor, CTO 93: every CMS page 206 to 164 KB of first-paint JS, all 54 routes at 85 or more, the floor recorded in BRD 7.8).
- [x] **Responsive and bug fixes** from the audit (PR #38: the FAQ served closed with the answers in the HTML, the size chart inside its column at 360 px, the WhatsApp panel above the consent card and the card above the button at every width, 44 px hit areas).

Criteria: Lighthouse mobile performance >= 90 and SEO/a11y/best practices = 100 on every
public route (the CI gate's five plus the rest, by `scripts/dev/lh-all.sh`); axe zero serious
on every route; zero broken links and zero console errors on a crawl of both languages;
every e2e green on the three device projects; the reveal e2e (a section below the fold is
hidden with JS until scrolled into view, visible without JS, visible at once under reduced
motion); the CTO's GO; the temporary domain checked after the merge.

## Phase 2: The admin

- [x] **Arabic admin with RTL** (PR #37, ADR-056, CTO 94): Payload's `ar` translations on, the language switch in the
  account menu, every custom string of ours in both languages, every custom component
  RTL-correct (logical properties only), the dashboard, the views and the sidebar checked in
  Arabic by the admin e2e in both languages.
- [x] **The sidebar** (PR #41, ADR-058, CTO 93; Cloudflare-like): groups with a clear open/close control in a usable
  place, separation between groups, the active entry unmistakable, the collapse control
  where the hand expects it, the same on narrow screens.
- [x] **Dashboard numbers** (PR #40, ADR-059, CTO 92): what matters at a glance (visits and sources over 7 and 30 days,
  citations and the cited rate, drafts waiting, published this week, jobs failed, the
  engine's spend and limits, the ledger's next run), each a link to its place.
- [x] **Text and organisation review**: every label, description and empty state read for
  clarity in both languages; forms reorganised where the audit says; the admin design
  system doc updated. Done in two PRs: `admin/text-review` wrote the visibility rules'
  seventy sentences in both languages with arrows as words and no environment variable or
  code path in a guide (audit 2.19, 6.3; ADR-056 amended, design system §5a), the Score
  page's wait answers and the traffic date range the same; `admin/audit-fixes` relabelled
  the collections and the description maps and reorganised the forms (the audit's items 3
  and 7).
- [x] **Side-by-side bilingual editing** (PR #39, ADR-057, CTO 93): the approach settled with the CTO before code (a
  custom field wrapper for localized fields showing both languages at once, saved in one
  go), applied to every localized text, textarea and select field, with rich text handled
  as the approach allows; the locale switch kept for the rest.

Criteria: the admin e2e green in English and Arabic; axe zero serious on every admin
surface; `tests/admin-config.test.ts` green (descriptions in both languages on every
field); the design system doc and the admin rules updated; the CTO's GO per PR.

### Phase 2 design, settled with the CTO (memo of 2026-09-18)

- **Side-by-side editing: approach A.** For every localized text, textarea and select field
  a custom Field component renders the current locale's field beside an input for the other
  locale; the other locale's edits live in a hidden non-localized `translations` JSON on the
  document (`{ path: { value, base } }`, prefilled from the other locale read with
  `draft: true`); a collection/global `afterChange` hook applies them with a second
  `payload.update({ locale: other, req, draft: data._status === 'draft' })` and clears the
  JSON in the same write, guarded by a context flag against re-entry, skipped on autosave
  (a Save or Publish applies), applying a path only when `value !== base` and `base` still
  equals what is stored; a validation error in the other locale rolls the whole save back and
  names the field and the language. Rich text, arrays and blocks stay on the locale switch,
  whose note says which fields are side by side. Payload 3.89 has no all-locales write
  (`beforeChange/promise.js` keeps the stored value for every locale but `req.locale`), so
  the second update is the mechanism. Tests: the apply's table (changed, unchanged, stale
  base, a required blank) and an e2e editing both languages of a page in one Save.
- **The Arabic admin.** ADR-039's "English panel" is reversed and recorded; the UI language
  (Payload `i18n`, the account menu) and the content locale (the pills, `data-content-locale`)
  never share a control. Digits stay Western: one formatter with `-u-nu-latn`, tested.
  `adminStrings` typed as `{ en, ar }` pairs (a missing language is a type error); a unit test
  applies the ux-araby rules to the Arabic strings; the admin e2e runs once in Arabic
  (`html[dir="rtl"]`, the shell, a list, an edit view, both views, axe). Payload's own `ar`
  translations are community work: the worst few overridden through `i18n.translations`
  and the fact recorded.
- **The sidebar.** Group state stays in Payload's `nav` preference (per user, server-side);
  ADR-046's hues and the active entry on its tint stay (Cloudflare's single grey is the part
  not to copy); "chevron at the end" and "collapse at the bottom start" are logical
  positions; the rail with tooltips exists; the drawer under 1440 px stays Payload's.
- **Dashboard numbers.** Every figure has a reader already except "drafts waiting", which
  needs `findVersions` with `latest: true` per collection: budgeted as the one non-trivial
  query, linked to the list filtered on `_status`.

## Phase 3: The AI spend

- [x] Prompts' periods weekly (the seed default and the rows on the review and production
  databases); the brand prompts too unless the audit argues for one daily.
- [x] Cheaper models on each connection where the audit shows equal signal (Gemini 3 Flash,
  Claude Haiku 4.5 or Claude off), a monthly limit on every AI connection; the engine's
  default model reviewed.
- [x] The visibility pull and the traffic pull kept daily (no spend).

Criteria: the RUNBOOK's "What it costs" table updated with the new estimate; the rows
changed on both databases by a script that prints what it changed; no ledger run triggered.

## Phase 4: Verification and the report

- [x] Every CI line green on `main`; the temporary domain smoke-tested (health, the routes,
  the admin in both languages, a publish, an upload).
- [x] Memory and `docs/LAUNCH-CHECKLIST.md` updated.
- [x] The final report to Dhia: what was done per phase, the numbers before and after, the
  checklist of what remains his (keys, the cutover), and the next steps.

## Status log

- 2026-09-18 02:30 UTC: programme written; Phase 0 agents launched.
- 2026-09-18 02:50 UTC: the CTO's memo on Phase 2 recorded above; `site/reveal` (ADR-055) committed, its e2e waits for the review server.
- 2026-09-18 05:30 UTC: the three audits delivered with the CTO's notes (Phase 0 complete); Phase 3 executed on both databases (PR #35, CTO 93); `site/reveal` e2e green on three projects; agents building `admin/arabic`, `admin/side-by-side`, `admin/audit-fixes` in worktrees.
- 2026-09-18 07:10 UTC: PR #36 reviewed (CTO 92, GO with two minors): the arming moved from an inline script to a client island after hydration, the print rule, the stagger cap, a unit test and the client-navigation e2e; PR #35's one red test fixed (the e2e expected the old default model), its merge waiting on CI; `admin/arabic` delivered (ADR-056, 272 strings, 198 overrides of Payload's pack), awaiting review; `site/audit-fixes` building.
- 2026-09-18 08:00 to 13:00 UTC: PR #37 the Arabic admin (CTO 94), #39 side-by-side editing (CTO 93, its migration applied to the review database), #40 the dashboard (CTO 92), #41 the sidebar (CTO 93), #42 the admin audit's fixes 1, 2, 3 and 7 (CTO 90), #43 the rules' sentences in both languages (CTO 93): Phase 2 complete on main da6de95. PR #38 the site audit's fixes (CTO 92) with item 12 the JS floor folded in (CTO 93): the first CI run failed the home JS budget by 4 KB (the accordion in the root layout's chunk through the `@/modules/core` barrel), the second the designer's stand-in (two at once under selective hydration, the deep-link scroll under `scroll-behavior: smooth`); both fixed.
- 2026-09-18 13:30 UTC: Phase 4. The temporary domain on main da6de95: health `db: ok, media: s3`, 14 routes 200, the admin in English and Arabic (an Arabic browser gets the RTL panel at the login page), the sidebar's five groups, the dashboard's four tiles and five sections, a bilingual twin, one publish and one upload through the API (both undone): `scripts/dev/cranl-smoke.mjs`, 22 of 22. The official Lighthouse pass on the merged head in the audit's "After the fixes" section. Programme complete; the report to Dhia sent in chat.
