# Implementation Plan: Admin panel shell, dashboard and design system

**Branch**: `admin/ui-1` (from `main` after PR #3 merges) | **Date**: 2026-09-13 |
**Spec**: `specs/007-admin-ui/spec.md`
**CTO plan review**: 2026-09-13, GO 90, amendments folded below (proxy passthrough on the draft
cookie and unfiltered draft reads; `lastPublishedBy` as a name snapshot; palette search rules; a
config-shape test instead of a wrapper; ADR-039; contrast and CSS-scanning notes).

## Summary

Payload keeps rendering the edit and list views; we own everything around them. Three
reviewed phases: (1) the foundation, B7R tokens on Payload's dark theme, Tailwind and the
shadcn primitives available inside the admin, an icon registry, the written design system and
the rules file; (2) the shell, sidebar with icons and groups, header with a command palette
and a "view site" link, account menu, branded login; (3) the dashboard, quick actions, system
health, recent activity, plus the preview button (Next draft mode), the field widgets, and
Arabic descriptions and columns on every collection. Dark only, by Dhia's choice.

## Technical context (verified against `@payloadcms/ui` / `@payloadcms/next` 3.89.0)

- **Extension points**: `admin.components.Nav` (whole sidebar, server component with
  `ServerProps` + `visibleEntities` + `permissions`), `actions` (header), `settingsMenu`,
  `logout.Button`, `graphics.Logo/Icon`, `afterLogin`, `views.dashboard.Component`
  (server component; wrap in `DefaultTemplate` from `@payloadcms/next/templates` to keep the
  chrome), per-collection `admin.preview` (+ Payload's own «Preview» button), per-field
  `admin.components.Field`, `admin.description`, `defaultColumns`, `i18n.translations` for
  Arabic strings Payload owns. `admin.theme: 'dark'` removes the light theme.
- **CSS layering**: Payload's styles live in `@layer payload-default, payload` (app.scss:1).
  Unlayered CSS wins over any layer, so Tailwind utilities imported **without** `layer()`
  (`@import 'tailwindcss/theme.css'; @import 'tailwindcss/utilities.css';`, no preflight,
  Payload keeps its resets) style our components without `!important`, and brand overrides
  of Payload's own elements go in `@layer payload` as Payload documents.
- **Tokens**: the admin stylesheet declares `@theme inline` tokens with the **same names the
  site primitives use** (`--color-primary`, `--color-surface`, `--color-text`,
  `--color-text-muted`, `--color-border`, `--radius-base`, `--font-sans`…) but mapped onto
  Payload's dark variables (`--theme-elevation-0/50/100/150/1000`, `--theme-input-bg`) plus
  the B7R accent. Result: `src/components/ui/*` (accordion, dialog, select, slider and the
  new button/card/badge/tooltip/dropdown/switch/collapsible) render correctly in both worlds
  with no duplication, and every custom admin surface follows Payload's greys automatically.
- **Scope of the admin stylesheet**: `@source` limited to `src/modules/cms/admin/**` and
  `src/components/ui/**`; loaded only by the `(payload)` layout. The public bundle is
  untouched (budget test asserts no admin CSS in `(site)` HTML).
- **Font**: ITF Rayat Round is self-hosted (`public/fonts`); `@font-face` in the admin CSS,
  `--font-body` set in `@layer payload`. Regular for body, Medium/Bold for headings.
- **RTL**: Payload sets `dir="rtl"` for `ar`; our components use logical utilities only
  (`check:rtl` already scans `src/`).
- **Dependencies** (exact pins, all published 2026-07-24, > 24 h): `@radix-ui/react-tooltip`
  1.2.16, `@radix-ui/react-dropdown-menu` 2.1.24, `@radix-ui/react-switch` 1.3.7,
  `@radix-ui/react-collapsible` 1.1.20. No `cmdk`: the palette is the existing Dialog
  primitive with a small ranking function (unit-tested). Icons: `lucide-react` (present).
- **Import map**: every new admin component path is registered by `pnpm payload
  generate:importmap` (RUNBOOK rule; CI's build regenerates and fails on drift).

## Architecture

```
src/modules/cms/admin/
  icons.ts                 # slug → lucide icon registry (collections, globals, groups, actions)
  nav/nav.tsx              # server: groups via groupNavItems → <NavClient groups=…/>
  nav/nav-client.tsx       # client: collapsible groups (prefs key `nav`), active state, site link
  header/actions.tsx       # server → <HeaderActions/> client: palette trigger + "view site"
  header/palette.tsx       # client: Ctrl/⌘K dialog, entities + document search (REST)
  header/palette-rank.ts   # pure: rank(query, items), unit-tested
  account/settings-menu.tsx, account/logout-button.tsx
  login/after-login.tsx    # one line under the form (who to ask for access)
  dashboard/dashboard.tsx  # server view inside DefaultTemplate
  dashboard/quick-actions.tsx, health-card.tsx, recent-activity.tsx
  fields/icon-select.tsx, fields/platform-select.tsx, fields/enabled-switch.tsx
  preview.ts               # signPreview / verifyPreview (HMAC over path, 1 h)
src/app/(payload)/admin.css        # tokens, @font-face, Tailwind utilities, @layer payload overrides
src/app/api/preview/route.ts       # verify → draftMode().enable() → redirect; /exit disables
src/components/ui/{button,card,badge,tooltip,dropdown-menu,switch,collapsible,separator,kbd}.tsx
src/lib/cms/health.ts              # healthReport() shared by /api/health and the dashboard
docs/ADMIN-DESIGN-SYSTEM.md, .claude/rules/admin-ui.md, docs/DECISIONS.md ADR-039
```

`src/modules/cms/admin/**` is server/client React for the panel only; it may import
`@payloadcms/ui` and `payload`. Nothing under `src/modules/home|pages|products` imports it.

## Phase 1: Foundation (tokens, primitives, icons, design system)

- `admin.theme: 'dark'`; `src/app/(payload)/admin.css` (replaces `custom.css`): `@font-face`,
  `@theme inline` token map, Tailwind theme + utilities (unlayered, scoped `@source`),
  `@layer payload { … }` brand overrides: accent on links, focus ring, active nav item,
  `.btn--style-primary`, toggles/checkbox checked state, selection colour, `--style-radius-*`
  = 13/20 px, field radius, card shadow. Payload greys untouched.
- shadcn primitives added to `src/components/ui/` in the project's existing style (Radix +
  cva + `cn`): `button`, `card`, `badge`, `tooltip`, `dropdown-menu`, `switch`,
  `collapsible`, `separator`, `kbd`. Site-neutral; each documented in the design system.
- `icons.ts`: registry with a type that requires an icon for **every** collection and global
  slug in the config, plus group and action icons; `tests/admin-icons.test.ts` fails when a
  slug has none. `tests/admin-config.test.ts` walks every collection and global and asserts
  `admin.group`, Arabic `labels`, `admin.description`, `useAsTitle` and `defaultColumns`
  (collections), the "future things" guarantee without a `defineCollection` wrapper (CTO).
- `docs/ADMIN-DESIGN-SYSTEM.md`: principles (one product, Arabic first, icon + label always,
  one primary action per view, explain before you toggle), tokens table, type scale,
  spacing, the primitives and when to use each, icon rules (lucide, 20 px in nav, 16 px
  inline, never an icon without a label except in icon buttons with `aria-label`), Arabic
  writing rules for labels/descriptions/empty states (ux-araby: verb-first actions, nominal
  labels, no «تم», no «قم بـ»), states (empty, loading, error, disabled), a11y (contrast
  AA on the dark surface, focus visible, keyboard).
- `.claude/rules/admin-ui.md`: the checklist for a new collection/global, `admin.group`,
  registry icon, Arabic `label` (singular/plural) + `description`, `useAsTitle`,
  `defaultColumns`, `listSearchableFields`, field descriptions, `enabled` fields use the
  switch widget, preview if it has a route; run `generate:importmap`; add to the dashboard
  quick actions if editors create it often.
- ADR-039 (ADR-038 is the widget/numbers record): shell on shadcn/ui over Payload's engine;
  dark only (constitution V governs the public site; the admin sits outside it); unlayered
  utilities beat Payload's layers; token names shared with the site, with the dark-surface
  values chosen for AA (`accent-tint`, `text-primary` on tint and the muted text are
  redefined for Payload's greys, not copied from the light site). BRD §9.3 amendment in
  `docs/brd-sections/05-technical-architecture.md` + rebuild + copy.
- The site's Tailwind `@source` is narrowed to what the site renders (`src/app/(site)`,
  `src/modules/{home,pages,products,designer,contact,core,forms,blog}`, and the `ui`
  primitives it imports) so classes used only by `dropdown-menu`/`switch`/`kbd` never land in
  the public stylesheet; the budget test gains a CSS-size assertion for `/`.
- Tests: icon registry; `tests/admin-css.test.ts` asserts the admin stylesheet has no raw hex
  outside `@theme` (same rule as the site), or extend `check:rtl`'s hex rule to it.

## Phase 2: Shell (nav, header, account, login)

- `Nav`: server component builds groups with `groupNavItems` (respects `visibleEntities`
  and permissions, so editors never see settings they cannot open), reads the `nav`
  preference like Payload does, renders `NavClient`. Client: Payload's outer `nav` element
  classes are kept so `DefaultTemplate`'s layout and the mobile slide-in keep working
  (`useNav()`); a comment names the classes (`nav`, `nav--nav-open`, `nav__scroll`,
  `template-default__nav`) and the Payload version they were checked against (3.89.0), and
  the mobile-drawer e2e pins the behaviour; inside: logo, groups as `Collapsible` with the group icon and a chevron,
  items as links with the entity icon, `aria-current="page"` on the active one, tooltips
  when collapsed on narrow heights, a «عرض الموقع» link (opens the site in a new tab), the
  account block (name, role badge, settings menu, logout) pinned at the bottom.
- Header `actions`: `HeaderActions`, palette button showing `Ctrl K` / `⌘ K` (detects
  platform), «الموقع» external link. Palette: entities first (icon + label + group), then
  document hits from products, pages, faqs, testimonials, media, users(admin only) via
  `GET /api/payload/<slug>?where[<field>][like]=…&limit=5&depth=0`, `<field>` is each
  collection's `listSearchableFields`, searching starts at two characters, at most 5 hits per
  collection, `credentials: include` (Payload's access rules are the boundary), debounced
  200 ms, stale requests aborted; arrow keys, Enter, Esc; recent choices in `localStorage`
  behind try/catch (private windows throw); `rank()` is pure and unit-tested (prefix >
  word-start > substring, Arabic diacritics and hamza forms folded).
- `settingsMenu`: language switch stays (Payload's), theme entry removed (dark only);
  `logout.Button`: icon button with confirmation-free logout (Payload's behaviour) styled as
  a menu item.
- Login: `graphics.Logo` (present) gets the dark treatment; `afterLogin`: «لا تملك حساباً؟
  اطلبه من مدير الموقع.»; the Turnstile widget (ADR-034) stays above the form.
- e2e (`admin.spec.ts`, `cms` project): nav shows an icon per entity and highlights the
  active one; groups collapse and persist across reload; palette opens with Ctrl+K, finds
  «سياسة الخصوصية» and navigates to its edit view; editor seat sees no settings entries;
  mobile (pixel-7 viewport inside the cms project) drawer opens and closes; axe on the
  login page, the dashboard, the palette, a list view and an edit view in dark.

## Phase 3: Dashboard, preview, widgets, collection polish

- `views.dashboard.Component`: server component inside `DefaultTemplate`; greeting with the
  user's name; **Quick actions** (edit home, add page, add product, add FAQ, upload media,
  view site, icon cards, filtered by permissions); **System health** from `healthReport()`
  (shared with `/api/health`: db, media, jobs, failed jobs, e-mail, Turnstile, IndexNow) as
  status rows with coloured badges and one line of Arabic meaning each, plus a «تحقّق
  الآن» link to `/api/health`; **Recent activity**: last 8 documents across collections and
  globals by `updatedAt`, each with icon, title, collection, editor name, relative time, link.
  Last backup date is *not* shown (only the bucket knows it; listing it would need the backup
  keys at runtime, ADR note, revisit when the weekly workflow posts a status).
- `lastPublishedBy`: a `group { name, at }` **snapshot** (not a relationship, `users.read`
  is admin-or-self, so an editor would see a bare id for a colleague, and a deleted user would
  dangle) on products, pages, faqs, testimonials, integrations, media, home, site-settings,
  navigation, seo-defaults; `admin.readOnly`, sidebar position, label «آخر نشر بواسطة» with
  the honest description (a draft save never writes the main row, so the field reflects the
  last publish); set in a shared `beforeChange` hook from `req.user` (left unchanged on
  system writes without a user, the seed and jobs); additive migration; unit test on the
  hook.
- Preview: `admin.preview` on pages, products and `home` → `/api/preview?path=…&token=…`
  where `token = hmac(path + exp, PAYLOAD_SECRET)`, one hour; the route verifies the token,
  validates the path as a site path (`^/[a-z0-9/-]*$`, no `//`) before `redirect()`, enables
  Next draft mode and redirects; `/api/preview/exit` disables. **Proxy (B0, ADR-032):** a
  request carrying Next's draft cookie (`__prerender_bypass`) passes through the slug
  allowlist, otherwise a new unpublished page (or a slug renamed in draft) would be rewritten
  to the 404 before draft mode has a say. **Fetchers:** `getHome`, `getPage`, `getPages`,
  `getProduct`/`getProducts`, `getTestimonials`, `getFaqs` read with `draft: true` **and
  without the `PUBLISHED` filter** when `draftMode().isEnabled` (today they filter by
  status). Reading `draftMode()` is static-safe, during a prerender it is an empty provider
  with `isEnabled: false` and no dynamic tracking (verified by the CTO in
  `next/dist/server/request/draft-mode.js`); only `enable()`/`disable()` are dynamic. A thin
  «معاينة مسودة، خروج» bar renders on the site in draft mode. Payload's own «Preview»
  button opens it in a new tab (Dhia's choice: no live panel). ADR-039 records the
  semantics: the link is a one-hour bearer by design (staff share it) and draft mode, once
  enabled, shows drafts site-wide until exit. Unit test on the token and the path rule; e2e:
  (a) a draft page created via REST renders through its preview URL with the bar; (b) the
  same path without the cookie is the full-document 404; (c) after `/api/preview/exit` it is
  the 404 again; (d) a draft edit to a published page is visible through the preview and
  absent from the public page; (e) constitution II proof, `/` and `/about` answer
  `x-nextjs-cache: HIT` without the cookie and the build output keeps every `(site)` route
  static/ISR.
- Field widgets (`admin.components.Field`): `IconSelect` for `CARD_ICONS` fields (grid of
  icon buttons, radiogroup semantics); `PlatformSelect` for `integrations.platform` (radio
  cards with the brand SVGs); `EnabledSwitch` for every `enabled` checkbox (switch + one
  sentence taken from the field's own `admin.description`, so each names its section, 
  «عند الإيقاف يختفي قسم «لماذا بحر برنت» من الصفحة الرئيسية»). Each uses `useField` and
  works with drafts/autosave.
- Collection polish: Arabic `admin.description` on every collection and global,
  `defaultColumns` and `listSearchableFields` where missing (the palette reads the same
  `listSearchableFields`, so the two never diverge), `i18n.translations.ar`
  overrides for Payload's own «No results»/«Create new» strings where the default reads
  stiff, list empty state guidance via `beforeList` on products/pages/faqs («لا صفحات بعد.
  أضف الأولى.»).
- Docs: RUNBOOK (preview, `generate:importmap`), IDEAS (live preview, drafts/scheduled
  widget, light theme, backup status), tasks ticked, memory.

## Gates (every phase)

typecheck, oxlint, oxfmt, `check:rtl`, vitest, Playwright (`cms` project + budgets),
`generate:importmap` drift check, axe on the new admin surfaces, review URL on :3004 for Dhia,
CTO code review ≥ 90.

## Judgment calls

- Payload's outer `nav` classes are kept on purpose: the template's grid, the mobile slide-in
  and the `nav--nav-open` body class are Payload's; re-implementing them buys nothing.
- No `cmdk`: 60 lines on the existing Dialog do the job and stay ours.
- `lastPublishedBy` is the only schema change; the rest is configuration and components.
- Draft mode over a `?draft=` query: Next's draft cookie cannot be guessed and the fetchers
  need one boolean, not a new query contract.
