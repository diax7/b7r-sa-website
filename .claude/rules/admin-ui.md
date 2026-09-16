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
   slot; the locale note rides along when the config has per-language fields).
3. `labels.singular` / `labels.plural` (collections) or `label` (globals) in Arabic + English;
   nouns, never sentences.
4. `admin.description` on the entity: one sentence about what it is *for the site*, not how
   it is stored, Arabic + English. And on **every field an editor sees** (ADR-046): what it
   does on the site and where, then the limit or an example, through the entity's map in
   `src/modules/cms/admin/descriptions/*.ts` (engine fields in
   `src/modules/ai-content/descriptions.ts`, connections in
   `src/modules/connections/descriptions.ts`), applied by `describeFields()` on the config's
   `fields`; `tests/admin-config.test.ts` refuses a field without both languages and a map
   key that names no field. A form with more than one screen of fields is tabs, one per
   section of the site in site order (named tabs where a group existed: same columns).
5. `admin.useAsTitle` (collections) on the field an editor recognises; `admin.defaultColumns`
   with the 3–5 columns that answer "which one is this?"; `admin.listSearchableFields` on the
   title-like fields (the command palette searches the same fields).
6. Every `checkbox` named `enabled` gets an `admin.description` that names the consequence on
   the site and uses the `EnabledSwitch` widget.
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
   `icons.ts`, its component in `admin/views/registry.ts`, and the component's first line is
   `adminView(props, path)` then `isAdminUser(props)` (`admin/views/gate.tsx`): Payload
   renders a custom view with a `path` for anyone. Reads inside run with the user's access.

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
- Strings: the panel is English (`src/modules/cms/admin/strings.ts`, never inline); config
  labels and descriptions carry both `en` and `ar`, the Arabic under the ux-araby rules
  (verb-first actions, nominal labels, no «تم», no «قم بـ», Arabic comma, no «!»); the writing
  rules in `.claude/rules/writing.md` apply to both (no em dashes).
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
