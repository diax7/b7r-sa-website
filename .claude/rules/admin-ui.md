# Admin panel rules (Payload at /admin)

Read `docs/ADMIN-DESIGN-SYSTEM.md` before touching anything under `src/modules/cms/**`,
`src/app/(payload)/**` or a Payload collection/global config. These rules are enforced by
`tests/admin-config.test.ts`, `tests/admin-icons.test.ts`, `check:rtl` and the admin e2e.

## Adding or changing a collection or global

1. `admin.group` in Arabic + English, one of the existing groups (المحتوى / الإعدادات /
   الإدارة) unless a new group is a deliberate decision (then add its icon to `GROUP_ICONS`).
2. One icon in `src/modules/cms/admin/icons.ts` (`COLLECTION_ICONS` / `GLOBAL_ICONS`) —
   a noun for a collection, a place for a global. Missing = type error + failing test.
3. `labels.singular` / `labels.plural` (collections) or `label` (globals) in Arabic + English;
   nouns, never sentences.
4. `admin.description`: one Arabic sentence about what it is *for the site*, not how it is
   stored. English fallback too.
5. `admin.useAsTitle` (collections) on the field an editor recognises; `admin.defaultColumns`
   with the 3–5 columns that answer "which one is this?"; `admin.listSearchableFields` on the
   title-like fields (the command palette searches the same fields).
6. Every `checkbox` named `enabled` gets an `admin.description` that names the consequence on
   the site and uses the `EnabledSwitch` widget.
7. If the document has a public route, set `admin.preview` (signed draft-mode URL).
8. Access rules decide visibility: never render an admin-only thing greyed-out for editors.

## Adding an admin component

- Location: `src/modules/cms/admin/<area>/`. Server components by default; `'use client'`
  only for interaction. May import `@payloadcms/ui` and `payload`; nothing under
  `src/modules/home|pages|products|designer|contact` may import from here.
- Styling: Tailwind utilities with the shared token names (`bg-surface`, `text-text-muted`,
  `text-accent`, `bg-primary`, `rounded-base`). Never `var(--color-*)` directly, never raw hex,
  never `text-primary` on dark, never physical directions (`ml-`, `left-`).
- Reuse `src/components/shared/*` and `src/components/ui/*` first; add a primitive there (site
  neutral, documented in the design system) before writing a one-off.
- Icons through `components/shared/icon.tsx`, from the registry when the icon stands for an
  entity. Icon-only buttons carry `aria-label` + `Tooltip`.
- Strings: Arabic, ux-araby rules (verb-first actions, nominal labels, no «تم», no «قم بـ»,
  Arabic comma, no «!»). They live in `src/modules/cms/admin/strings.ts`, never inline.
- Roots of our shell carry `data-admin-ui` (the scoped element reset in `admin.css`) and a
  `data-admin-*` hook for the e2e; the sidebar keeps Payload's outer `nav` classes.
- After adding or renaming a component referenced from the Payload config, run
  `pnpm payload generate:importmap` and commit `src/app/(payload)/admin/importMap.js`.
- Add the surface to the axe pass in `e2e/admin.spec.ts` when it is a new view.

## Never

- Custom list or edit views; replacing Lexical; a light theme; `!important` against Payload;
  admin CSS or JS reaching the `(site)` bundle.
