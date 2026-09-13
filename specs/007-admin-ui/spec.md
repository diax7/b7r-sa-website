# Feature Specification: Admin panel shell, dashboard and design system

**Feature Branch**: `admin/ui-1` (from `main` after the Phase 2b merge) | **Date**: 2026-09-13
**Requested by**: Dhia — "use shadcn/ui to rebuild the dashboard pages and enhance the panel;
icons in every possible way; very easy to use, nice UI and UX; good design rules and a design
system even for future things."

## Decisions taken with Dhia (2026-09-13)

| Question | Decision |
|---|---|
| Scope | Shell + dashboard + theme + field widgets on Payload's engine. The edit and list views stay Payload's (rebuilding them re-implements drafts, versions, uploads and Lexical). |
| Live preview | No side panel. A «معاينة» button that opens the draft on the site in a new tab. |
| Dashboard widgets | Quick actions, system health, recent activity. Not drafts/scheduled. |
| Theme | **Dark only** — keep Payload's dark grey; B7R blue as the accent. No light mode. |

## Goals

1. Every admin page looks like one product: Payload's dark grey with the B7R accent, the
   brand font, 13 px radius, consistent spacing and focus rings (BRD §3 tokens where they
   apply to a dark surface).
2. A shell an editor understands at a glance: a sidebar with an icon for every collection and
   global, grouped (المحتوى · الإعدادات · الإدارة), the current page highlighted, a link to the
   live site, a ⌘K / Ctrl+K palette to jump anywhere, a clear account menu, a branded login.
3. A dashboard that answers "what do I do now?": quick actions with icons, system health
   (jobs, e-mail, Turnstile, IndexNow, last backup), recent activity (last edited documents,
   by whom, one click to open).
4. Editing that explains itself: icon pickers that show the icon, platform selects with logos,
   section switches with a sentence of guidance, a preview button on pages/products/home,
   Arabic descriptions and sensible list columns on every collection.
5. A written design system for the panel — tokens, components, icon rules, Arabic writing
   rules for labels and descriptions — plus a `.claude/rules/admin-ui.md` so every future
   collection follows it without being asked.

## Non-goals

- No custom list or edit views; no replacement of Lexical; no light theme; no live preview.
- No analytics or sales figures on the dashboard (no data source yet, BRD §6.16 is the site).
- No new admin roles or permissions (ADR-027 roles stay).

## User stories

- As an editor I open `/admin` and see, in Arabic, what I can do right now: edit the home
  page, add a page, add a product, add a FAQ, upload media, open the site. Each with an icon.
- As an editor I press Ctrl+K, type «سياسة», and jump to the privacy page's edit form.
- As Dhia I see at a glance that jobs run, the last backup date, and whether e-mail and
  Turnstile are live.
- As an editor I toggle «عرض القسم» on the home page and understand from the sentence beside
  it what disappears from the site.
- As an editor I click «معاينة» on a draft page and see the draft on the site.
- As a developer adding a collection later, the rules file tells me: group, icon, Arabic
  label + description, `useAsTitle`, default columns, and the dashboard picks it up.

## Acceptance

- Sidebar: every visible collection and global has an icon (a unit test enforces the
  registry is complete), groups collapse and remember their state, the active entity is
  highlighted, keyboard reachable, mobile drawer works.
- Palette: opens with Ctrl/⌘+K and from a header button; lists entities and searches
  documents of the main collections by title; Enter opens; Esc closes; axe clean.
- Dashboard: the three widgets render from server data; `/api/health` is not fetched over
  HTTP (the same function runs in the server component); recent activity shows the editor's
  name via the new `lastPublishedBy` snapshot (a draft save never writes the main row).
- Preview: pages, products and home have a «معاينة» button that opens `/api/preview?…` and
  renders the draft (Next draft mode) — never a guessable URL (signed).
- Theme: `admin.theme = 'dark'`; the B7R accent on links, focus, active nav, primary buttons;
  Payload's greys untouched; contrast AA on every custom surface (axe in the admin e2e).
- Public site unchanged: no admin CSS or JS reaches the `(site)` bundle (budget test).
- Docs: `docs/ADMIN-DESIGN-SYSTEM.md`, `.claude/rules/admin-ui.md`, ADR, BRD §9.3 amendment.
