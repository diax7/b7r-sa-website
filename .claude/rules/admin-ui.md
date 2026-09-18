# Admin panel rules (Payload at /admin)

Read `docs/ADMIN-DESIGN-SYSTEM.md` before touching anything under `src/modules/cms/**`,
`src/app/(payload)/**` or a Payload collection/global config. These rules are enforced by
`tests/admin-config.test.ts` (the config shape, the icons, the sidebar registry, the locale
note), `check:rtl` and the admin e2e.

## Adding or changing a collection or global

1. `admin.group: adminGroup('…')`, one of the five task groups of `ADMIN_GROUPS` in
   `src/modules/cms/admin/icons.ts` (site · catalogue · blog · visibility · admin, ADR-046);
   a new group is a deliberate decision (icon, hue, order and both labels in the registry).
2. A place in `ADMIN_NAV` (group, order, and a `parent` for a secondary entry or a `section`),
   and one icon in `COLLECTION_ICONS` / `GLOBAL_ICONS`: a noun for a collection, a place for a
   global; a group's icon must not repeat its first entry's. Missing = type error + failing
   test; the test also checks that `admin.group` and the registry agree.
2b. `admin.custom.shows` in Arabic + English (where on the site the thing shows) and the
   header registered through `collectionComponents(slug, { localized })` /
   `globalComponents(slug, { localized })` from `admin/document/config.ts` (the description
   slot; the locale note rides along when the config has per-language fields, and says which
   fields are side by side, rule 13).
3. `labels.singular` / `labels.plural` (collections) or `label` (globals) in Arabic + English;
   nouns, never sentences.
4. `admin.description` on the entity: one sentence about what it is *for the site*, not how
   it is stored, Arabic + English. And on **every field an editor sees** (ADR-046): what it
   does on the site and where, then the limit or an example, through the entity's map in
   `src/modules/cms/admin/descriptions/*.ts` (engine fields in
   `src/modules/ai-content/descriptions.ts`, connections in
   `src/modules/connections/descriptions.ts`), applied by `describeFields()` on the config's
   `fields` (the same pass gives every checkbox its list cell, rule 6); `tests/admin-config.test.ts` refuses a field without both languages and a map
   key that names no field. A form with more than one screen of fields is tabs, one per
   section of the site in site order (named tabs where a group existed: same columns).
5. `admin.useAsTitle` (collections) on the field an editor recognises; `admin.defaultColumns`
   with the 3–5 columns that answer "which one is this?"; `admin.listSearchableFields` on the
   title-like fields (the command palette searches the same fields).
6. Every `checkbox` named `enabled` gets an `admin.description` that names the consequence on
   the site and uses the `EnabledSwitch` widget. In a list, every checkbox reads as the
   green / red `BoolCell` badge (`describeFields` sets it); never Payload's `true` / `false`.
7. If the document has a public route, set `admin.preview` (signed draft-mode URL).
8. Access rules decide visibility: never render an admin-only thing greyed-out for editors.

9. A field that holds a credential is `secretField()` (`src/modules/cms/fields/secret-field.ts`):
   encrypted at rest, masked on read, the mask kept on save. An API key belongs to a row of
   the Connections collection, not to a settings global (ADR-047).
10. An admin-only JSON route goes through `adminOnly()` (`src/modules/cms/admin-api.ts`,
   re-exported by the module's index) and a button through `ApiAction`
   (`src/modules/cms/admin/api-action.tsx`), which says what happened beside the button.
11. A page of our own in the panel (a report, ADR-048) is a custom view: an entry in
   `ADMIN_VIEWS` (label, path, icon: a place, never the group's) and `ADMIN_NAV.views` in
   `icons.ts`, its component in `admin/views/registry.ts`, and the component's first lines
   are `const refused = adminView(props, path, title); if (refused) return refused;`
   (`admin/views/gate.tsx`): Payload renders a custom view with a `path` for anyone. **The
   view renders inside `AdminShell`** (`admin/views/shell.tsx`: Payload's `DefaultTemplate`
   with our sidebar, the header, the step nav, a `Gutter`); a custom view that returns bare
   content stands outside the admin with no way back (the 2026-09-16 defect). Reads inside
   run with the user's access. A module's admin folder is a `@source` of `admin.css` and a
   `@source not` of `globals.css` (`tests/admin-css.test.ts`); the e2e asserts the shell.
12. A visibility rule (ADR-049) is a pure function over the snapshot in
   `src/modules/visibility/rules/`, with its sentence and guide beside it; its weight lives in
   `rules/weights.ts`; a guide always links to the field that fixes the finding, in the
   locale that is missing; a thing the site guarantees by construction is a fact, not a rule.
13. A localized `text`, `textarea`, `select` or `number` field is bilingual by
   `describeFields` (ADR-057 and its amendment, design system §6a): both languages side by
   side, inside the rows of arrays and blocks too, one Save writes both through
   `applyTranslations` / `applyGlobalTranslations` (`src/modules/cms/hooks/translations.ts`),
   which a config with such a field lists last in `hooks.afterChange` (the config test
   checks). Never add a second place to edit a value: no per-language duplicate field, no
   `titleEn` beside `title`, no widget of your own on a localized text. `localized` goes on
   a row's subfields, never on the array or the blocks field itself (a list localized as a
   whole has one row set per language and cannot be paired; the census test refuses one
   that is not `posts.warnings`). What stays on the locale switch (rich text, uploads,
   relationships, `hasMany`) is by design until PR B of the no-locale-switch plan; the
   locale note says so (`locale.legend`) and the field's own strings are the `bilingual`
   branch of both trees in `strings.ts`, read per render like every other string.
14. The sidebar shows no document count (ADR-058). A number that asks for action is a badge:
   a kind in `src/modules/cms/admin/nav/badges.ts` (its reader, a cheap query with the
   user's access, the dashboard's own from `dashboard/readers.ts` when the dashboard shows
   the same number; its tone, red or amber, never grey; its entry) and its sentence in
   both string trees, picked in `nav/badge-strings.ts` (the dashboard's sentence when the
   number is the dashboard's). The sidebar's shape itself (the tree, the rail, the drawer,
   the keyboard model) is the design system's shell section; a new entry only needs its
   place in `ADMIN_NAV`.

13. A localized `richText` or `upload` (ADR-057, PR B) is followed, in the same field list,
   by `twinField(original)` from `src/modules/cms/fields/bilingual.ts`: the English the
   editor types under the Arabic, filled on read and applied on save by the mechanism. The
   entity lists `populateTwins` / `populateGlobalTwins` (`fields/twins.ts`) in
   `hooks.beforeRead` beside `applyTranslations` in `afterChange`; the twin's column rides
   a migration; `tests/admin-config.test.ts` refuses a localized heavy field without its
   twin and a config with a twin without the hook. A localized light field needs nothing
   (rule 4's pass makes it bilingual); a localized array is never added (the design system
   §6a: `localized` goes on a row's subfields, never on the array).

## Adding an admin component

- Location: `src/modules/cms/admin/<area>/` (a feature module's own under
  `src/modules/<module>/admin/`, listed as a `@source` of `admin.css` so its Tailwind classes
  are generated). Server components by default; `'use client'` only for interaction. May
  import `@payloadcms/ui` and `payload`; nothing under
  `src/modules/home|pages|products|designer|contact` may import from here.
- Styling: Tailwind utilities with the shared token names (`bg-surface`, `text-text-muted`,
  `text-accent`, `bg-primary`, `rounded-base`). Never `var(--color-*)` directly, never raw hex,
  never `text-primary` on dark, never physical directions (`ml-`, `left-`).
- Reuse `src/components/shared/*` and `src/components/ui/*` first; add a primitive there (site
  neutral, documented in the design system) before writing a one-off.
- Icons through `components/shared/icon.tsx`, from the registry when the icon stands for an
  entity. Icon-only buttons carry `aria-label` + `Tooltip`.
- Strings: the panel speaks English and Arabic (ADR-056, design system §5a); every string
  of ours lives in both trees of `src/modules/cms/admin/strings.ts` (`adminStrings` and
  `adminStringsAr`, never inline), read per render with `adminStringsFor(i18n.language)` on
  the server or `useAdminStrings()` on the client, never at module top level. A key missing
  in one language is a type error and `tests/admin-strings.test.ts` refuses it, along with
  Arabic that breaks the ux-araby rules (verb-first actions, nominal labels, no «تم», no
  «قم بـ», Arabic comma, «أو» not «/», no «!», Western digits). Config labels and descriptions
  carry both `en` and `ar` under the same rules; numbers and dates go through
  `src/modules/cms/admin/format.ts`; a poor string of Payload's own pack is fixed in
  `src/modules/cms/admin/payload-ar.ts`. The writing rules in `.claude/rules/writing.md`
  apply to both languages (no em dashes).
- Colour means one thing: blue = main action/active, green = publish/live, red = delete/
  failure, amber = careful. Set Payload's button colours through its custom properties.
- Roots of our shell carry `data-admin-ui` (the scoped element reset in `admin.css`) and a
  `data-admin-*` hook for the e2e; the sidebar keeps Payload's outer `nav` classes.
- After adding or renaming a component referenced from the Payload config, run
  `pnpm payload generate:importmap` and commit `src/app/(payload)/admin/importMap.js`.
- Add the surface to the axe pass in `e2e/admin.spec.ts` when it is a new view.

## Never

- Custom list or edit views; replacing Lexical; a light theme; `!important` against Payload;
  admin CSS or JS reaching the `(site)` bundle.
- A second breakpoint for the shell (Payload's `m`, 1024 px, is the one), a document count
  in the sidebar, a physical `left` or `right` anywhere in it.
