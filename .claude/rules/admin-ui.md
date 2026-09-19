# Admin panel rules (Payload at /admin)

Read `docs/ADMIN-DESIGN-SYSTEM.md` before touching anything under `src/modules/cms/**`,
`src/app/(payload)/**` or a Payload collection/global config. These rules are enforced by
`tests/admin-config.test.ts` (the config shape, the icons, the section icons, the sidebar
registry, the bilingual census, the description rule, the status column),
`tests/admin-glossary.test.ts` (the glossary), `check:rtl` and the admin e2e.

## Adding or changing a collection or global

1. `admin.group: adminGroup('…')`, one of the five task groups of `ADMIN_GROUPS` in
   `src/modules/cms/admin/icons.ts` (site · catalogue · blog · visibility · admin, ADR-046);
   a new group is a deliberate decision (icon, hue, order and both labels in the registry).
2. A place in `ADMIN_NAV` (group, order, and a `parent` for a secondary entry or a `section`),
   and one icon in `COLLECTION_ICONS` / `GLOBAL_ICONS`: a noun for a collection, a place for a
   global; a group's icon must not repeat its first entry's. Missing = type error + failing
   test; the test also checks that `admin.group` and the registry agree. A section is a row
   of `NAV_SECTIONS` (both labels, an icon of its own, a `place`: `first` opens the group,
   `last` closes it; the inbox opens Site, the engine closes Blog, ADR-061); the tree, the
   rail, the keyboard model and the active row read one order (`nav/order.ts`).
2b. `admin.custom.shows` in Arabic + English (where on the site the thing shows) and the
   header registered through `collectionComponents(slug)` / `globalComponents(slug)` from
   `admin/document/config.ts` (the description slot and, first before the document
   controls, the form-modified sentinel the language switch reads, ADR-056; an entity's own
   action there goes in as `{ beforeDocumentControls }`, never as an `edit` key beside the
   spread. There is no locale note and no locale switch, ADR-057; both languages of every
   field are in the form, rules 13 and 15).
3. `labels.singular` / `labels.plural` (collections) or `label` (globals) in Arabic + English;
   nouns, never sentences.
4. **Every string an editor sees is born in both languages** (ADR-046, ADR-056, the
   2026-09-19 words pass): labels, descriptions, hints, placeholders, select options, empty
   states, buttons, toasts, refusals and error sentences alike; the Arabic written by
   meaning under ux-araby (design system §5), never a calque, and never inline in a
   component: a string of the shell lives in both trees of `admin/strings.ts`, a config text
   in the config's `{ ar, en }` pair, a field's sentence in the entity's map
   (`src/modules/cms/admin/descriptions/*.ts`; engine fields in
   `src/modules/ai-content/descriptions.ts`, connections, traffic and visibility in their
   module's `descriptions.ts`) applied by `describeFields()` (the same pass gives every
   checkbox its list cell, rule 6). Toasts, refusals, empty states and error sentences are
   strings of the feature, not afterthoughts: they ship with it, in both trees.
   **The description rule**, for the entity's `admin.description` and for every field an
   editor sees: one sentence of what the thing does *on the site* and where, then the limit
   or an example if one helps ("Up to 70 characters", "1200×630 or larger"); nothing the
   label already says, nothing about how it is stored, no second sentence that repeats the
   first. In Arabic, a sentence that says where the value shows opens with its verb, the
   field the implied subject, the gender agreeing with the thing («يظهر في البطاقة، وعنوان
   صفحته»، «تظهر خلف الشريحة»، «يعلو شبكة البطاقات؛ فارغ يعرض البطاقات وحدها»), never with a
   bare place preposition («في البطاقة…»); a spec sentence (a limit, a format, an example)
   may stay nominal («كلمتان إلى أربع.», «بنسبة 4:5.», «من صفر إلى 5»). English may keep its
   prepositional fragment. **The glossary** (`docs/ADMIN-GLOSSARY.md`, rendered from
   `src/modules/cms/admin/glossary.ts`) fixes one word per concept in each language, in both
   directions (no two concepts share a word), and which terms stay Latin inside Arabic (API,
   JSON, URL, slug, the services, the brands, the model ids, `alt`, `og:image`); a new
   concept is a new row before its first string. Enforced: `tests/admin-config.test.ts`
   refuses a field without both languages, a map key that names no field, an inline
   sentence where the map names the field, a description over 140 characters in either
   language as rendered (a bilingual list may exceed it by its shared-rows note; exceptions
   named per path with a reason, in `CAP_EXCEPTIONS`), one that opens with the label's own
   noun, one that says "stored", "database", "table" or "column" (or their Arabic), and an
   Arabic one that opens with «في», «تحت», «فوق», «خلف», «بجانب», «أمام», «على», «عند», «داخل»
   or «ضمن»; `tests/admin-glossary.test.ts` refuses a Latin-kept term translated and a
   settled word's alternate anywhere in the panel; `tests/admin-strings.test.ts` keeps the
   ux-araby rules over the trees, the overrides and every config text, and
   `tests/visibility-rules-strings.test.ts` over the rules' sentences. A form with more than
   one screen of fields is tabs, one per section of the site in site order (named tabs
   where a group existed: same columns).
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
   re-exported by the module's index; a route editors may call names them in `roles` and
   writes with the person the guard hands back, never with access overridden) and a button
   through `ApiAction` (`src/modules/cms/admin/api-action.tsx`), which says what happened
   beside the button (`onDone` for what the page does besides saying it).
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
   `rules/weights.ts`; a guide always links to the field that fixes the finding
   (`editHref(adminRoute, collection, id, field)` / `globalHref(adminRoute, slug, field)`:
   the form at Payload's `field-<path>` anchor) and, when the English is what is missing,
   says which column ("the English field beside the Arabic title", "the English body is the
   editor under the Arabic one"); never a `?locale=` (the panel has no locale switch,
   ADR-057, and the proxy redirects the query away); a thing the site guarantees by
   construction is a fact, not a rule.
13. A localized `text`, `textarea`, `select` or `number` field is bilingual by
   `describeFields` (ADR-057 and its amendment, design system §6a): both languages side by
   side, inside the rows of arrays and blocks too, one Save writes both through
   `applyTranslations` / `applyGlobalTranslations` (`src/modules/cms/hooks/translations.ts`),
   which a config with such a field lists last in `hooks.afterChange` (the config test
   checks). Never add a second place to edit a value: no per-language duplicate field, no
   `titleEn` beside `title`, no widget of your own on a localized text. `localized` goes on
   a row's subfields, never on the array or the blocks field itself (a list localized as a
   whole has one row set per language and cannot be paired; the census test refuses one
   that is not `posts.warnings`). There is no locale switch to fall back on (ADR-057,
   PR C): a localized field that is neither a light field with the component, nor a heavy
   field with its twin (rule 15), nor a read-only fact whose widget shows the other
   language under the open one (`ReadOnlyLine`, `WarningsField`, through
   `useOtherLanguage` and `OtherValue` in `admin/fields/bilingual/`) has no place that
   shows its other language, and the census gate in `tests/admin-config.test.ts` names it;
   the field's own strings are the `bilingual` branch of both trees in `strings.ts`, read
   per render like every other string.
14. The sidebar shows no document count (ADR-058). A number that asks for action is a badge:
   a kind in `src/modules/cms/admin/nav/badges.ts` (its reader, a cheap query with the
   user's access, the dashboard's own from `dashboard/readers.ts` when the dashboard shows
   the same number; its tone, red or amber, never grey; its entry) and its sentence in
   both string trees, picked in `nav/badge-strings.ts` (the dashboard's sentence when the
   number is the dashboard's). The sidebar's shape itself (the tree, the rail, the drawer,
   the keyboard model) is the design system's shell section; a new entry only needs its
   place in `ADMIN_NAV`.

15. A localized `richText` or `upload` (ADR-057, PR B) is followed, in the same field list,
   by `twinField(original)` from `src/modules/cms/fields/bilingual.ts`: the English the
   editor types under the Arabic, filled on read and applied on save by the mechanism. The
   entity lists `populateTwins` / `populateGlobalTwins` (`fields/twins.ts`) in
   `hooks.beforeRead` beside `applyTranslations` in `afterChange`; the twin's column rides
   a migration; `tests/admin-config.test.ts` refuses a localized heavy field without its
   twin and a config with a twin without the hook. A localized light field needs nothing
   (rule 4's pass makes it bilingual); a localized array is never added (the design system
   §6a: `localized` goes on a row's subfields, never on the array).
16. **The interface language changes in exactly one place** (ADR-056, the header switch,
   with the account view's select behind it): no `?lang=`, no per-view override, no string
   or component that assumes a direction. A new surface ships with `check:rtl` clean and the
   e2e's axe pass in both languages. Digits Western and dates Riyadh through
   `admin/format.ts`; a technical token inside Arabic (a model id, a path, a key) stays
   Latin, wrapped in `<bdi>` or the pill so it reads left-to-right (ADR-039 and ADR-056
   stand). A control that carries meaning by colour carries its word too; a chrome change is
   measured at 390, 1024, 1280 and 1440 in both languages. **The known gap:** a validator's
   refusal (`inLanguage(req, { ar, en })` inside a `validate` closure, a `Refused` reason in
   a hook) is outside every gate above, since no test can call the closure; it is written
   under the same rules by hand, and a regex over `src/` for `inLanguage(` literals would
   feed those pairs to the checks when the gap is closed.
17. **Icons and colour** (ADR-060, design system §2 and §4). A new tab, collapsible or
   labelled group with a noun of its own carries its icon: a key of `SECTION_ICONS` in
   `admin/icons.ts` (a new icon is a new row there first: a place for a section of the site,
   a noun for a thing, the entity's own icon where the section is one), named through
   `admin: sectionIcon('key')` (or `...sectionIcon('key')` beside `condition` or
   `position`); never twice in one strip, never the entity's own; `describeFields()` draws
   it (`IconTabs` after the tabs field, `SectionLabel` in the Label slot) and the config
   test refuses a tab or a collapsible without one. A screen shows its group's hue in two
   places only, the header's tile and the active tab's bar; on the dashboard a card's title
   icon carries the hue and its body stays neutral; a new icon anywhere else is the text
   colour. A status word is a glossary row and a pair in both trees before it is a pill:
   a drafted collection lists `statusColumn()` (`fields/status.ts`) and a status select of
   its own puts `STATUS_CELL` on its `admin.components.Cell`; the tone comes from
   `STATUS_TONES` (green live, amber draft or changed, red failed, neutral otherwise), never
   from a class in the config. A colour never appears without its word; the e2e counts the
   carriers per document and runs axe at 1440 and 390 in both languages.

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
  failure, amber = careful or a draft. Set Payload's button colours through its custom
  properties. A group's identity hue sits on the header's tile, the active tab's bar and a
  dashboard card's title icon, nowhere else on that screen (rule 17); a status colour on
  the status pill and the `BoolCell` only.
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
