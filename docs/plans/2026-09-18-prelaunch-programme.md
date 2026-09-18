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

- [ ] **Site audit** (`site.md`): every route in Arabic and English on the review server;
  content (typos, placeholders, ar/en parity, tone), SEO (titles, descriptions, canonicals,
  hreflang, JSON-LD validity, sitemap, robots, OG), GEO (llms.txt, FAQPage, answer-first
  openings, the compare page), photos (format, `sizes`, LCP element, lazy loading, CLS),
  speed (Lighthouse mobile and desktop on every route), responsive (screenshots at 360,
  390, 768, 1024, 1280, 1920; overflow, wrapping, tap targets), bugs (console errors,
  broken links, forms, 404/410, the designer, the language switch, the header island).
- [ ] **Admin audit** (`admin.md`): every collection, global and view walked as admin and as
  editor; the sidebar and its groups; the text of every label and description (clarity,
  consistency, ux-araby for Arabic); the edit forms' organisation (tabs, rows, order);
  what the dashboard shows and what it should; where bilingual editing hurts today; a
  Cloudflare-style sidebar proposal; the RTL readiness of our custom components.
- [ ] **AI cost audit** (`ai-cost.md`): every scheduled job and its cost driver; the prompts'
  periods; the models on each connection and cheaper equivalents; the engine's model; a
  monthly estimate before and after.

Criteria: three reports exist, each with a graded list and a fix order; the CTO has read
them and agreed the fix list (a written note in each report's foot).

## Phase 1: The site (scroll reveal, then the audit's fixes)

- [ ] **Scroll reveal everywhere** (ADR to write): one observer mounted once, every
  `Section`, `SectionHeader`, card and block carries `data-reveal` by default (an opt-out
  prop), staggered inside grids, off under reduced motion, never the hero or anything above
  the fold, hidden only under `html.js` so content is always there without JavaScript;
  future components inherit it through the primitives.
- [ ] **Content, SEO, GEO fixes** from the audit.
- [ ] **Photos and speed fixes** from the audit.
- [ ] **Responsive and bug fixes** from the audit.

Criteria: Lighthouse mobile performance >= 90 and SEO/a11y/best practices = 100 on every
public route (the CI gate's five plus the rest, by `scripts/dev/lh-all.sh`); axe zero serious
on every route; zero broken links and zero console errors on a crawl of both languages;
every e2e green on the three device projects; the reveal e2e (a section below the fold is
hidden with JS until scrolled into view, visible without JS, visible at once under reduced
motion); the CTO's GO; the temporary domain checked after the merge.

## Phase 2: The admin

- [ ] **Arabic admin with RTL**: Payload's `ar` translations on, the language switch in the
  account menu, every custom string of ours in both languages, every custom component
  RTL-correct (logical properties only), the dashboard, the views and the sidebar checked in
  Arabic by the admin e2e in both languages.
- [ ] **The sidebar** (Cloudflare-like): groups with a clear open/close control in a usable
  place, separation between groups, the active entry unmistakable, the collapse control
  where the hand expects it, the same on narrow screens.
- [ ] **Dashboard numbers**: what matters at a glance (visits and sources over 7 and 30 days,
  citations and the cited rate, drafts waiting, published this week, jobs failed, the
  engine's spend and limits, the ledger's next run), each a link to its place.
- [ ] **Text and organisation review**: every label, description and empty state read for
  clarity in both languages; forms reorganised where the audit says; the admin design
  system doc updated.
- [ ] **Side-by-side bilingual editing**: the approach settled with the CTO before code (a
  custom field wrapper for localized fields showing both languages at once, saved in one
  go), applied to every localized text, textarea and select field, with rich text handled
  as the approach allows; the locale switch kept for the rest.

Criteria: the admin e2e green in English and Arabic; axe zero serious on every admin
surface; `tests/admin-config.test.ts` green (descriptions in both languages on every
field); the design system doc and the admin rules updated; the CTO's GO per PR.

## Phase 3: The AI spend

- [ ] Prompts' periods weekly (the seed default and the rows on the review and production
  databases); the brand prompts too unless the audit argues for one daily.
- [ ] Cheaper models on each connection where the audit shows equal signal (Gemini 3 Flash,
  Claude Haiku 4.5 or Claude off), a monthly limit on every AI connection; the engine's
  default model reviewed.
- [ ] The visibility pull and the traffic pull kept daily (no spend).

Criteria: the RUNBOOK's "What it costs" table updated with the new estimate; the rows
changed on both databases by a script that prints what it changed; no ledger run triggered.

## Phase 4: Verification and the report

- [ ] Every CI line green on `main`; the temporary domain smoke-tested (health, the routes,
  the admin in both languages, a publish, an upload).
- [ ] Memory and `docs/LAUNCH-CHECKLIST.md` updated.
- [ ] The final report to Dhia: what was done per phase, the numbers before and after, the
  checklist of what remains his (keys, the cutover), and the next steps.

## Status log

- 2026-09-18 02:30 UTC: programme written; Phase 0 agents launched.
