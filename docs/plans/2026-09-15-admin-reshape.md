# Admin reshape: five task groups, tabs, colour, "what it does", Connections

Date: 2026-09-15. Project 1 of 4 (then: traffic sources, the visibility score, GEO content).
Three PRs: `admin/reshape-shell`, `admin/reshape-forms`, `admin/connections`. Status: design,
for Dhia's approval and the CTO's plan review.

## Why

Dhia (2026-09-15): the admin is hard to use; too many pages, each used differently, very few
colours to guide him, some options confusing. Keep every option; make it clear what each does;
clearer icons; a simpler side menu with things merged.

What the panel is today (screenshots at 1440 px, signed in as Dhia; the configs):

- The sidebar is 19 doors in 5 groups, all one grey. Content lists 7 entries with "Home page"
  last (Payload appends globals after collections); Blog is 4 entries for one activity; AI
  content 3 for one machine; Settings 4 globals with unclear boundaries.
- Every big form is one scroll: Home has 23 top-level fields plus every section's arrays;
  Product 23; Post 21; Site settings 15. Only Engine settings uses tabs. No field says where
  on the site it shows.
- Colour is deliberately restricted (ADR-039): blue = action, green = live, red = delete,
  amber = careful; identity hues only on the dashboard's icon discs. The rule is right; what
  is missing is identity colour everywhere else.
- Descriptions are terse ("e.g. S – 2XL", "%s is the page title") or absent.

## Decisions taken with Dhia (interview, 2026-09-15)

1. Order of the four projects: admin reshape → traffic sources → score → GEO content.
2. Five task groups with one colour each: Site · Catalogue · Blog · Visibility · Admin.
3. Navigation folded into Site settings as a tab (a data migration), not nested as a page.
4. The big forms become tabs, one per section, in site order.
5. Every field gets a description that says what it does on the site (about 150 fields).
6. Connections: one page for every API (the AI providers now; Search Console, Bing,
   PageSpeed with the score), each with a test, a monthly limit and a status; the content
   engine and later the prompt tracking pick a connection instead of holding keys.

Mock shown to Dhia before the decisions: https://claude.ai/code/artifact/c91b6da7-bf45-4cde-ad1f-16b782cb6455

## Design

### D1. Groups and the sidebar (PR A)

- `ADMIN_GROUPS` in `src/modules/cms/admin/icons.ts` becomes the registry of five groups, each
  `{ ar, en, hue, icon, order }`: `site` (blue, Globe), `catalogue` (teal, ShoppingBag), `blog`
  (violet, Newspaper), `visibility` (orange, Radar), `admin` (slate, Shield). `slate` is a new
  neutral hue token in `admin.css` (`#cbd5e1` on a 12 % tint; ≥ 5.8:1 on `surface`, like the
  others). `COLLECTION_HUES` / `GLOBAL_HUES` are removed: an entity's hue is its group's
  (`entityHue` reads the registry). Replace, don't deprecate.
- Membership by `admin.group` as today, plus `admin.custom.nav` on the config:
  `{ order: number; parent?: EntitySlug; section?: 'engine' }`. `parent` makes a secondary
  entry (indented under its parent, small icon, no disc); `section` renders the "Content
  engine" sub-heading inside Blog. Home page is first in Site by `order`, not last.

  | Group | Primary entries (order) | Secondary |
  | --- | --- | --- |
  | Site | Home page, Pages, Site settings, Media | (Menus & footer is a tab of Site settings) |
  | Catalogue | Products, Store integrations, Testimonials, FAQ | |
  | Blog | Posts | Hubs, Authors, Tags; Content engine: Topics, Runs, Engine settings |
  | Visibility | Search defaults, Redirects | (Score and Traffic sources come with projects 3 and 2) |
  | Admin | Users, Connections (PR C) | |

- `navGroups()` (`admin/nav/groups.ts`) keeps using Payload's `groupNavItems` for permissions
  and hidden entities, then shapes the result by the registry: group order, entry order,
  children under their parent, the engine section. Collections carry a `count` from
  `payload.count` (12 queries per admin page render, in `Promise.all`; measured on the review
  server, cached 60 s with `unstable_cache` only if the total passes 50 ms). The command
  palette reads the same data, so the two never disagree (as today).
- `nav-client.tsx`: group header = tinted disc with the group icon + uppercase label; primary
  entry = tinted disc with the entity icon + label + count; secondary entry = indented, icon
  only; the active entry sits on its group's tint (`data-hue`, tint classes literal so the
  scanner keeps them); the collapsed rail shows the discs. `data-admin-group`, `data-admin-nav`
  and the keyboard behaviour are unchanged. Labels: Integrations → Store integrations, SEO
  defaults → Search defaults, Runs keeps its name with a History icon; Engine settings keeps
  its name with a SlidersHorizontal icon; slugs do not change (no table renames for a label).

### D2. The page header (PR A)

- One `EntityHeader` server component registered as the entity's description slot under
  Payload's title (`admin.components.Description` on collections, shared by the list and edit
  views, so the list page carries the same sentence; `admin.components.elements.Description`
  on globals): a 3 px rule in the group's
  hue across the top of the document area, the entity icon in a tinted disc, the description
  sentence, a second sentence from `admin.custom.shows` ("Shows on b7r.sa and b7r.sa/en · every
  page" / "the home page, 2nd section"), and "View on site" when the entity has
  `admin.preview`. The `LocaleNote` (ADR-044) folds into it as the third line, so one component
  says: what this is, where it shows, which language is open. `admin/locale/config.ts` becomes
  `admin/document/config.ts` and registers the one component.
- Home's header adds "7 sections, N on" from the form state (`useFormFields` in a small client
  child). No live dots on tab labels: Payload tab labels are static strings; the switch at the
  top of each tab carries the state.

### D3. Forms as tabs, Navigation folded in (PR B)

Unnamed Payload tabs keep the data shape, so every tab below is a config change with no
migration, except the Navigation move.

| Document | Tabs |
| --- | --- |
| Home page | Hero · Three steps · Video · Why us · Testimonials · Integrations · FAQ · Search & share |
| Product | Basics (name, slug, short description, description, base cost, suggested price, order) · Photos & colours · Sizes (sizes, summary, material, weight) · Print area (label, canvas fractions, print method) · Search |
| Post | Content · Cover & summary (cover, excerpt, hub, tags, author, dates) · Search · Engine (the run fields) |
| Page | Content · Search |
| Site settings | Brand · Contact · Social · Menus & footer · Numbers & legal |
| Engine settings | as today (Providers becomes "Connection" in PR C) |

Each section tab of Home opens on its `enabled` switch (already the first field of each
section group) with the consequence in its description and the section's position on the
page ("the 2nd section, under the hero").

**Navigation → Site settings.** The `navigation` global's fields move into `site-settings` as
a `menu` group under the Menus & footer tab: `menu.primary` (6), `menu.policies` (4),
`menu.ctaLabel`, and its three labels `menu.skipLinkLabel`, `menu.menuOpenLabel`,
`menu.menuCloseLabel` (interface text, but Dhia chose on 2026-09-15 to keep them editable;
their descriptions say exactly where each is read: the keyboard skip link, the burger's
accessible name open and closed).
Migration: create `site_settings_menu_primary(_locales)` and `site_settings_menu_policies(_locales)`,
copy the rows with `_parent_id` remapped to the site-settings row, copy the four localized
strings into `site_settings_locales.menu_*` per locale, then drop the `navigation*` tables (the
data-carrying statements precede the generated drops, as in the hero migration). `down`
restores. `content/schema.ts` `Navigation` is read from site-settings by the mapper; the two
seeds and `scripts/migrate-content*.ts` follow; `pnpm generate:types`; the golden HTML diff
(`scripts/dev/golden.mjs`) proves the site's menus unchanged.

### D4. Every field says what it does (PR B)

Rule for every non-hidden field, in the config's `admin.description` (`en` for the panel,
`ar` pair per ux-araby): first what it does on the site and where ("Shows on the product card
under the price and in the designer's product picker"), then the limit or an example ("Short:
S – 2XL, مقاس واحد"). Labels reviewed as nouns. Five examples:

| Field | Today | After |
| --- | --- | --- |
| products.sizesSummary | e.g. S – 2XL | Shows on the product card under the price and in the designer's product picker. Short: "S – 2XL", "مقاس واحد". |
| seo-defaults.titleTemplate | %s is the page title | The browser tab and the Google result title of every page: %s becomes the page's own title. Keep the part after the bar under 15 characters. |
| products.baseCost | Must match the app: there is no automatic sync. | What the merchant pays per piece; shows on the product page, the calculator and llms.txt. Must equal the app's price: there is no sync. |
| home.steps.enabled | (from `enabled()`) | Off hides the Three steps section from the home page in both languages. It is the 2nd section, under the hero. |
| site-settings.legalEntity | | The company name in the footer's copyright line and the legal pages of both languages. |

`tests/admin-config.test.ts` gains a rule: every non-hidden field of every collection and
global has an `admin.description` with both languages, and neither is under 6 words; the test
names the offenders, so the pass cannot regress.

### D5. Icons (PR A)

Group icons as in D1. Entity changes: Runs → History, Engine settings → SlidersHorizontal,
Search defaults → Search (unchanged), Connections → KeyRound; the rest stay (they were right).
`tests/admin-icons.test.ts` keeps guarding the registry.

### D6. Dashboard (PR A)

Quick actions keep their six tiles, ordered and hued by group (Home page, Add a page: Site;
Add a product, Add a question: Catalogue; Write a post: Blog; View website: green, live). The
latest-changes discs use group hues. System status unchanged. The Traffic card comes with
project 2.

### D7. Connections (PR C)

- New collection `connections` (Admin group, admin-only read/update, `useAsTitle: label`):
  `kind` (select: OpenAI, Anthropic, Google Gemini, DeepSeek, Perplexity, OpenAI-compatible
  endpoint; Google Search Console, Bing Webmaster, PageSpeed Insights arrive with project 3),
  `label`, `apiKey` (the engine's secret field: encrypted at rest with `PAYLOAD_SECRET`, masked
  on read, unchanged scheme), `baseUrl` (OpenAI-compatible only), `model`, `rates`
  (input/output USD per million tokens, for the cost estimate), `monthlyLimitUsd`, `enabled`,
  and read-only `spentThisMonthUsd`, `callsThisMonth`, `lastTestAt`, `lastTestOk`,
  `lastTestMessage`, `usedBy` (computed: "Content engine" when it is the engine's connection).
- "Test" document action (the engine's action pattern): one minimal request through the AI
  SDK; records the result and the timestamp; admin only; rate-limited to one per 10 s.
- A `connection-usage` ledger collection `{ connection, month, usd, calls }` written by every
  run (the engine already estimates cost per run); the collection's read-only numbers come
  from it. A run is refused when `spent + estimate > limit`; the engine card and the health
  card show "Connection limit reached" in amber; the dashboard's list shows the spend bar.
- Engine: `ai-settings.activeProvider` and the per-vendor key/model/rates groups are replaced
  by one `connection` relationship (required); `provider/sdk.ts` receives the connection's
  kind, key, model and base URL. The mock provider stays for tests (kind `mock`, no key;
  refused in production as today).
- Verification tokens leave `seo-defaults`: two connections of kinds Google Search Console and
  Bing Webmaster hold `verificationToken` now (the layout reads them from there) and the API
  credentials with project 3.
- Migration: one `connections` row per configured vendor from `ai_settings` (ciphertext copied
  as is: same secret scheme), the relationship set from `active_provider`, the verification
  rows from `seo_defaults`, then the columns dropped. `down` restores.
- Docs: ADR-047 (Connections), RUNBOOK (adding a connection, the limit, the test), BRD 10.2
  amended (the engine's provider settings).

### Out of scope

Payload's list and edit views, Lexical, the theme, permissions, login (rules in
`.claude/rules/admin-ui.md`); the Score and Traffic pages (projects 3 and 2); the site itself.

## PRs, evidence, acceptance

- **PR A `admin/reshape-shell`**: D1, D2, D5, D6; ADR-046 (the reshape) and the design-system
  doc (§4 icons, §2 hues, the group registry, the header). No data changes. Evidence: admin e2e
  (group order and labels, hues by `data-hue`, secondary entries under Posts, the engine section,
  counts, the header's rule/disc/shows sentence, the Home count "N on", View on site), the
  palette still finds every entity, axe on the sidebar and a header; screenshots before/after at
  1440 and 390 px, both panel locales.
- **PR B `admin/reshape-forms`**: D3, D4; the migration proven on the review database (`/` and
  `/en` menus identical by the golden diff); BRD 9.3/9.4 and the RUNBOOK amended. Evidence:
  e2e (every tab present per document, the Menus & footer tab holds the six links, a save
  through the tab publishes the same menu, the description test green), unit (mapper reads
  the merged global; seed idempotent), `pnpm generate:types` diff committed.
- **PR C `admin/connections`**: D7; ADR-047. Evidence: e2e (create a connection with the mock
  kind, Test records ok, the engine runs with it, the limit refuses a run and the cards say
  so; an editor cannot open Connections), unit (usage ledger arithmetic, the refusal rule,
  the secret round-trip), migration on the review database.
- Each PR: CTO code review ≥ 90, both CI check lines, merged through `scripts/merge-pr.sh`.
