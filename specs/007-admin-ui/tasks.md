# Tasks: Admin panel shell, dashboard and design system

Branch `admin/ui-1`, PR #4. CTO: plan 90, phase 1 94, phase 2 93.

## Phase 1: foundation
- [x] T101 `admin.theme: 'dark'`; `src/app/(payload)/admin.css` (tokens with the site's names on
  Payload's greys, unlayered utilities, `@layer payload` brand overrides); `src/styles/tokens.css`
  shared; site `@source not` for the admin; CSS budget in the e2e; `check:rtl` allowlist.
- [x] T102 Primitives: tooltip, dropdown-menu, switch, collapsible, separator, kbd (Radix, pinned).
- [x] T103 `modules/cms/admin/icons.ts` typed over the config; Arabic descriptions on every
  collection and global; `tests/admin-config.test.ts`.
- [x] T104 `docs/ADMIN-DESIGN-SYSTEM.md`, `.claude/rules/admin-ui.md`, ADR-039, BRD 9.3.

## Phase 2: the shell
- [x] T201 `Nav` (groups, icons, remembered state, active entry, site link, account block).
- [x] T202 Header actions + the command palette (ranking unit-tested, REST document search on
  `listSearchableFields`, now declared on every collection).
- [x] T203 Account menu, after-login line; scoped element reset; `@payloadcms/ui` pinned.
- [x] T204 Shell e2e (icons, groups, palette, account, editor seat, phone drawer, axe on our
  surfaces); `beforeAll` home reset.

## Phase 3: dashboard, preview, widgets
- [x] T301 Dashboard view: quick actions by permission, health card (`healthReport()`), recent
  activity with `lastSavedBy` (field + hook + additive migration) and Arabic relative time.
- [x] T302 Preview: signed token, `/api/preview` + `/exit`, proxy passthrough on the draft cookie,
  draft-aware fetchers and mappers, the draft bar; e2e (a)–(e).
- [x] T303 Widgets: `EnabledSwitch` (per-section descriptions), `IconSelect`, `PlatformSelect`.
- [x] T304 Docs: ADR-039 phase-3 paragraph, RUNBOOK preview, IDEAS, design system, memory.

## Writing rule (Dhia, 2026-09-13)
- [x] T401 No em dashes anywhere: `scripts/check-em-dash.ts` (`pnpm check:dash`) in prek and CI,
  `.claude/rules/writing.md`, ADR-040, one sweep across code, content, docs and the BRD.

## Phase 4: Dhia's review notes (2026-09-13, `admin/ui-2`)
- [x] T501 Icon rail when the sidebar is collapsed on a desktop (72 px, tooltips, persisted).
- [x] T502 English panel: `supportedLanguages: { en }`, English shell strings, refusals, login
  gate and reset e-mail; `unicode-bidi: plaintext` on text controls for Arabic content.
- [x] T503 Font swap on navigation: `/fonts` cached immutable for a year + admin preload.
- [x] T504 Colour semantics on Payload's elements (publish green, delete red, unpublish amber,
  Create New blue) and the shadcn feel (weights, focus rings, pills, popovers, tab underline).
- [x] T505 Header: bordered search box + "View website" with text; both removed from the sidebar.
- [x] T506 Square brand icon in the header.
- [x] T507 e2e + unit tests updated; ADR-039 amendment; design system + rules.

## Phase 5: second review round + closing review (2026-09-14, `admin/ui-2`)
- [x] T508 Sidebar foot: collapse/expand above the account block; brand row "B7R Print Website"
  at body size; the header icon whole (24 px wrapper).
- [x] T509 Palette dialog centred in LTR (direction-aware transform).
- [x] T510 The rail is CSS (`data-rail-*` attributes toggled by `admin.css`): a collapsed
  sidebar paints as the rail on the first frame of every page, no shift; the drawer never
  shows the collapse control.
- [x] T511 `SavedByField`: the `lastSavedBy` group as one line; nothing on a create form.
- [x] T512 Payload's localized-label suffix hidden; redirect type defaults to 301; dashboard
  rows without a title read "Untitled".
- [x] T513 Full review on screenshots (login, dashboard, palette, rail, lists, edit views,
  globals, create forms, versions, delete confirm, 404, phone); stray autosave drafts removed;
  e2e + unit tests; ADR-039 amendment; design system.
- [x] T514 Dhia's third notes: collapse control at the start of its row; 24 px under the
  header on every view; colour on the dashboard (name in the accent, a hue per entity on the
  discs, "Start here" icon).
- [x] T515 CTO closing review: Payload's `Link` for every in-admin link (no reload, e2e
  marker); rail links named from the server; abandoned autosave drafts off the dashboard;
  widget strings in `strings.ts`; IDEAS entries (content-locale `en`, upstream em dashes).
