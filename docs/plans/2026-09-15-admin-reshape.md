# Admin reshape: five task groups, tabs, colour, "what it does", Connections

Date: 2026-09-15. Project 1 of 4 (then: traffic sources, the visibility score, GEO content).
Four PRs: `admin/reshape-shell`, `admin/reshape-menus`, `admin/reshape-forms`,
`admin/connections`. Status: approved by Dhia (design and decisions, 2026-09-15); CTO plan
review 77, revision 1 re-reviewed 93 GO.

## Why

Dhia (2026-09-15): the admin is hard to use; too many pages, each used differently, very few
colours to guide him, some options confusing. Keep every option; make it clear what each does;
clearer icons; a simpler side menu with things merged.

What the panel is today (screenshots at 1440 px, signed in as Dhia; the configs):

- The sidebar is 19 doors in 5 groups, all one grey. Content lists 7 entries with "Home page"
  last (Payload appends globals after collections); Blog is 4 entries for one activity; AI
  content 3 for one machine; Settings 4 globals with unclear boundaries.
- Every big form is one scroll: Home has 10 section groups on one page; Product 23 fields;
  Post 21; Site settings 15. Only Engine settings uses tabs. No field says where on the site
  it shows.
- Colour is deliberately restricted (ADR-039): blue = action, green = live, red = delete,
  amber = careful; identity hues only on the dashboard's icon discs. The rule is right; what
  is missing is identity colour everywhere else.
- Descriptions are terse ("e.g. S – 2XL", "%s is the page title") or absent.

## Decisions taken with Dhia (interview, 2026-09-15)

1. Order of the four projects: admin reshape → traffic sources → score → GEO content.
2. Five task groups with one colour each: Site · Catalogue · Blog · Visibility · Admin.
3. Navigation folded into Site settings as a tab (a data migration), not nested as a page.
4. The big forms become tabs, one per section, in site order.
5. Every field gets a description that says what it does on the site.
6. Connections: one page for every API (the AI providers now; Search Console, Bing,
   PageSpeed with the score), each with a test, a monthly limit and a status; the content
   engine and later the prompt tracking pick a connection instead of holding keys.
7. The three menu labels (skip link, menu open, menu close) stay editable in the CMS. ADR-031
   would put interface text in the copy bank, and the CTO read it the same way; Dhia chose to
   keep them. ADR-046 records the exception; they sit in the Menus & footer tab with
   descriptions that say exactly where each is read.

Mock shown to Dhia before the decisions: https://claude.ai/code/artifact/c91b6da7-bf45-4cde-ad1f-16b782cb6455

## Design

### D1. Groups and the sidebar (PR A)

- `src/modules/cms/admin/icons.ts` becomes the registry of everything the shell knows about an
  entity, typed against the generated config so a new collection or global without an entry
  is a type error (ADR-039's guarantee, kept): `ADMIN_GROUPS` = five groups
  `{ ar, en, hue, icon, order }`: `site` (blue, Globe), `catalogue` (teal, ShoppingBag), `blog`
  (violet, PenLine), `visibility` (pink, Radar), `admin` (slate, Shield); and `ADMIN_NAV`, a
  `Record<CollectionSlug | GlobalSlug, { group, order, parent?, section? }>`. `admin.group`
  stays on each config (Payload groups by it, permissions and hidden entities come from
  `groupNavItems`) and `tests/admin-config.test.ts` asserts the config's group and the
  registry's agree. `COLLECTION_HUES` / `GLOBAL_HUES` are removed: an entity's hue is its
  group's (`entityHue` reads the registry). `slate` is a new neutral hue token in
  `admin.css` (`#cbd5e1` text on a 12 % tint; ≥ 5.8:1 on `surface`; the disc is checked
  against the 50 % disabled state of §7 so the two never look alike). Pink, not orange, for
  Visibility: orange sits next to amber, the "careful" colour.

  | Group | Primary entries (order) | Secondary |
  | --- | --- | --- |
  | Site | Home page, Pages, Site settings, Media | (Menus & footer is a tab of Site settings) |
  | Catalogue | Products, Store integrations, Testimonials, FAQ | |
  | Blog | Posts | Hubs, Authors, Tags; section "Content engine": Topics, Runs, Engine settings |
  | Visibility | Search defaults, Redirects | (Score and Traffic sources come with projects 3 and 2) |
  | Admin | Users, Connections (PR C) | |

- `navGroups()` (`admin/nav/groups.ts`) keeps `groupNavItems`, then shapes by the registry:
  group order, entry order, children under their parent, the engine section. Collections
  carry a `count` from `payload.count` (fourteen collections, `Promise.all`, never cached:
  a stale number right after "Create" is worse than none). Measured on the review server with
  and without `req`; if the total passes 50 ms the counts are dropped, not cached. The
  command palette reads the same data, so the two never disagree.
- `nav-client.tsx`: group header = tinted disc with the group icon + uppercase label; primary
  entry = tinted disc with the entity icon + label + count; secondary entry = indented, small
  icon, no disc; the active entry sits on its group's tint with weight and `aria-current`
  (an amendment of design system §2, written in ADR-046: blue keeps the main action, links
  and the Site group; the active entry's tint is its group's identity). Tint classes are
  literal so the scanner keeps them; `data-hue` on the entry for the e2e. The collapsed rail
  shows the discs. `data-admin-group`, `data-admin-nav` and the keyboard behaviour are
  unchanged; the `nav` preference is keyed by group label, so renaming the groups resets
  everyone's open/closed state once (expected). Labels: Integrations → Store integrations,
  SEO defaults → Search defaults; Runs keeps its name with a History icon; Engine settings
  keeps its name with a SlidersHorizontal icon; slugs do not change.

### D2. The page header (PR A)

- One `EntityHeader` server component in the description slot under Payload's title
  (`admin.components.Description` on collections, shared by the list and edit views;
  `admin.components.elements.Description` on globals): inside its own block, an inline-start
  bar and the entity icon in a tinted disc in the group's hue (nothing positioned outside the
  slot, so a Payload upgrade cannot move it), the description sentence, and a second sentence
  from `admin.custom.shows` (`{ ar, en }` next to the description in the config: "Shows on
  b7r.sa and b7r.sa/en, every page" / "the home page, 2nd section, under the hero"). On the
  list view of a collection with a public listing (products, posts, pages) it adds a plain
  link to that listing; the edit view keeps Payload's Preview button (`admin.preview`,
  ADR-039). `data-admin-ui`, `data-admin-header`; joins the axe pass.
- The `LocaleNote` (ADR-044) stays where it is (`beforeDocumentControls`, registered on every
  localized config): the description slot also renders on list views, where "Editing the
  English content" would be wrong.
- Home's header adds "10 sections, N on" (six carry a switch; the other four are always on)
  from the form state (`useFormFields` in a small client child; the slot renders inside the
  edit form). No live dots on tab labels: Payload tab labels are static strings; the switch at
  the top of each tab carries the state.

### D3. Menus first (PR B1), then forms as tabs (PR B2)

**PR B1, Navigation → Site settings.** The only step that can lose data, so it ships alone and
small. The `navigation` global's fields move into `site-settings` as a `menu` group:
`menu.primary` (6), `menu.policies` (4), `menu.ctaLabel`, `menu.skipLinkLabel`,
`menu.menuOpenLabel`, `menu.menuCloseLabel` (decision 7). Migration (the hero migration's
pattern, `20260914_170855_*`; both globals are unversioned): look up the `navigation` and
`site_settings` row ids (never assumed), create `site_settings_menu_primary(_locales)` and
`site_settings_menu_policies(_locales)`, copy the rows carrying `_order` and `_locale` with
`_parent_id` remapped, copy the four localized strings into `site_settings_locales.menu_*`
per locale, then drop the `navigation*` tables; `down` restores. Readers that change:
`content/schema.ts` (`Navigation` parsed from the site-settings document), `lib/cms/mappers.ts`,
`lib/cms/settings.ts` (`getNavigation` reads from the same `React.cache`d site-settings read,
not a second `findGlobal`), `lib/cms/locale-enabled.ts` (the English gate reads
`menu.ctaLabel`; the proxy's `/api/pages/slugs/en` depends on it, ADR-043), both seeds,
`scripts/migrate-content*.ts`, `pnpm generate:types`, BRD 9.4. Proof: the golden HTML diff
(`scripts/dev/golden.mjs`) shows `/` and `/en` unchanged after the migration and the seed.

**PR B2, tabs and descriptions.** Named tabs replace the section groups where a group exists
(a named tab stores under the same path and column prefix: no migration, and the section
label is not doubled); unnamed tabs group flat fields. Sidebar fields stay in the sidebar
(ADR-041, design system §6). Written from the configs:

| Document | Tabs (in site order) |
| --- | --- |
| Home page | Hero · Product strip · Designer · Three steps · Video · Why us · Testimonials · Integrations · FAQ · Ribbon (ten named tabs, one per section group) |
| Product | Basics (name, slug, short description, description, base cost, suggested price, order) · Photos & colours (colours) · Sizes (sizes, sizes summary, material, weight) · Print area (label, canvas fractions, print method) |
| Post | Content (title, slug, body) · Summary & cover (excerpt, takeaways, cover, hub, tags) · Search (seo); the sidebar keeps author, dates, reading time, origin, engine actions, warnings |
| Page | Content (title, slug, lead, blocks) · Search (seo) |
| Site settings | Brand (brand name, Latin name, tagline) · Contact & social · Menus & footer (the `menu` group) · Numbers & legal (welcome credit, delivery days, origin, region, booking URL, legal entity) |
| Engine settings | as today (Providers becomes "Connection" in PR C) |

Each section tab of Home opens on its `enabled` switch where one exists (already the first
field of those groups) with the consequence and the section's position on the page.

### D4. Every field says what it does (PR B2)

Rule for every field that an editor sees, in the config's `admin.description` (`en` for the
panel, `ar` pair per ux-araby): first what it does on the site and where ("Shows on the
product card under the price and in the designer's product picker"), then the limit or an
example ("Short: S – 2XL, مقاس واحد"). Labels reviewed as nouns. Five examples:

| Field | Today | After |
| --- | --- | --- |
| products.sizesSummary | e.g. S – 2XL | Shows on the product card under the price and in the designer's product picker. Short: "S – 2XL", "مقاس واحد". |
| seo-defaults.titleTemplate | %s is the page title | The browser tab and the Google result title of every page: %s becomes the page's own title. Keep the part after the bar under 15 characters. |
| products.baseCost | Must match the app: there is no automatic sync. | What the merchant pays per piece; shows on the product page, the calculator and llms.txt. Must equal the app's price: there is no sync. |
| home.steps.enabled | (from `enabled()`) | Off hides the Three steps section from the home page in both languages. It is the 4th section. |
| site-settings.legalEntity | | The company name in the footer's copyright line and the legal pages of both languages. |

`tests/admin-config.test.ts` gains a rule: every field with a name that an editor sees has an
`admin.description` with both languages non-empty, at least four words each; excluded are
layout fields (row, collapsible, tabs, unnamed group), `ui` fields, `hidden`, `readOnly` and
`label: false` fields. The test names the offenders; the sentences themselves get Dhia's read,
not a counter's. The descriptions and the tabs ship together: both say "where", both are
written with the site component open, and Dhia reads the ~300 strings once.

### D5. Icons (PR A)

Group icons as in D1 (Blog's is PenLine, not Newspaper, which stays on Posts). Entity
changes: Runs → History, Engine settings → SlidersHorizontal, Connections → KeyRound (PR C);
the rest stay. `tests/admin-icons.test.ts` keeps guarding the registry.

### D6. Dashboard (PR A)

Quick actions keep their six tiles, ordered and hued by group (Home page, Add a page: Site;
Add a product, Add a question: Catalogue; Write a post: Blog; View website: green, live). The
latest-changes discs use group hues. System status unchanged. The Traffic card comes with
project 2.

### D7. Connections (PR C)

- New collection `connections` (Admin group, admin-only read/update, `useAsTitle: label`,
  `EnabledSwitch` on `enabled` with its consequence): `kind` (select: OpenAI, Anthropic,
  Google Gemini, DeepSeek, the four vendors `provider/sdk.ts` already speaks; Mock for tests,
  refused in production as today; OpenAI-compatible endpoint, which needs no dependency
  (`createOpenAI({ apiKey, baseURL })`), for the "any AI with an API" Dhia asked for, with
  `baseUrl` validated as `https://` and shown only for that kind); `label`, `apiKey` (the
  engine's secret field: encrypted at rest with `PAYLOAD_SECRET`, masked on read, unchanged
  scheme), `model`, `rates` (input/output USD per million tokens), `monthlyLimitUsd`,
  `enabled`; read-only `lastTestAt`, `lastTestOk`, `lastTestMessage`; and two virtual,
  derived numbers `spentThisMonthUsd` and `callsThisMonth`. Perplexity and the analytics kinds
  (Search Console, Bing, PageSpeed) arrive with project 3, with their consumers.
- **No ledger.** `ai-runs` already records `costUsd`, `provider` and `startedAt` per run, and
  the caps and the engine card already sum them; `ai-runs` gains a nullable `connection`
  relationship (relabel the `provider` column "Connection", keep the text for history), and
  one shared `connectionSpend(id)` helper (runs of that connection since the Riyadh month
  start, `status != skipped`) feeds the header, the card and the cap. A Test does not count.
- **The limit.** The rule `capDecision` already applies to the daily cap: refuse a run when
  `spentThisMonthUsd >= monthlyLimitUsd` (overshoot at most one run), through
  `counts.connectionSpentMonthUsd` / `settings.connectionMonthlyLimitUsd`, for freshness runs
  too. `dailyCostCapUsd` stays on the engine's Cadence tab: two guards, one daily per engine
  and one monthly per connection; both descriptions say so.
- **Off and missing.** `enabled: false` refuses every run at run time ("its connection is
  off"), not only in the picker; the engine card and the health card say so in amber; Test
  still works on an off connection. No connection (the relationship null after a migration
  that found no key, or after a delete): the engine refuses with "no connection", the health
  card shows "No connection" in red. A `beforeDelete` hook refuses deleting the engine's
  connection with a public `APIError` ("The content engine uses this connection; pick another
  first").
- **Test.** `POST /api/connections/test { id }` behind `adminOnly` (`api/guard.ts`): one
  `generateText` with a fixed prompt, `maxOutputTokens: 8`, a 20 s abort; the key read with
  `context.decryptKeys` through the Local API; writes `lastTestAt`, `lastTestOk`,
  `lastTestMessage` (the model id on success; on failure the vendor's message truncated to
  200 characters, never the key, never a URL that may carry it); one test per id per 10 s in
  an in-memory map (one container, ADR-033; not persisted); the button renders only for a
  saved document and reads "Save, then test" while the form is dirty; the mock kind answers
  ok without a call.
- **Engine.** `ai-settings.activeProvider` and the per-vendor key/model/rates groups are
  replaced by one `connection` relationship (required, `filterOptions` to the engine-capable
  kinds); `provider/sdk.ts` receives the connection's kind, key, model and base URL. The
  compatible kind calls the chat API (`createOpenAI({ apiKey, baseURL }).chat(model)`): the
  callable provider is the Responses API, which compatible endpoints do not serve; the unit
  test for the kind covers it.
- **Module.** `src/modules/connections/` (the collection, `spend.ts`, the delete guard, the
  Test handler, `admin/test-action.tsx`) imports only the leaf `ai-content/provider/sdk.ts`;
  `ai-content/settings.ts` names the collection by slug in `relationTo` and imports nothing
  from it; the spend helper and the guard read `ai-runs` and `ai-settings` by slug. One-way
  dependency, no cycle. The runs list keeps the `provider` text out of `defaultColumns` once
  `connection` exists.
- **Migration.** Row ids looked up; one `connections` row per vendor with a key in
  `ai_settings` (ciphertext copied as is, same scheme); `active_provider = 'mock'` creates a
  mock connection and points to it; no key anywhere leaves the relationship null and the
  engine refusing with "no connection"; then the provider columns are dropped; `down`
  restores. Backfilling `ai-runs.connection` from the provider text is done where the text
  names a migrated vendor.
- The verification tokens stay in `seo-defaults` until project 3 moves them with the API
  credentials in one migration.
- Docs: ADR-047 (Connections), RUNBOOK (adding a connection, the limit, the test), BRD 10.2
  amended (the engine's provider settings).

### Out of scope

Payload's list and edit views, Lexical, the theme, permissions, login (rules in
`.claude/rules/admin-ui.md`); the Score and Traffic pages (projects 3 and 2); the site itself.

## PRs, evidence, acceptance

- **PR A `admin/reshape-shell`**: D1, D2, D5, D6; ADR-046 (the reshape and the §2 amendment);
  design-system doc (§2 hues and the active tint, §4 icons, §6 sidebar and header rows);
  `tests/admin-config.test.ts` and `e2e/admin.spec.ts` updated for the group names; BRD 10.2.7
  (the AI content group becomes the engine section under Blog); `pnpm payload
  generate:importmap` committed. No data changes. Evidence: admin e2e (group order and
  labels, hues by `data-hue`, secondary entries under Posts, the engine section, counts, the
  header's bar/disc/shows sentence, the Home count, the listing link on list views), the
  palette still finds every entity, axe on the sidebar and a header; screenshots before/after
  at 1440 and 390 px, both panel locales; the count timing printed in the PR.
- **PR B1 `admin/reshape-menus`**: the Navigation merge; the migration proven on the review
  database; the golden diff; unit (mapper, locale gate, seed idempotent); `generate:types`
  diff committed; BRD 9.4.
- **PR B2 `admin/reshape-forms`**: D3's tabs, D4; RUNBOOK. Evidence: e2e (every tab per
  document from the table above, a save through a tab publishes the same content, the
  description test green), screenshots of each tabbed form.
- **PR C `admin/connections`**: D7; ADR-047. Evidence: e2e (create a connection of the mock
  kind, Test records ok, the engine runs with it, the monthly limit refuses a run and the
  cards say so, an off connection refuses, the delete guard, an editor cannot open
  Connections), unit (the spend helper, the refusal rules, the secret round-trip, the
  compatible kind's chat call), the migration on the review database; the three callers that
  set `activeProvider: 'mock'` today (`scripts/dev/engine-demo.mjs`, `e2e/admin.spec.ts`,
  `tests/helpers/engine-store.ts`) create or pick the mock connection instead.
- Each PR: CTO code review ≥ 90, both CI check lines, merged through `scripts/merge-pr.sh`.
