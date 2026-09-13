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
